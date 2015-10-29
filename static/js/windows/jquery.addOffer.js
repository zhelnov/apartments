(function() {
	ap.windows.loaders['addOffer'] = function(params) {
		var AddOfferView = Backbone.View.extend({
			el: $('form.add-offer'),
			url: '/offer/add',
			windowParams: params,
			photos: [],

			denialFields: [
				[],
				['roomCount'],
				['floor'],
				['roomCount', 'floor'],
				['roomCount', 'floor'],
				[]
			],

			events: {
				'click .button-confirm': 'onConfirm',
				'click .button-decline': 'onDecline',
				'focus .form-control': 'clearErrors',
				'change [name=buildingType]': 'onTypeChange'
			},

			render: function() {
				this.gather = {
					$modal: $('.modal'),
					$groups: this.$el.find('.form-group, .input-group'),
					$fields: this.$el.find('.form-control'),
					$controlLabels: this.$el.find('.control-label'),
					$errors: this.$el.siblings('[data-error]'),
					$steps: $('.modal [data-step]'),
					$dropzone: this.$el.parent().find('.dropzone')
				};

				if (this.windowParams.mode && this.windowParams.mode === 'edit') {
					// do nothing lol
				}

				this.gather.$fields.not('select').val('');
				this.onTypeChange();

				this.gather.$dropzone.dropzone({
					paramName: 'photo',
					maxFilesize: 5, // MB
					success: function(file, response) {
		                this.photos.push(response);
		            }.bind(this)
				});
			},

			showStep: function(step) {
				return this.gather.$steps.addClass('hidden').filter('[data-step=' + step + ']').removeClass('hidden');
			},

			gatherFieldVal: function(name) {
				var $el = this.gather.$fields.filter('[name=' + name + ']');
				return $el.val();
			},

			onTypeChange: function() {
				var curDenial = this.denialFields[this.gatherFieldVal('buildingType')];

				this.gather.$fields.each(function() {
					$(this).parent().removeClass('hidden');
				});

				for (var i in curDenial) {
					this.gather.$fields.filter('[name=' + curDenial[i] + ']').parent().addClass('hidden');
				}
			},

			onDecline: function(e) {
				e.preventDefault();
				e.stopPropagation();
				this.gather.$modal.modal('hide');
			},

			onConfirm: function(e) {
				var _this = this;

				e.preventDefault();
				e.stopPropagation();

				if (!this.validate()) {
					return;
				}

				this.gather.$fields.blur();

				var data = this.collectFields();

				data.geocode = JSON.stringify(this.windowParams.marker);
				data.photos = JSON.stringify(this.photos);

				ap.gateway({
					data: data,
					url: this.url,
					success: function(data) {
						if (data.success) {
							_this.showStep(2);
							if (typeof _this.windowParams.callback === 'function') {
								_this.windowParams.callback(data.model);
							}
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

			collectFields: function() {
				var data = {};

				this.gather.$fields.each(function() {
					var $this = $(this);

					if (!$this.parent().hasClass('hidden')) {
						data[$this.attr('name')] = $this.val();
					}
				});

				return data;
			},

			clearErrors: function() {
				this.gather.$errors.addClass('hidden');
				this.gather.$controlLabels.addClass('hidden');
				this.gather.$groups.removeClass('has-error');
			},

			validate: function() {
				var _this = this;
				var isValid = true;

				this.gather.$fields.not('.hidden').each(function() {
					if (!ap.validator.validate(this.name, this.value) && !$(this).parent().hasClass('hidden')) {
						isValid = false;
						_this.showErrors($(this));
					} 
				});

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

		var aoView = new AddOfferView();
		aoView.render();
		ap.addOffer = aoView;
	};
})();
