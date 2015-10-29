(function() {
	var init = function(params) {
		var LoginView = Backbone.View.extend({
			el: $('form.login'),
			url: '/auth/login',

			events: {
				'click .button-confirm': 'onConfirm',
				'click [data-social]': 'onSocialClick',
				'focus .form-control': 'clearErrors',
				'click .button-signup': 'onSignupClick'
			},

			render: function() {
				this.gather = {
					$modal: $('.modal'),
					$groups: this.$el.find('.form-group'),
					$fields: this.$el.find('input'),
					$social: this.$el.find('[data-social]'),
					$controlLabels: this.$el.find('.control-label'),
					$error: this.$el.find('[data-error]')
				};

				this.gather.$fields.val('');

				if (params && params.hasOwnProperty('error')) {
					this.gather.$error.filter('[data-error=' + params.error + ']').removeClass('hidden');
				}
			},

			onSignupClick: function(e) {
				e.preventDefault();
				e.stopPropagation();
				ap.windows.show('signup');
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
						password: md5(this.gather.$fields.filter('[name=password]').val())
					},
					url: this.url,
					success: function(data) {
						if (data.success) {
							ap.user(data.token, data.model);
							ap.redirect('/');
							_this.gather.$modal.modal('hide');
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

			onSocialClick: function(e) {
				e.preventDefault();
				e.stopPropagation();
			},

			clearErrors: function() {
				this.gather.$controlLabels.addClass('hidden');
				this.gather.$groups.removeClass('has-error');
			},

			validate: function() {
				var _this = this;
				var isValid = true;

				this.gather.$fields.each(function() {
					if (!ap.validator.validate(this.name, this.value)) {
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

		var lView = new LoginView();
		lView.render();
	};

	$(function() {
		if (ap.windows.instances['login']) {
			ap.windows.loaders['login'] = init;
		} else {
			init();
		}
	});
})();
