$(function() {
	var $el = $('.view-offer');
	var lat = $el.data('lat');
	var lng = $el.data('lng');

	var map = new GMaps({
	  div: '.map',
	  lat: lat,
	  lng: lng
	});


	map.addMarker({
	  lat: lat,
	  lng: lng,
	});
});