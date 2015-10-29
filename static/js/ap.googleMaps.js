$(function() {

	var gmap = Backbone.View.extend({
		el: '.map-canvas',
		maxAreaRadius: 600,

		initialize: function() {
			this.map = new GMaps({
				el: '.map-canvas',
				lat: 0,
				lng: 0,
				disableDefaultUI: true,

		      	click: this.onMapClick.bind(this)
			});

			this.geocoder = new google.maps.Geocoder();
			
			this.geolocate(function(marker) {
				ap.searchForm.performSearch({
					geocode: JSON.stringify(marker)
				});
			});

			$('.areas-add').on('click', this.onAreaAdd.bind(this));
			$('.areas-toggle').on('click', this.onAreaToggle.bind(this));
		},

		onAreaAdd: function(e) {
			e.preventDefault();
			this.initDrawingManager();
		},

		onAreaToggle: function(e) {
			var _this = this;
			e.preventDefault();

			if (this.areasVisible) {
				for (var i in this.areas) {
					this.areas[i].setMap(null);
				}
			} else {
				this.areas = [];
				ap.gateway({
					url: '/profile/watchArea/get',
					success: function(data) {
						if (data) {
							for (var i in data) {
								_this.areas.push(new google.maps.Circle({
									strokeColor: 'black',
									strokeOpacity: 0.5,
									strokeWeight: 2,
									fillColor: 'red',
									fillOpacity: 0.35,
									map: _this.map.map,
									center: data[i].center,
									radius: data[i].radius
							    }));
							}
						} 
					}
				});
			}

			this.areasVisible = !this.areasVisible;
		},

		onAreaDone: function(circle) {
			var radius = circle.getRadius();

			if (radius > this.maxAreaRadius) {
				bootbox.alert('Watch area is too large! Try again...');
				circle.setMap(null);
			} else {
				this.destroyDrawingManager();
				console.log(circle);
				ap.windows.show('addArea', circle);
			}
		},

		initDrawingManager: function() {
			var drawingManager = new google.maps.drawing.DrawingManager({
				drawingMode: google.maps.drawing.OverlayType.CIRCLE,
				drawingControl: false,
				drawingControlOptions: {
					position: google.maps.ControlPosition.TOP_CENTER,
					drawingModes: [
						google.maps.drawing.OverlayType.CIRCLE
					]
				},
				circleOptions: {
					fillColor: 'red',
					fillOpacity: 0.5,
					strokeWeight: 2,
					clickable: true,
					editable: false,
					zIndex: 2
				}
			});

			drawingManager.setMap(this.map.map);
			google.maps.event.addListener(drawingManager, 'circlecomplete', this.onAreaDone.bind(this));

			this.drawingManager = drawingManager;
		},

		destroyDrawingManager: function() {
			if (this.drawingManager) this.drawingManager.setMap(null);
		},

		geolocate: function(callback) {
			var _this = this;

      		GMaps.geolocate({
				success: function(position) {
					_this.map.setCenter(position.coords.latitude, position.coords.longitude);
					if (typeof callback === 'function') {
						callback({
							lat: position.coords.latitude, 
							lng: position.coords.longitude
						});
					}
				}
			});
      	},

		onMapClick: function(e) {
			ap.windows.show('addOffer', { 
				marker: {
					lat: e.latLng.G,
					lng: e.latLng.K,
				},
				callback: this.appearMarker.bind(this)
			});
		},

		appearMarker: function(offer) {
			var marker = this.map.addMarker({
				lat: offer.geo.lat,
				lng: offer.geo.lng,
				details: offer,

				//fences: todo make hide if map rotate
				//outside: same shit

				click: this.onMarkerClick,
				infoWindow: {
					content: this.makeMarkerPreview(offer)
				}
			});

			var colors = ['blue', 'red', 'purple', 'yellow', 'green'];
			marker.setIcon('http://maps.google.com/mapfiles/ms/icons/' + colors[Math.floor(Math.random() * (colors.length-1))] + '-dot.png')

			if (!this.markers) {
				this.markers = [];
			}

			this.markers.push(marker);
		},

		geoCode: function(query, callback) {
			return this.geocoder.geocode({ 
				address: query
			}, function(result, status) { 
				switch(status) {
					case 'OK':
						callback(result);
						break;
					case 'ZERO_RESULTS':
						callback(false);
						break;
				}
			});
		},

		toggleFav: function(isFav, $el) {
			if (!$el.hasClass('favorites')) {
				$el = $el.find('.favorites');
			}
			$el.toggleClass('btn-success', isFav).toggleClass('btn-default', !isFav);
		},

		makeMarkerPreview: function(offer) {
			var $tpl = $('.marker.hidden').clone().removeClass('hidden');

			$tpl.find('.title').text(offer.title);
			$tpl.find('.price').text(offer.price);
			$tpl.find('.descr').text(
				offer.description.substring(0, Math.min(100, offer.description.length))
			);
			$tpl.find('.more').attr('href', '/offer/view/' + offer._id);
			$tpl.find('[data-id]').attr('data-id', offer._id);

			if (ap.user.favorites.indexOf(offer._id) > -1) {
				this.toggleFav(true, $tpl);
			}

			return $tpl.html();
		},

		toggleFavorite: function(id, callback) {
			ap.gateway({
				data: {
					id: id
				},
				url: '/profile/favorites/toggle',
				success: function(data) {
					if (data.success) {
						if (typeof callback === 'function') {
							callback(data.favorite, $('[data-id=' + id + ']'));
						}
					} 
				}
			});
		},
		   
		initMarkersClusterer: function() {
			if (this.markerCluster) {
				this.markerCluster.clearMarkers();
				this.markerCluster.addMarkers(this.markers);	
			} else {
				this.markerCluster = new MarkerClusterer(this.map.map, this.markers);
			}
		},

		clearMap: function() {
			if (!this.markers) return;
			this.markers.forEach(function(val) {
				val.setMap(null);
			});
			this.markers = [];
			this.initMarkersClusterer();
			google.maps.event.trigger(this.map.map, 'resize');
		},

		focusMap: function(geo) {
			this.map.setCenter(geo.coords.lat, geo.coords.lng);
		},

		showResults: function(results) {
			this.clearMap();

			for (var i in results) {
				this.appearMarker(results[i]);
				//this.drawCircle(results[0].geo, results[1].geo);
			}

			this.initMarkersClusterer();
		},

		drawCircle: function(mar1, mar2) {
			var cityCircle = new google.maps.Circle({
				strokeColor: '#FF0000',
				strokeOpacity: 0.8,
				strokeWeight: 2,
				fillColor: '#6699cc',
				fillOpacity: 0.35,
				map: this.map.map,
				center: mar1,
				radius: this.getDistance(mar1, mar2)
			});
		},

		getDistance: function(p1, p2) {
			var rad = function(x) {
				return x * Math.PI / 180;
			};
			var R = 6378137; // Earth’s mean radius in meter
			var dLat = rad(p2.lat - p1.lat);
			var dLong = rad(p2.lng - p1.lng);
			var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			var d = R * c;
			return d; // returns the distance in meter
		}
	});
	
	ap.googleMaps = new gmap();
	ap.googleMaps.render();
	
});