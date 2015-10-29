$(function() {

	var SearchForm = Backbone.View.extend({
		el: $('.search-form'),
		url: 'map/search',

		geocodeDelay: 1000,
		prevObj: [],

		denialFields: [
			[],
			['roomCount'],
			['floor'],
			['roomCount', 'floor'],
			['roomCount', 'floor'],
			[]
		],
		filters: [
			'price-from', 'price-to', 'room-from', 'room-to', 'floor-from', 'floor-to', 'square-from', 'square-to',
			'keywords', 'buildingType', 'rentType'
		],

		events: {
			'click .button-search': 'onSearch',
			'click .button-reset': 'onReset',
			'focus .form-control': 'clearErrors',
			'change [name=buildingType]': 'onTypeChange'
		},

		render: function() {
			this.gather = {
				$groups: this.$el.find('.form-group'),
				$fields: this.$el.find('input, select'),
				$city: this.$el.find('[name=city]')
			};

			this.gather.$city.autoComplete({
				minChars: 2,
				source: this.onGeocodeComplete.bind(this)
			});
		},

		onGeocodeComplete: function(term, suggest) {
			var _this = this;

			if (this.timeout) {
				clearTimeout(this.timeout);
			}

			this.timeout = setTimeout(function() {
				ap.googleMaps.geoCode(term, function(result) {
					if (result !== false) {
						var map = [];
						_this.prevObj = result;

						for (var i=0; i<result.length; i++) {
							map.push(result[i].formatted_address);
						}

						suggest(map);
					}
				});
			}, this.geocodeDelay);
		},

		findCoordsByString: function(str) {
			for (var i=0; i<this.prevObj.length; i++) {
				if (this.prevObj[i].formatted_address === str) {
					return {
						coords: {
							lat: this.prevObj[i].geometry.location.G,
							lng: this.prevObj[i].geometry.location.K
						}
					};
				}
			}
			return false;
		},

		onTypeChange: function() {
			var curDenial = this.denialFields[this.gatherFieldVal('buildingType')];

			$('[data-name]').each(function() {
				$(this).removeClass('hidden');
			});

			for (var i in curDenial) {
				$('[data-name=' + curDenial[i] + ']').addClass('hidden');
			}
		},

		gatherFieldVal: function(name) {
			var $el = this.gather.$fields.filter('[name=' + name + ']');
			return $el.val();
		},

		collectFilters: function(obj) {
			for (var i in this.filters) {
				var val = this.gatherFieldVal(this.filters[i]);

				if (val !== '' && !$('[data-name=' + this.filters[i] + ']').hasClass('hidden') && val != -1) {
					obj[this.filters[i]] = val;
				}
			}
		},

		onReset: function(e) {
			this.gather.$fields.val();
			ap.googleMaps.clearMap();
		},

		performSearch: function(data) {
			var _this = this;
			ap.gateway({
				data: data,
				url: this.url,
				success: function(data) {
					if (data.success && data.results) {
						$('.search-info')
							.text('Found ' + data.results.length + ' offer(s)');

						var bounds = new google.maps.LatLngBounds ();
						var geo = [];
						for (var i in data.results) {
							bounds.extend (new google.maps.LatLng(data.results[i].geo.lat, data.results[i].geo.lng));
						}

						ap.googleMaps.map.map.fitBounds (bounds);
						ap.user.favorites = data.favorites;
						ap.googleMaps.showResults(data.results);
					} else {
						if (typeof data.errorCode !== 'undefined') {
							_this.gather.$errors.filter('[data-error=' + data.errorCode + ']').removeClass('hidden');
						}

						for(var i in data.errorFields) {
							_this.showErrors(
								_this.gather.$fields.filter('[name=' + data.errorFields[i] + ']')
							);
						}
					}
				}
			});
		},

		onSearch: function(e) {
			e.preventDefault();
			e.stopPropagation();

			if (!this.validate()) return;

			this.gather.$fields.blur();

			var geo = this.findCoordsByString(this.gatherFieldVal('city'));
			var data = {
				geocode: JSON.stringify(geo.coords)
			};

			ap.googleMaps.focusMap(geo);

			this.collectFilters(data);
			this.performSearch(data);
		},

		clearErrors: function() {
			this.gather.$groups.removeClass('has-error');
		},

		validate: function() {
			var _this = this;
			var isValid = true;
			var nums = ['price-from', 'price-to', 'room-from', 'room-to', 'floor-from', 'floor-to', 'square-from', 'square-to'];
			
			for (var i in nums) {
				var val = this.gatherFieldVal(nums[i]);

				if (val !== '' && isNaN(parseInt(val))) {
					this.showErrors(this.gather.$fields.filter('[name=' + nums[i] + ']'));
					isValid = false;
				}
			}

			if (this.gatherFieldVal('city') == '') {
				this.showErrors(this.gather.$fields.filter('[name=city]'));
				return false;
			}
			
			return isValid;
		},

		showErrors: function($el) {
			$el
				.parents('.form-group, .input-group')
				.addClass('has-error')
				.find('.control-label')
				.removeClass('hidden');
		}

	});

	ap.searchForm = new SearchForm();
	ap.searchForm.render();
});
