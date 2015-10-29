Dropzone.autoDiscover = false;

var ap = {
	tools: {
		// todo: useful frontend stuff here
	},

	validator: {
		rules: {
			mail: {
				regexp: /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
				min: 3,
				max: 128
			},
			password: {
				min: 4,
				max: 1000,
				regexp: /^.+$/
			},
		},

		validate: function(name, value) {
			if (!ap.validator.rules.hasOwnProperty(name)) {
				return !!value.length;
			} else {
				return value.length >= ap.validator.rules[name].min && 
					value.length <= ap.validator.rules[name].max &&
					(typeof ap.validator.rules[name].regexp !== 'undefined' ? ap.validator.rules[name].regexp.test(value) : true);
			}
		},
	},

	user: function(token, model) {
		Cookies.set('token', token);
		Cookies.set('userID', model.id);
	},

	logout: function() {
		Cookies.remove('token');
		Cookies.remove('userID');
		window.location.href = '/';
	},

	errorHandler: function(data) {
		ap.loading.stop();
		console.error(data);
	},

	redirect: function(url) {
		return window.location.href = url;
	}
};

$(function() {
	ap.loading = {
		$el: $('.loading-overlay'),

		start: function() {
			ap.loading.$el.fadeIn()
		},

		stop: function() {
			ap.loading.$el.fadeOut();
		}
	};

	ap.gateway = function(args) {
		console.log('REQUEST', args.data);
		var data = $.extend({}, args.data);
		var token = Cookies.get('token');

		if (token) {
			data.token = token;
		}

		ap.loading.start();
		$.ajax({
			url: args.url || '',
			data: data,
			method: args.method || 'POST',
			timeout: 10000,

			success: function(response) {
				console.log('RESPONSE', response);
				ap.loading.stop();

				if (typeof data !== 'object') {
					ap.errorHandler(response);
					return;
				}

				if (response.hasOwnProperty('errorCode') && response.errorCode == 401) {
					ap.windows.show('login', {
						error: response.errorCode
					});
					return;
				}

				if (typeof args.success === 'function') {
					args.success(response);
				}
			},

			error: ap.errorHandlers
		});
	};

	ap.model = {};
});