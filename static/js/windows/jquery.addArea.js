(function() {
	$('.modal-dialog')

	var now = new Date();
	now.setDate(now.getDate() - 1);

	ap.windows.loaders['addArea'] = function(params) {
		$('#dp2, #dp3').datepicker({
			weekStart: 1,
			format: "mm-dd-yyyy",
			onRender: function(date) {
				return date.valueOf() < now.valueOf() ? 'disabled' : '';
			}
		});

		$('.button-confirm').off('click').on('click', function(e) {
			var from = Date.parse($('#dp3').val()),
			 	to = Date.parse($('#dp2').val());

			 if (isNaN(from) || isNaN(to) || from >= to) {
			 	bootbox.alert('Invalid dates, try again!');
			 	return;
			 }

			ap.gateway({
				data: {
					lat: params.center.G,
					lng: params.center.K,
					radius: params.getRadius(),
					timeStart: from,
					timeEnd: to
				},
				url: '/profile/watchArea/add',
				success: function(data) {
					params.setMap(null);
					$('.modal').modal('hide');		
				}
			});
		});

		$('.button-decline').off('click').on('click', function(e) {
			$('.modal').modal('hide');
		});
	};


})();