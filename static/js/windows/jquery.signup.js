$(function() {
	var init = function(params) {
		var SignupView = Backbone.View.extend({
			el: $('form.signup'),
			url: '/auth/register',

			events: {
				'click .button-confirm': 'onConfirm',
				'click [data-social]': 'onSocialClick',
				'focus .form-control': 'clearErrors',
			},

			render: function() {
				this.gather = {
					$modal: $('.modal'),
					$groups: this.$el.find('.form-group'),
					$fields: this.$el.find('input'),
					$social: this.$el.find('[data-social]'),
					$controlLabels: this.$el.find('.control-label'),
					$errors: this.$el.siblings('[data-error]')
				};

				this.gather.$fields.val('');
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

			onSocialClick: function(e) {
				e.preventDefault();
				e.stopPropagation();
			},

			clearErrors: function() {
				this.gather.$errors.addClass('hidden');
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

				var pwdCheck;
				var $passwords = this.gather.$fields.filter('[type=password]');

				$passwords.each(function() {
					if (typeof pwdCheck === 'undefined') {
						pwdCheck = this.value;
					} else if (pwdCheck !== this.value) {
						_this.showErrors($passwords);
						isValid = false;
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

		var sView = new SignupView();
		sView.render();
	};

	if (ap.windows.instances['signup']) {
		ap.windows.loaders['signup'] = init;
	} else {
		init();
	}
});
