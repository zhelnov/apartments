var AP = require('./../classes/AP');
var geocoder = require('geocoder');

var gatherRequestFields = function(fields, body, data) {
	for (var i in fields) {
		data[fields[i]] = body[fields[i]];
	}
	return data;
};

var getDistance = function(p1, p2) {
	var rad = function(x) {
		return x * Math.PI / 180;
	};
	var R = 6378137; // Earth’s mean radius in meter
	var dLat = rad(p2.lat - p1.lat);
	var dLong = rad(p2.lng - p1.lng);
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	return d; // returns the distance in meter
}

var notifyWatchers = function(offer) {
	var _this = this;
	var now = (new Date()).valueOf();

	this.DB.model.User.find({}, function(err, users) {
		users = users.filter(function(u) {
			return !!u.watchArea.length;
		});

		users.forEach(function(u) {
			u.watchArea.forEach(function(area) {
				if (getDistance(area.center, offer.geo) <= area.radius) {
					
					_this.mailer.sendMail({
						to: u.mail,
						subject: 'Good news, someone placed an offer in your watch area!',
						html: '<h1>Dear ' + (u.firstName ? u.firstName : '') + ' ' + (u.lastName ? u.lastName : 'user') + 
							'!</h1><p>We\'re glad to inform you that some new offer available at your watch area!</p><p><b>Title:</b> <a href="https://lepo.space/offer/view/' +
							offer._id + '">' + offer.title + '</a><br><b>Description: </b>' + offer.description 
							+ '</p><p align="right">Glad to see you again,<br> yours LEPO.</p>'
					});

				}
			});
		});
	});
};

var extractGeo = function(geo, results) {
	var obj = {
		country: '',
		levels: [null, null, null, null, null],
		lat: geo.lat,
		lng: geo.lng,
		raw: JSON.stringify(results)
	};

	var suiteIndex = 0;
	var isPrevAppr = false;

	for (var i in results) {
		if (results[i].geometry.location_type === 'GEOMETRIC_CENTER') {
			suiteIndex = i;
			break;
		} else if (results[i].geometry.location_type === 'APPROXIMATE' && !isPrevAppr) {
			suiteIndex = i;
			isPrevAppr = true;
		}
	}

	var checkLevel = function(array) {
		var str = 'administrative_area_level_';

		for (var i=1; i<=5; i++) {
			if (array.indexOf(str + i) !== -1) {
				return i-1;
			}
		}

		return false;
	};

	for (var i in results[suiteIndex].address_components) {
		if (results[suiteIndex].address_components[i].types.indexOf('country') !== -1) {
			obj.country = results[suiteIndex].address_components[i].short_name;
		} else {
			var lvl = checkLevel(results[suiteIndex].address_components[i].types);

			if (lvl !== false) {
				obj.levels[lvl] = results[suiteIndex].address_components[i].short_name;
			}
		}
	}

	obj.levels = JSON.stringify(obj.levels);
	return obj;
};

exports.addOffer = function(req, res) {
	var _this = this;
	var fields = ['price', 'buildingType', 'rentType', 'title', 'description', 'geocode'];
	var errors = AP.helper.basicFields.checkRequired(req.body, fields);

	if (errors.length) {
		res.json({
			success: false,
			errorFields: errors
		});
		return;
	}

	var now = new Date();
	var geo = JSON.parse(req.body.geocode);

	geocoder.reverseGeocode(geo.lat, geo.lng, function(e, data) {
		if (data.status !== 'OK' || !data.results || !data.results[0]) {
			res.json({
				success: false,
				errorMessage: 'Failed geocoding!'
			});
			return;
		}

		geo = extractGeo(geo, data.results);

		var makePhotos = function() {
			var out = [];
			var ar = JSON.parse(req.body.photos);

			if (!ar) return out;

			for (var i in ar) {
				out.push({
					path: ar[i]
				});
			}

			return out;
		};

		var data = gatherRequestFields(fields, req.body, {
			userId: req.user._id,
			postTime: now,
			modifyTime: now,
			roomCount: req.body.roomCount || null,
			floor: req.body.floor || null,
			square: req.body.square || null,
			country: geo.country,
			photos: makePhotos(),
			geo: geo
		});

		var offer = new _this.DB.model.Offer(data);

		offer.save(function(err, savedOffer) {
			if (err) {
				throw err;
			}

			notifyWatchers.bind(_this)(savedOffer);

			res.json({
				success: true,
				model: savedOffer
			});
		});
	});
};

exports.view = function(req, res) {
	var _this = this;
	var id = req.params.offerID;

	var ObjectId = require('mongoose').Types.ObjectId; 

	this.DB.model.Offer.findOne({
		_id: new ObjectId(id)
	}, function(err, offer) {
		if (err || !offer) {
			res.redirect('back');
			return;
		}

		var data = {
			offer: offer
		};

		var onBuildsComplete = function(err, build) {
			data.buildingType = build.name;

			_this.DB.model.RentType.findOne({
				id: offer.rentType
			}, onRentsComplete);
		};

		var onRentsComplete = function(err, rent) {
			data.rentType = rent.name;

			AP.helper.renderTemplate(req, _this.jade, 'templates/viewOffer.jade', data, function(html) {
				res.send(html);
			});
		};
		
		_this.DB.model.BuildingType.findOne({
			id: offer.buildingType
		}, onBuildsComplete);
	});
};