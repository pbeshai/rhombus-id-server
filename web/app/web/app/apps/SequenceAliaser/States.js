define([
	// Application.
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/StateApp/Module",

	"apps/SequenceAliaser/Base",
	"modules/Alias",

	"apps/SequenceAliaser/Views", // depends on Views to register themselves
],
function (App, Common, StateApp, SequenceAliaser, Alias) {
	var SequenceAliaserStates = {};
	SequenceAliaserStates.Sequence = StateApp.ViewState.extend({
		name: "sequence-aliaser",
		view: "seq-alias::sequence",

		addNewParticipants: function () {
			this.input.participants.addNewParticipants();
		},

		runAction: function (participant, choice) {
			participant.set("action", choice);
		},

		cancelSequence: function (participant) {
			participant.set({ sequence: null, seqAlias: null, action: "E" });
		},

		updateSequence: function (participant) {
			var choice = participant.get("choice");
			participant.set("action", null, { silent: true });

			if (choice === "E") {
				this.cancelSequence(participant);
				return;
			}
			var sequence = participant.get("sequence") || "";

			// already has a sequence, now interpret actions
			if (sequence.length === this.config.sequenceLength) {
				this.runAction(participant, choice);
			} else {
				// add to the sequence
				sequence += choice;

				// final choice in sequence made, so verify it is unqiue and set it.
				if (sequence.length === this.config.sequenceLength) {
					// verify it hasn't already been taken
					var unique = !_.contains(this.participants.pluck("sequence"), sequence);
					if (!unique) {
						console.log("not unique sequence", sequence);
						this.cancelSequence(participant);
						return;
					}

					var alias = this.config.sequenceAliasMap[sequence];

					if (alias) {
						participant.set("seqAlias", alias);

					} else { // invalid sequence, restart
						sequence = null;
						this.cancelSequence(participant);
					}
				}

				participant.set("sequence", sequence);
			}
		},

		beforeRender: function () {
			var participants = this.participants = this.input.participants;

			// listen for setting play
			this.stopListening();
			this.listenTo(participants, "update:choice add", this.updateSequence);
		},

		onEntry: function (input) {
			this.prevAcceptNew = input.participants.options.acceptNew;
			input.participants.options.acceptNew = true;

			// reset any previous actions
			input.participants.each(function (p) {
				p.unset("action");
			});

			StateApp.ViewState.prototype.onEntry.apply(this, arguments);
		},

		onExit: function () {
			// remove those who do not have a seqAlias
			var toRemove = this.participants.reject(function (participant) {
				return participant.get("seqAlias");
			});
			console.log(this.participants, toRemove);
			this.participants.remove(toRemove);
		},

		cleanup: function () {
			StateApp.ViewState.prototype.cleanup.call(this);
			this.participants.options.acceptNew = this.prevAcceptNew;
		},

		viewOptions: function () {
			return {
				participants: this.participants,
			};
		},
	});

	SequenceAliaserStates.Register = Common.States.Results.extend({
		name: "register",
		view: "seq-alias::register",
		beforeRender: function () {

			Common.States.Results.prototype.beforeRender.call(this);

			var aliases = this.participants.map(function (p) {
				return new Alias.Model({ alias: p.get("seqAlias"), participantId: p.get("alias") });
			});

			var participants = this.participants;

			var aliasCollection = new Alias.Collection(aliases);

			// save to the database and update the participants to show if they were saved successfully
			aliasCollection.save({ success: function (collection, data) {
				var duplicates = _.pluck(data.duplicates, "participantId");
				App.controller.participantUpdater.stopIgnoringChanges();
				participants.each(function (p) {
					if (_.contains(duplicates, p.get("alias"))) {
						p.set("saved", false);
					} else {
						p.set("saved", true);
					}
				});
				// ignore any further changes
				App.controller.participantUpdater.ignoreChanges();
			}});
		},

		afterRender: function () {
			Common.States.Results.prototype.afterRender.call(this);
			App.controller.participantUpdater.ignoreChanges(); // no changes in this state.
		},

		cleanup: function () {
			Common.States.Results.prototype.cleanup.call(this);
			this.participants.each(function (p) { p.set("saved", null); });
		}
	});

	return SequenceAliaserStates;
});