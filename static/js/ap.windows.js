$(function() {
	
	var Windows = function() {
		this.$modal = $('#modal');
		this.url = '/windows';
		this.instances = {};
		this.loaders = {};
	};

	Windows.prototype.load = function(name) {
		var _this = this;

		ap.gateway({
			url: this.url,
			method: 'GET',
			data: {
				name: name
			},
			success: function(data) {
				_this.onload(name, data);
			}
		});
	};

	Windows.prototype.onload = function(name, data) {
		var $head = $('head');

		if (data.hasOwnProperty('less') && window.less) {
			window.less.render(data['less']).then(function(compiled) {
				if (compiled.hasOwnProperty('css')) {
					$head.append('<style type="text/css">' + compiled['css'] + '</style>');		
				}
			});
		}

		if (data.hasOwnProperty('html')) {
			this.instances[name] = data['html'];
		}

		if (data.hasOwnProperty('css')) {
			$head.append('<link rel="stylesheet" type="text/css" href="' + data['css'] + '" />');
		}

		if (data.hasOwnProperty('js')) {
			eval(data['js']);
		}

		this.appear(name);
	};

	Windows.prototype.show = function(name, params) {
		this.lastParams = params;

		if (this.instances.hasOwnProperty(name)) {
			this.appear(name);
		} else {
			this.load(name);
		}
	};

	Windows.prototype.setHeader = function(str) {
		var header = str || this.$modal.find('[data-header]').data('header');

		if (typeof header !== 'undefined') {
			this.$modal.find('.modal-title').text(header);
		}
	};

	Windows.prototype.appear = function(name) {
		var _this = this;

		this.$modal.find('.modal-body').html(this.instances[name]);
		this.setHeader();

		this.$modal.off('show.bs.modal').on('show.bs.modal', function(e) {
			if (_this.loaders.hasOwnProperty(name)) {
				_this.loaders[name](_this.lastParams);
			}
		}).modal('show');

		this.$modal.off('hidden.bs.modal').on('hidden.bs.modal', function(e) {
			_this.$modal.find('.modal-body').empty();
		});
	};

	ap.windows = new Windows();

});