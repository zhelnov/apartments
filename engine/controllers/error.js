var AP = require('./../classes/AP');

exports.notFound = function(request, response) {
	AP.helper.renderTemplate(request, this.jade, 'templates/404.jade', {}, function(html) {
		response.send(html);
	});
};