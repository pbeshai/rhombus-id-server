/**

Registering participants

*/
define([
	"framework/App",
	"modules/Participant"
],
function(app, Participant) {

	var Register = app.module();

	function updateModel(data, alias) {
		// check if we already have this guy
		var exists = this.collection.find(function (elem) {
			return elem.get("participantId") === data.id;
		});

		if (exists) {
			var message = data.id + " is already mapped to " + exists.get("alias");
			console.log(message);
			$("<div class='alert fade in'>"+message+"</div>").appendTo(this.$(".alert-container").empty()).alert();
			return false;
		}

		this.model.set("participantId", data.id);
		if (alias) {
			this.model.set("alias", alias);
		}
		return true;
	}

	Register.Views.FormRegistration = Backbone.View.extend({
		template: "app/templates/register/form",

		events: {
			"click .register-submit" : "register",
			"change .participant-id": "hideAlert"
		},

		hideAlert: function () {
			this.$(".alert").alert('close');
		},

		listenForId: function (event) {
			console.log("listen for participant id", this);
			this.model.set("participantId", "");
			this.$("input.participant-id").attr("placeholder", "Listening...").prop("disabled", true);
			// should be listenToOnce
			this.listenTo(app.controller.participantServer, "data", function (data) {
				this.cancelListen();
				console.log(data[0]);
				this.$(".listen-participant-id").trigger("to-state1");

				updateModel.apply(this, [data.choices[0]]);
			});
		},


		cancelListen: function () {
			console.log("cancel");
			this.stopListening(app.controller.participantServer, "data");
			this.$("input.participant-id").removeAttr("placeholder").prop("disabled", false);
		},

		register: function (event) {
			event.preventDefault();

			var participantId = this.$("input.participant-id").val();
			var alias = this.$("input.alias").val();

			this.model.set({
				"participantId": participantId,
				"alias": alias
			});

			this.trigger("save-registration", this.model);
		},

		afterRender: function () {
			this.$(".listen-participant-id").toggleButton({
				textState1: "Listen",
				textState2: "Cancel",
				clickState1: this.listenForId,
				clickState2: this.cancelListen
			});
		},

		initialize: function () {
			_.bindAll(this, "listenForId", "cancelListen");
			this.listenTo(this.model, {
				change: function () {
					console.log("model changed!");
					this.$("input.participant-id").val(this.model.get("participantId"));
					this.$("input.alias").val(this.model.get("alias"));
				}
			});
		}
	});

	Register.Views.AutoRegistration = Backbone.View.extend({
		template: "app/templates/register/auto",
		idPrefix: "Clicker",
		counter: 1,

		events: {
			"click .auto-register-submit" : "register",
			"change .prefix" : "updatePrefix",
			"change .participant-id": "hideAlert"
		},

		serialize: function () {
			return {
				model: this.model,
				prefix: this.idPrefix
			};
		},

		afterRender: function () {
			this.$(".auto-start-btn").toggleButton({
				classState1: "btn-success",
				classState2: "btn-danger",
				textState1: "Start",
				textState2: "Stop",
				clickState1: this.startAuto,
				clickState2: this.stopAuto
			});
		},

		initialize: function () {
			_.bindAll(this, "startAuto", "stopAuto");

			this.listenTo(this.model, {
				change: function () {
					this.$("input.participant-id").val(this.model.get("participantId"));
					this.$("input.alias").val(this.model.get("alias"));
				}
			});
		},

		generateAlias: function () {

			var num = this.counter;
			if (num >= 0 && num < 10) { // add leading 0
				num = "0" + num;
			}

			return this.idPrefix + num;
		},

		updatePrefix: function () {
			var prefixVal = this.$("input.prefix").val();

			if (this.idPrefix !== prefixVal) {
				this.idPrefix = prefixVal; // update the value to match the textfield

				// update alias to use new prefix
				if (!_.isEmpty(this.model.get("alias"))) {
					this.model.set("alias", this.generateAlias());
				}

				return true; // updated
			}

			return false; // no update
		},

		hideAlert: function () {
			this.$(".alert").alert('close');
		},

		startAuto: function () {
			this.listenTo(app.controller.participantServer, "data", function (data) {
				// ensure the prefix is up to date
				var prefixChanged = this.updatePrefix();

				if (!prefixChanged && this.model.get("participantId") === data.choices[0].id) {
					// no prefix change, but same ID came in => save
					this.register();
				} else {
					updateModel.apply(this, [data.choices[0], this.generateAlias()]);
				}
			});
		},

		stopAuto: function () {
			this.stopListening(app.controller.participantServer, "data");
		},

		register: function (event) {
			if (event) {
				event.preventDefault();
			}

			var participantId = this.$("input.participant-id").val();
			var alias = this.$("input.alias").val();

			this.model.set({
				"participantId": participantId,
				"alias": alias
			});

			this.counter += 1;

			this.trigger("save-registration", this.model);
		}
	});

	Register.Views.Register = Backbone.View.extend({
		tagName: "div",
		template: "app/templates/register/register",
		registrationViews: {},

		events: {
			"click .manual-reg-btn" : "manualRegistration",
			"click .auto-reg-btn" : "autoRegistration",
		},

		serialize: function () {
		},

		beforeRender: function () {
			this.insertViews({
				".participants": new Participant.Views.Table({ participants: this.options.participants }),
				".register-participant": this.currentView
			});
		},

		initialize: function () {
			this.currentView = new Register.Views.FormRegistration({ model: new Participant.Model(), collection: this.options.participants });

			this.on("save-registration", this.register);
		},

		register: function (participant) {
			console.log("registering ", participant.get("participantId"), participant.get("alias"));

			var participants = this.options.participants;
			var saved = participant.save(null, {
				success: function () {
					console.log("successfully saved!");
					participants.fetch();
					participant.clear();
				},
				error: function () {
					console.log("error saving", arguments);
				}
			});

			if (!saved) {
				console.log("didn't save: " +participant.validationError);
			}
		},

		updateRegistrationView: function () {
			this.setView(".register-participant", this.currentView);
			this.currentView.render();
		},

		manualRegistration: function () {
			if (!(this.currentView instanceof Register.Views.FormRegistration)) {
				this.currentView = new Register.Views.FormRegistration({ model: new Participant.Model(), collection: this.options.participants });
				this.updateRegistrationView();
			}
		},

		autoRegistration: function () {
			if (!(this.currentView instanceof Register.Views.AutoRegistration)) {
				this.currentView = new Register.Views.AutoRegistration({ model: new Participant.Model(), collection: this.options.participants });
				this.updateRegistrationView();
			}
		}
	});

	return Register;
});