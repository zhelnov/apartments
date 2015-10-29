/* Send mail via this way:
 *
 *	mailer.sendMail({
 *		from: 'noreply@lepo.space', 
 *		to: 'tupidor@netforhack.ru',
 *		subject: 'Test mailer',
 *		html: '<b>Vot moy reliz, mraz</b>'
 *	}, function(err, info) {
 *		if (err) {
 *			throw err;
 *		}
 *		console.log(info);
 *	});
 *
 */

var AP = require('./AP');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport();

var required = [
	'to', 'subject', 'html'
];

var safeExec = function(func) {
	if (typeof func === 'function') {
		return func;
	} else {
		return function() {};
	}
};

exports.sendMail = function(params, callback) {
	var errors = AP.helper.basicFields.checkRequired(params, required, true);

	params.from = params.from || 'noreply@lepo.space';
	callback = safeExec(callback);

	if (errors.length) {
		callback(errors);
	} else {
		transporter.sendMail(params, function(error, info) {
			if(error) {
				callback(error);
			} else {
				callback(null, info);
			}
		});
	}
};