$(function() {
	var ProfileView = Backbone.View.extend({
		el: $('.profile'),
		urls: {
			profile: '/profile/update'
		},
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
			'focus .form-control': 'clearErrors',
			'change [name=buildingType]': 'onTypeChange',

			'click .nav-tabs li': 'showAction',

			'click .fav-check': 'onFavoritesCheckbox',
			'click .fav-remove': 'onFavoritesRemove'

			//'click .glyphicon-edit': 'onOfferEdit'
		},

		render: function() {
			var _this = this;
			this.gather = {
				$modal: $('.modal'),
				$groups: this.$el.find('.form-group, .input-group'),
				$fields: this.$el.find('.form-control'),
				$controlLabels: this.$el.find('.control-label'),
				$errors: this.$el.siblings('[data-error]'),
				$tabs: this.$el.find('li[data-action]'),
				$actions: this.$el.find('.action[data-action]'),
				$dropzone: this.$el.find('.dropzone'),
				$avatar: this.$el.find('img.avatar'),

				$checkboxes: this.$el.find('.fav-check'),
				$summary: this.$el.find('[data-action=favorites] .summary')
			};

			//this.onTypeChange();

			this.gather.$dropzone.dropzone({
				paramName: 'photo',
				maxFilesize: 5, // MB
				maxFiles: 1,
				dictDefaultMessage: 'Drop new avatar here to update',
				success: function(file, response) {
	                ap.gateway({
					data: {
						avatar: response
					},
					url: this.urls.profile,
					success: function(data) {
						if (data.success) {
							_this.gather.$avatar.attr('src', response)
						}
						_this.gather.$dropzone.remove();
					}
				});
	            }.bind(this)
			});
		},

		onFavoritesRemove: function(e) {
			this.gather.$checkboxes.filter(':checked').each(function() {
				var $this = $(this);
				var _this = this;

				ap.gateway({
					data: {
						id: $this.parents('[data-id]').data('id')
					},
					url: '/profile/favorites/toggle',
					success: function(data) {
						if (data.success) {
							$this.parents('tr').remove();
							_this.onFavoritesCheckbox();
						} 
					}
				});
			});
		},

		onOfferEdit: function(e) {
			var $row = $(e.currentTarget).parents('data-id');
			var encoded = JSON.parse($row.data('offer-json'));

			ap.windows.show('adddOffer', $.extend(encoded, {
				mode: 'edit',
				callback: function(offer) {
					// apply modify
				}
			}));
		},

		onFavoritesCheckbox: function(e) {
			var num = this.gather.$checkboxes.filter(':checked').length;

			this.gather.$summary.toggleClass('hidden', num === 0).find('.total').text(
				num + ' items selected. '
			);
		},

		showAction: function(e) {
			this.gather.$tabs.removeClass('active');
			var step = $(e.currentTarget).addClass('active').data('action');
			return this.gather.$actions.addClass('hidden').filter('[data-action=' + step + ']').removeClass('hidden');
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

			this.gather.$fields.blur();
			var data = this.collectFields();
			
			ap.gateway({
				data: data,
				url: this.urls.profile,
				success: function(data) {
					if (!data.success)  {
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

			data.hideContacts = this.$el.find('[name=hideContacts]').prop('checked');

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

	ap.profile = new ProfileView();
	ap.profile.render();
});
