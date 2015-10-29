var AP = require('./../classes/AP');
var fs = require('fs');

var WindowsProxy = function(name, request, response, jade, DB) {
	var data = {
		success: true
	};

	var allowedWindows = {
		login: {
			less: true,
			js: true
		},
		signup: {
			less: './static/css/windows/login.less',
			js: true
		},
		addOffer: {
			less: true,
			js: true,
			params: function(render) {
				DB.model.BuildingType.find({}, function(err, builds) {
					DB.model.RentType.find({}, function(err, rents) {

						render({
							buildingTypes: builds,
							rentTypes: rents
						});
						
					});
				});
			}
		},
		feedback: {
			less: true,
			js: true
		},
		addArea: {
			js: true,
			less: true
		}
	};

	var renderTemplate = function(params) {
		AP.helper.renderTemplate(request, jade, 
			'templates/windows/block.' + name + '.jade', 
			params ? params: {},
			onTemplateReady
		);
	};

	var onTemplateReady = function(html) {
		if (!html) {
			endPoint(false);
		} else {
			data['html'] = html;
			
			if (allowedWindows[name].hasOwnProperty('css')) {
				data['css'] = allowedWindows[name]['css'] === true ? 'css/windows/' + name + '.css' : allowedWindows[name]['css'];
			}
			getJs();
		}
	};

	var getJs = function() {
		if (allowedWindows[name].hasOwnProperty('js')) {
			var path = allowedWindows[name]['js'] === true ? './static/js/windows/jquery.' + name + '.js' : allowedWindows[name]['js'];
			fs.readFile(path, 'utf8', onJsReady);
		} else {
			getLess();
		}
	};

	var onJsReady = function(err, jsSource) {
		if (err) throw err;

		data['js'] = jsSource;
		getLess();
	};

	var getLess = function() {
		if (allowedWindows[name].hasOwnProperty('less')) {
			var path = allowedWindows[name]['less'] === true ? './static/css/windows/' + name + '.less' : allowedWindows[name]['less'];

			fs.readFile(path, 'utf8', onLessReady);
		} else {
			endPoint(data);
		}
	};

	var onLessReady = function(err, lessSource) {
		if (err) throw err;

		data['less'] = lessSource;
		endPoint(data);
	};

	var endPoint = function(obj) {
		if (obj === false) {
			response.json({
				success: false,
				message: 'Error'
			});
		} else {
			response.json(obj);
		}
	};

	if (!name || !allowedWindows.hasOwnProperty(name)) {
		endPoint(false);
	} else if (typeof allowedWindows[name].params === 'function') {
		allowedWindows[name].params(renderTemplate);
	} else {
		renderTemplate();
	}
};


exports.windowsProxy = function(req, res) {
	new WindowsProxy(req.query['name'], req, res, this.jade, this.DB);
};