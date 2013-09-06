/**

	A place to test things.

*/
define([
	// Application.
	"framework/App",

	"framework/modules/common/Common",

	"framework/modules/Participant",

	"framework/apps/StateApp",
],

function (App, Common, Participant, StateApp) {

	var SequenceAliaser = App.module();

	SequenceAliaser.config = {
		sequenceLength: 4,
		sequenceAliasMap: {
			"AAAD":"leo",
			"AABC":"martha",
			"AACA":"jordan",
			"AADB":"zooey",
			"ABAA":"angie",
			"ABBB":"perry",
			"ABCD":"stiller",
			"ABDC":"pink",
			"ACAC":"halle",
			"ACBD":"lopez",
			"ACCB":"marilyn",
			"ACDA":"spears",
			"ADAB":"aniston",
			"ADBA":"spock",
			"ADCC":"freeman",
			"ADDD":"pitt",
			"BAAA":"will",
			"BABB":"lucy",
			"BACD":"rihanna",
			"BADC":"cera",
			"BBAD":"swift",
			"BBBC":"depp",
			"BBCA":"adele",
			"BBDB":"gosling",
			"BCAB":"jackson",
			"BCBA":"keanu",
			"BCCC":"potter",
			"BCDD":"cruise",
			"BDAC":"arnie",
			"BDBD":"diaz",
			"BDCB":"murray",
			"BDDA":"cruz",
			"CAAB":"bee",
			"CABA":"leia",
			"CACC":"hova",
			"CADD":"scarjo",
			"CBAC":"audrey",
			"CBBD":"elvis",
			"CBCB":"deniro",
			"CBDA":"rdj",
			"CCAA":"holmes",
			"CCBB":"timber",
			"CCCD":"gates",
			"CCDC":"yeezy",
			"CDAD":"jobs",
			"CDBC":"fey",
			"CDCA":"owen",
			"CDDB":"whoopi",
			"DAAC":"portman",
			"DABD":"julia",
			"DACB":"alba",
			"DADA":"liz",
			"DBAB":"maddy",
			"DBBA":"vaughn",
			"DBCC":"oprah",
			"DBDD":"gaga",
			"DCAD":"ellen",
			"DCBC":"marley",
			"DCCA":"ford",
			"DCDB":"bruce",
			"DDAA":"carrey",
			"DDBB":"bond",
			"DDCD":"samuel",
			"DDDC":"mila"
		}
	};

	SequenceAliaser.Instructions = Common.Models.Instructions.extend({
		buttonConfig: {
			A: { description: "A" },
			B: { description: "B" },
			C: { description: "C" },
			D: { description: "D" },
			E: { description: "Clear Sequence", className: "danger" }
		}
	});

	SequenceAliaser.Views.Participant = Common.Views.ParticipantImageDisplay.extend({
		actionAnimations: {
			"A": "pulse",
			"B": "bounce",
			"C": "shake",
			"D": "swing",
			"E": "wobble"
		},

		cssClass: function (model) {
			if (model.get("action")) {
				return "animated " + this.actionAnimations[model.get("action")];
			}
		},

		overlay: function (model) {
			if (model.get("action") && model.get("action") !== "E") {
				return "choice-" + model.get("action").toLowerCase();
			} else if (model.get("choice") === "E" || model.get("action") === "E") {
				return "cancel";
			} else {
				return "highlight animated fadeOut";
			}
		},

		idText: function (model) {
			return model.get("seqAlias");
		},

		mainText: function (model) {
			if (model.get("action") !== "E") {
				if (model.get("action")) {
					return model.get("action");
				}
				if (model.get("seqAlias") == null && model.get("sequence")) {
					// show a dot for each letter in the sequence
					var seq = model.get("sequence");
					var output = "";
					for (var i = 0; i < seq.length; i++) {
						output += "&bull;";
					}
					return output;
				}

			}
		},

		image: function (model) {
			var img = model.get("seqAlias");

			if (img) {
				img = "/app/img/sequence/" + img + ".jpg";
			}
			return img;
		},
	});

	SequenceAliaser.Views.Sequence = App.registerView("seq-alias::sequence", Common.Views.SimpleLayout.extend({
		header: "Sequence Aliaser",
		InstructionsModel: SequenceAliaser.Instructions,
		ParticipantView: SequenceAliaser.Views.Participant,
		acceptNew: true,
		noParticipantsMessage: "",
	}));

	SequenceAliaser.Views.Register = {};
	SequenceAliaser.Views.Register.Participant = Common.Views.ParticipantImageDisplay.extend({
		overlay: function (model) {
			return "green";
		},

		idText: function (model) {
			return model.get("seqAlias");
		},

		mainText: function (model) {
			return "&#x2713;"; // checkmark
		},

		image: function (model) {
			var img = model.get("seqAlias");

			if (img) {
				img = "/app/img/sequence/" + img + ".jpg";
			}
			return img;
		}
	});

	SequenceAliaser.Views.Register.Layout = App.registerView("seq-alias::register", Common.Views.SimpleLayout.extend({
		header: "Registered Aliases",
		ParticipantView: SequenceAliaser.Views.Register.Participant,
		acceptNew: false,
		noParticipantsMessage: "No aliases registered."
	}));

	SequenceAliaser.States = {};
	SequenceAliaser.States.Sequence = StateApp.ViewState.extend({
		name: "sequence-aliaser",
		view: "seq-alias::sequence",

		runAction: function (participant, choice) {
			participant.set("action", choice);
		},

		cancelSequence: function (participant) {
			participant.set({ sequence: null, seqAlias: null, action: "E" });
		},

		updateSequence: function (participant, choice) {
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
			this.listenTo(participants, "update:choice", this.updateSequence);
		},

		onEntry: function (input) {
			this.prevAcceptNew = input.participants.options.acceptNew;
			input.participants.options.acceptNew = true;

			// reset any previous actions
			input.participants.each(function (p) {
				p.unset("action");
			})

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

	SequenceAliaser.States.Register = Common.States.Results.extend({
		name: "register",
		view: "seq-alias::register",
		beforeRender: function () {
			Common.States.Results.prototype.beforeRender.call(this);

			console.log("@@ registering aliases", this);
		}
	});

	return SequenceAliaser;
});