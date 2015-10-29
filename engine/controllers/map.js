
var AP = require('./../classes/AP');
var geocoder = require('geocoder');

var greq;
var gres;
var filters = [
	'price-from', 'price-to', 'room-from', 'room-to', 'floor-from', 'floor-to', 'square-from', 'square-to',
	'keywords', 'buildingType', 'rentType'
];

exports.map = function (request, response) {
	var _this = this;
	
	this.DB.model.BuildingType.find({}, function(err, builds) {
		_this.DB.model.RentType.find({}, function(err, rents) {
			var data = {
				buildingTypes: builds,
				rentTypes: rents,
				isMap: true
			};

			AP.helper.renderTemplate(request, _this.jade, 'templates/map.jade', data, function(html) {
				response.send(html);
			});
		});
	});
};

exports.search = function (req, res) {
	gres = res;
	greq = req;
	var geo = JSON.parse(req.body.geocode);

	geocoder.reverseGeocode(geo.lat, geo.lng, onGeoReady.bind(this));
};

var extractCountry = function(data) {
	if (data.status === 'OK' && data.results) {
		for (var i in data.results[0].address_components) {
			if (!data.results[0].address_components.length) continue;
			if (data.results[0].address_components[i].types.indexOf('country') !== -1) {
				return data.results[0].address_components[i].short_name;
			}
		}
	}
	return null;
};

var extractLevels = function(results) {
	var obj = {
		country: null,
		levels: []
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

	return obj;
};

var filterResults = function(results) {
	var fmap = {};

	for (var i in filters) {
		if (greq.body[filters[i]]) {
			fmap[filters[i]] = true;
		}
	}

	var getVal = function(val) {
		return greq.body[val];
	};

	var findInText = function(offer, keys) {
		var kwAr = keys.split(' ');

		for (var i in kwAr) {
			if (offer.title.indexOf(kwAr[i]) !== -1 || offer.description.indexOf(kwAr[i]) !== -1) {
				return true;
			}
		}

		return false;
	};

	return results.filter(function(offer) {
		for (var i in fmap) {
			if (fmap[i] === true) {
				switch(i) {
					// WHAT A FUCKING SHAME, PROGRAMMER?!?!?
					case 'price-from': if (offer.price < getVal(i)) return false;
					break;
					case 'price-to': if (offer.price > getVal(i)) return false;
					break;
					case 'room-from': if (offer.roomCount < getVal(i)) return false;
					break;
					case 'room-to': if (offer.roomCount > getVal(i)) return false;
					break;
					case 'floor-from': if (offer.floor < getVal(i)) return false;
					break;
					case 'floor-to': if (offer.floor > getVal(i)) return false;
					break;
					case 'square-from': if (offer.square < getVal(i)) return false;
					break;
					case 'square-to': if (offer.square > getVal(i)) return false;
					break;
					case 'keywords':
						if (!findInText(offer, getVal(i))) return false;
					break;
					case 'buildingType': if (offer.buildingType != getVal(i)) return false;
					break;
					case 'rentType': if (offer.rentType != getVal(i)) return false;
					break;
				}
			}
		}
		return true;
	});
};

var filterGeo = function(geoStamp, results) {
	return results.filter(function(offer) {
		for (var i in geoStamp.levels) {
			if (offer.geo.levels.indexOf(geoStamp.levels[i]) !== -1) {
				return true;
			}
		}
		return false;
	});
};

var onGeoReady = function(err, data) {
	if (err) {
		die(gres, 'Geo error');
		return;
	}

	var geoStamp = extractLevels(data.results);

	if (!geoStamp.country) {
		die(gres, 'Geo error');
		return;
	}

	this.DB.model.Offer.find({
		country: geoStamp.country
	}, function(err, result) {
		if (err) {
			die(gres, 'DB error!');
			return;
		}

		result = filterGeo(geoStamp, result);
		result = filterResults(result);

		var favorites = [];


		if (greq.user) {
			var ObjectId = require('mongoose').Types.ObjectId; 
			var favId = greq.user.favoriteOffer.map(function(fav) {
				return new ObjectId(fav.offerId);
			});

			result.forEach(function(el, elI) {
				favId.forEach(function(fa) {
					if (fa + '' == el._id + '') {
						favorites.push(el._id + '');
					}
				});
			});

		}

		gres.json({
			success: true,
			results: result,
			favorites: favorites
		});
	});
};