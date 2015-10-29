var AP = require('./../classes/AP');

var ObjectId = require('mongoose').Types.ObjectId;

exports.profile = function(req, res) {
	var _this = this;
	var data = {
		favorites: req.user.favoriteOffer
	};

	var onBuildsComplete = function(err, builds) {
		data.buildingTypes = builds;

		_this.DB.model.RentType.find({}, onRentsComplete);
	};

	var onRentsComplete = function(err, rents) {
		data.rentTypes = rents;

		_this.DB.model.Offer.find({
			userId: new ObjectId(req.user._id)
		}, onOffersComplete);
	};

	var onOffersComplete = function(err, offers) {
		if (err) throw err;

		data.offers = offers;

		AP.helper.renderTemplate(req, _this.jade, 'templates/profile.jade', data, function(html) {
			res.send(html);
		});
	};
	
	this.DB.model.BuildingType.find({}, onBuildsComplete);
};

exports.update = function(req, res) {
	var allowed = ['firstName', 'lastName', 'avatar', 'hideContacts', 'about', 'phone'];

	var user = this.DB.model.User.findOne({ mail: req.user.mail }, function(err, user) {
		if (err || !user) {
			res.json({
				success: false
			});
			return;
		}

		allowed.forEach(function(val) {
			if (req.body.hasOwnProperty(val)) {
				user[val] = req.body[val];
			}
		});


		user.save(function(err) {
			if (!err) {
				res.json({
					success: true
				});
			}
		});
	});
};

exports.toggleFavorite = function(req, res) {
	var _this = this;
	if (!req.body.id) {
		res.json({
			success: false
		});
	} else {
		var oId = new ObjectId(req.body.id);
		var ind = -1;

		for (var i in req.user.favoriteOffer) {
			if (req.user.favoriteOffer[i].offerId + '' == oId + '') {
				ind = i;
			}
		}

		if(ind > -1) {
			req.user.favoriteOffer[ind].remove();
			req.user.save(function(err) {
				if (err) throw err;

				res.json({
					success: true,
					favorite: false
				});
			});
		} else {
			this.DB.model.Offer.findOne({
				_id: oId
			}, function(err, offer) {
				if (err) throw err;

				_this.DB.model.User.findOne({
					_id: new ObjectId(offer.userId)
				}, function(err, user) {
					if (err) throw err;

					req.user.favoriteOffer.push({
						offerId: req.body.id,
						mail: user.mail,
						title: offer.title,
						addTime: new Date(),
						comment: ''
					});

					req.user.save(function(err) {
						if (err) throw err;

						res.json({
							success: true,
							favorite: true
						});
					});
				});
			});
		}
	}
};

exports.addWatchArea = function(req, res) {
	var errors = AP.helper.basicFields.checkRequired(req.body, [
		'lat', 'lng', 'radius', 'timeStart', 'timeEnd'
	]);

	if (errors.length) {
		res.json({
			success: false,
			errorFields: errors
		});
		return;
	}

	if (req.user.watchArea.length > 5) {
		res.json({
			success: false,
			message: 'Too much areas already'
		});
		return;	
	}

	req.user.watchArea.push({
		center: {
			lat: req.body.lat,
			lng: req.body.lng
		},
		radius: Math.min(req.body.radius, 600),
		timeStart: req.body.timeStart,
		timeEnd: req.body.timeEnd
	});

	req.user.save(function(err) {
		if (err) throw err;

		res.json({
			success: true
		});
	});
};


exports.getWatchAreas = function(req, res) {
	res.json(req.user.watchArea);
};