var AP = require('./../classes/AP');
var less = require('less');

exports.index = function (request, response) {
	AP.helper.renderTemplate(request, this.jade, 'templates/landing.jade', {}, function(html) {
		response.send(html);
	});
};

exports.login = function (request, response) {
	var _this = this;
	
	if (request.user) {
		response.redirect('/');
		return;
	}

	AP.helper.renderLess('./static/css/windows/login.less', less, function(err, src) {
		if (err) throw err;

		AP.helper.renderTemplate(request, _this.jade, 'templates/windows/block.login.jade', {
			withFrame: true,
			css: src.css
		}, function(html) {
			response.send(html);
		});
	});
};

exports.register = function (request, response) {
	var _this = this;

	if (request.user) {
		response.redirect('/');
		return;
	}

	AP.helper.renderLess('./static/css/windows/login.less', less, function(err, src) {
		if (err) throw err;

		AP.helper.renderTemplate(request, _this.jade, 'templates/windows/block.signup.jade', {
			withFrame: true,
			css: src.css
		}, function(html) {
			response.send(html);
		});
	});
};

exports.feedback = function (req, res) {
	var fields = ['mail', 'name', 'message'];

	var errors = AP.helper.basicFields.checkRequired(req.body, fields);

	if (errors.length) {
		res.json({
			success: false,
			errorFields: errors
		});
		return;
	}

	var rec = new this.DB.model.Feedback({
		mail: req.body.mail,
		name: req.body.name,
		message: req.body.message,
		date: new Date()
	});

	rec.save(function(err) {
		if (err) {
			res.json({
				success: false,
				errorFields: errors
			});
		} else {
			res.json({
				success: true
			});
		}
	});
};