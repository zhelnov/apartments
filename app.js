var AP = require('./engine/classes/AP');

var core = AP.helper.requirer({
	// public libraries
	extend: true,
	express: true,
	jade: true,
	cors: true,
	url: true,
	morgan: true,
	session: true,
	crypto: true,
	multer: true,
	fs: true,
	cookieParser: 'cookie-parser',
	bodyParser: 'body-parser',
	jwt: 'jsonwebtoken',

	// internal classes
	DB: './DB',
	config: './../../config',
	mailer: './mailer'
});


(function() {
	var _this = this;
	var app = this.express();

	AP.helper.expressUse([
		this.cors(),
		this.cookieParser(),
		this.express.static(__dirname + '/static/files/'), // for photos
		this.bodyParser.urlencoded({ extended: false }),
		this.bodyParser.json(),
		this.morgan('dev'),
	], app);

	AP.helper.router({
		main: {
			'/': {
				method: 'get',
				controller: 'index'
			},
			'/login': {
				method: 'get',
				controller: 'login'
			},
			'/register': {
				method: 'get',
				controller: 'register'
			},
			'/feedback': {
				method: 'post',
				controller: 'feedback'
			}
		},

		map: {
			'/map': {
				method: 'get',
				controller: 'map'
			},
			'/map/search': {
				method: 'post',
				controller: 'search'
			}
		},

		auth: {
			'/auth/login': {
				method: 'post',
				controller: 'login'
			},
			'/auth/register': {
				method: 'post',
				controller: 'register'
			}
		},

		offer: {
			'/offer/add': {
				method: 'post',
				controller: 'addOffer',
				secure: true
			},
			'/offer/view/:offerID': {
				method: 'get',
				controller: 'view'
			}
		},

		user: {
			'/profile/': {
				method: 'get',
				secure: true,
				controller: 'profile'
			},
			'/profile/update': {
				method: 'post',
				secure: true,
				controller: 'update'
			},
			'/profile/favorites/toggle': {
				method: 'post',
				secure: true,
				controller: 'toggleFavorite'
			},
			'/profile/watchArea/add': {
				method: 'post',
				secure: true,
				controller: 'addWatchArea'
			},
			'/profile/watchArea/get': {
				method: 'post',
				secure: true,
				controller: 'getWatchAreas'
			}
		},

		windowsProxy: {
			'/windows': {
				method: 'get',
				controller: 'windowsProxy'
			}
		},

		error: {
			'*': {
				method: 'get',
				controller: 'notFound'
			}
		}
	}, app, this);

	var server = app.listen(3000, function() {
		console.log('Listen to port %s', server.address().port);
	});

}).bind(core)();

