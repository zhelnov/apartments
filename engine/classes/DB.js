/**
 * Created by User on 27.06.2015.
 *
 * Provides work with database
 */

var AP = require('./AP');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test');

var DB = mongoose.connection;
var SCHEMA = mongoose.Schema;
var MODEL = mongoose.model.bind(mongoose);
var ID = mongoose.Schema.ObjectId;

DB.on('error', console.error.bind(console, 'Error: '));
DB.once('open', function(){
	console.log('mongoose + MongoDB connected!');
});


var schema = {
	// пользователи
	user: new SCHEMA({
		mail: String,
		password: String,

		firstName: String,
		lastName: String,
		phone: String,
		about: String,

		regTime: Date,
		loginTime: Date,
		
		hideContacts: {type: Boolean, default: false},
		status: {type: String, default: 'new', enum: ['active', 'new', 'blocked']},
		avatar: String,

		// избранные предложения
		favoriteOffer: [{
			offerId: ID,
			mail: String,
			title: String,
			addTime: Date,
			comment: String
		}],

		// запросы контактов по предложениям
		request: [{
			userId: ID, // id юзера, от кого пришел запрос
			offerId: ID,
			message: String,
			addTime: Date,
			readTime: Date,
			status: {type: String, default: 'unread', enum: [
				'unread',
				'read',
				'accepted',
				'declined'
			]},
		}],

		// слежка за областями
		watchArea: [{
			center: {
				lat: Number,
				lng: Number
			},
			radius: Number,

			timeStart: Date,
			timeEnd: Date
		}]
	}),

	// типы помещений и аренды, типы событий для таблицы времени
	buildingType: new SCHEMA({
		id: Number,
		name: String
	}),
	rentType: new SCHEMA({
		id: Number,
		name: String
	}),
	statEvent: new SCHEMA({
		id: Number,
		name: String
	}),

	// собственно предложения на карте
	offer: new SCHEMA({
		userId: ID,

		buildingType: Number,
		rentType: Number,
		price: Number,
		roomCount: {type: Number, default: 0},
		floor: {type: Number, default: 0},
		square: Number,

		country: String,
		geo: {
			lat: Number,
			lng: Number,
			levels: String, //json
			raw: String
		},

		postTime: Date,
		modifyTime: Date,

		title: String,
		description: String,
		
		// комментарии
		comments: [{
			parentId: ID,
			userId: ID,
			text: String,
			rate: Number,
			postTime: Date
		}],
		// фотографии (также фото и комментов попададают сюда)
		photos: [{
			isFromComment: {type: Boolean, default: false},
			path: String
		}]
	}),

	feedback: new SCHEMA({
		mail: String,
		name: String,
		message: String,
		date: Date
	})
};

var model = (function(schema) {
	var model = {};

	for (var key in schema) {
		var name = AP.tools.capitalize(key);
		model[name] = MODEL(name, schema[key]);
	}

	return model;
})(schema);

exports.model = model;