var extend = require('extend');
var fs = require('fs');
// AP means Apartments
// Global class for application

var helper = {
	requirer: function(names) {
		var obj = {};
		for (var key in names) {
			if (names[key] === true) {
				obj[key] = require(key);
			} else {
				obj[key] = require(names[key]);
			}
		}
		return obj;
	},

	expressUse: function(data, app) {
		for (var i=0; i<data.length; i++) {
			app.use(data[i]);
		}
	},

	router: function(controllers, app, context) {
		for (var cName in controllers) {
			var controller = require('../controllers/' + cName);
			var routes = controllers[cName];

			for (var route in routes) {
				var method = routes[route]['method'];
				var action = routes[route]['controller'];

				if (app.hasOwnProperty(method) === true && controller.hasOwnProperty(action) === true) {
					app.use(route, this.authMiddleWare.bind(context)(routes[route]['secure']));
					app[method](route, controller[action].bind(context));
				} else {
					throw new Error('ROUTER: wrong method!');
				}
			}
		}
	},

	authMiddleWare: function(secure) {
		var _this = this;
		var routes = this.express.Router();

		routes.use(function(req, res, next) {
			var token = req.cookies.token || req.body.token || req.query.token || req.headers['x-access-token'];
			var error = function() {
				if (!secure) {
					next();
				} else if (req.xhr) {
					res.json({
						success: false,
						errorCode: 401
					});
				} else {
					res.redirect('/login');
				}
			};

			if (token) {
				_this.jwt.verify(token, _this.config.secret, function(err, decoded) {
					if (err) {
						error();
					} else {
						_this.DB.model.User.findOne({
							mail: decoded
						}, function(err, user) {
							if (err || !user) {
								error();
								return;
							}
							req.user = user;
							next();
						});
					}
				});
			} else {
				error();
			}
		});

		return routes;
	},

	basicFields: {
		validator: {
			rules: {
				mail: {
					regexp: /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
					min: 3,
					max: 128
				}
			},

			validate: function(name, value) {
				if (!this.rules.hasOwnProperty(name) && typeof value === 'string') {
					return !!value.length;
				} else {
					return (this.rules[name].hasOwnProperty('min') ? value.length >= this.rules[name].min : true) && 
						(this.rules[name].hasOwnProperty('max') ? value.length <= this.rules[name].max : true) &&
						(this.rules[name].regexp ? this.rules[name].regexp.test(value) : true);
				}
			},
		},

		checkRequired: function(body, fields, novalidate) {
			var invalid = [];

			for (var i=0; i<fields.length; i++) {
				if (!body.hasOwnProperty(fields[i]) 
					|| typeof body[fields[i]] === 'undefined' 
					|| (!novalidate && !this.validator.validate(fields[i], body[fields[i]]))
				) {
					invalid.push(fields[i]);
				}
			}
			return invalid;
		}
	},

	renderTemplate: function(request, jade, template, params, callback) {
		var data = extend({}, params);

		if (request.user) {
			data.user = extend({}, request.user);
		}

		jade.renderFile(template, data, function(error, html) {
			if (error) {
				throw error;
			}

			if (typeof callback === 'function') {
				callback(html);
			}
		});
	},

	renderLess: function(path, less, callback) {
		fs.readFile(path, 'utf8', function(err, src) {
			if (err) throw err;
			
			less.render(src, callback);
		});
	},

	die: function(response, message) {
		response.json({
			success: false,
			errorMessage: message
		});
	}
};

exports.helper = helper;
exports.tools = require('./tools');