var AP = require('./../classes/AP');

var signUser = function(user, res) {
	var token = this.jwt.sign(user.mail, this.config.secret, {
		expiresInMinutes: 60 * 24 // day
	});

	user.loginTime = new Date();
	user.save(function(err, savedUser) {
		res.json({
			success: true,
			token: token,
			model: {
				id: savedUser.id,
				mail: savedUser.mail
			}
		});
	});
};

exports.login = function(req, res) {
	var _this = this;
	var errors = AP.helper.basicFields.checkRequired(req.body, ['mail', 'password']);

	if (errors.length) {
		res.json({
			success: false,
			errorFields: errors
		});
		return;
	}

	this.DB.model.User.findOne({
		mail: req.body.mail
	}, function(err, user) {
		if (err) {
			throw err;
		}

		if (!user) {
			res.json({
				success: false,
				errorFields: ['mail']
			});
		} else {
			if (req.body.password !== user.password) {
				res.json({
					success: false,
					errorFields: ['password']
				});
			} else {
				signUser.bind(_this)(user, res);
			}
		}
	});
};

exports.register = function(req, res) {
	var _this = this;
	var errors = AP.helper.basicFields.checkRequired(req.body, ['mail', 'password']);

	if (errors.length) {
		res.json({
			success: false,
			errorFields: errors
		});
		return;
	}

	var process = function() {
		var now = new Date();
		var user = new _this.DB.model.User({
			mail: req.body.mail,
			password: req.body.password,
			regTime: now,
			loginTime: now
		});

		user.save(function(err) {
			if (err) {
				throw err;
			}

	    	signUser.bind(_this)(user, res);
		});
	};

	this.DB.model.User.find({
		mail: req.body.mail,
	}, function(err, docs) {
		if (err) throw err;

		if (docs.length === 0) {
			process();
		} else {
			res.json({
				success: false,
				errorFields: ['mail'],
				errorCode: -1
			});
		}
	});
};
