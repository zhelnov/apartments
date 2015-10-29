(function() {
	var init = function(params) {
		var feedbackView = Backbone.View.extend({
			el: $('form.feedback'),
			url: '/feedback',

			events: {
				'click .button-confirm': 'onConfirm',
				'click .button-decline': 'onDecline',
				'focus .form-control': 'clearErrors',
			},

			render: function() {
				this.gather = {
					$modal: $('.modal'),
					$groups: this.$el.find('.form-group'),
					$fields: this.$el.find('input, textarea'),
					$controlLabels: this.$el.find('.control-label'),
					$error: this.$el.find('[data-error]'),
					$steps: this.$el.find('[data-step]'),
				};

				this.gather.$fields.filter('textarea').val('');

				if (params && params.hasOwnProperty('error')) {
					this.gather.$error.filter('[data-error=' + params.error + ']').removeClass('hidden');
				}
			},

			onDecline: function(e) {
				e.preventDefault();
				e.stopPropagation();
				this.gather.$modal.modal('hide');
			},

			showStep: function(step) {
				return this.gather.$steps.addClass('hidden').filter('[data-step=' + step + ']').removeClass('hidden');
			},

			onConfirm: function(e) {
				var _this = this;

				e.preventDefault();
				e.stopPropagation();

				if (!this.validate()) {
					return;
				}

				this.gather.$fields.blur();

				ap.gateway({
					data: {
						mail: this.gather.$fields.filter('[name=mail]').val(),
						name: this.gather.$fields.filter('[name=name]').val(),
						message: this.gather.$fields.filter('[name=message]').val()
					},
					url: this.url,
					success: function(data) {
						if (data.success) {
							_this.showStep(2);
							setTimeout(function(){
								_this.gather.$modal.modal('hide');
							}, 5000);
						} else {
							for(var i in data.errorFields) {
								_this.showErrors(
									_this.gather.$fields.filter('[name=' + data.errorFields[i] + ']')
								);
							}
						}
					}
				});
			},

			clearErrors: function() {
				this.gather.$controlLabels.addClass('hidden');
				this.gather.$groups.removeClass('has-error');
			},

			validate: function() {
				var _this = this;
				var isValid = true;

				this.gather.$fields.each(function() {
					if (!ap.validator.validate(this.name, $(this).val())) {
						isValid = false;
						_this.showErrors($(this));
					} 
				});

				return isValid;
			},

			showErrors: function($el) {
				$el
					.parent('.form-group')
					.addClass('has-error')
					.find('.control-label')
					.removeClass('hidden');
			}

		});

		var lView = new feedbackView();
		lView.render();
	};

	$(function() {
		if (ap.windows.instances['feedback']) {
			ap.windows.loaders['feedback'] = init;
		} else {
			init();
		}
	});
})();
