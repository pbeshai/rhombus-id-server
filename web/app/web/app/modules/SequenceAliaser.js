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
	    "CCDC":"kanye",
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
			"D": "swing"
		},

		cssClass: function (model) {
			if (model.get("action") && model.get("action") !== "E") {
				return "animated " + this.actionAnimations[model.get("action")];
			}
		},

		overlay: function (model) {
			if (model.get("action") && model.get("action") !== "E") {
				return "choice-" + model.get("action").toLowerCase();
			} else if (model.get("choice") === "E" || model.get("action") === "E") {
				return "cancel animated fadeOut";
			} else {
				return "highlight animated fadeOut";
			}
		},

		idText: function (model) {
			return model.get("seqAlias");
		},

		mainText: function (model) {
			if (model.get("action") !== "E") {
				return model.get("action");
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

	SequenceAliaser.Views.Layout = App.registerView("seq-alias::layout", Common.Views.SimpleLayout.extend({
		header: "Sequence Aliaser",
		// ParticipantView: SequenceAliaser.Views.Participant,
		InstructionsModel: SequenceAliaser.Instructions,
		ParticipantView: SequenceAliaser.Views.Participant,
		acceptNew: true,
	}));

	SequenceAliaser.State = StateApp.ViewState.extend({
		name: "sequence-aliaser",
		view: "seq-alias::layout",

		runAction: function (participant, choice) {
			console.log("running action", choice);
			participant.set("action", choice);
		},

		updateSequence: function (participant, choice) {
			participant.set("action", null, { silent: true });

			if (choice === "E") {
				participant.set({ sequence: null, seqAlias: null, action: null });
				return;
			}
			var sequence = participant.get("sequence") || "";

			// already has a sequence, now interpret actions
			if (sequence.length === this.config.sequenceLength) {
				this.runAction(participant, choice);
			} else {
				// add to the sequence
				sequence += choice;

				// final choice in sequence made, so
				if (sequence.length === this.config.sequenceLength) {
					var alias = this.config.sequenceAliasMap[sequence];

					if (alias) {
						participant.set("seqAlias", alias);

					} else { // invalid sequence, restart
						sequence = null;
						this.runAction(participant, "E"); // as if they canceled
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

			StateApp.ViewState.prototype.onEntry.apply(this, arguments);
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

	SequenceAliaser.Views.AppControls = Common.Views.AppControls.extend({
		template: "app/templates/sequence_aliaser/controls",
		events: {
			"click .register-aliases" : "registerAliases"
		},

		registerAliases: function () {
			console.log("@@ registering aliases", this);
		}
	});

	return SequenceAliaser;
});