/**

	Coin Matching for Peter Danielson's COGS 300 class

*/
define([
	// Application.
	"framework/App",
	"framework/modules/common/Common",

	"apps/SequenceAliaser/Base"
],
function (App, Common, SequenceAliaser) {

	var SequenceAliaserViews = {};

	SequenceAliaserViews.Participant = Common.Views.ParticipantDisplay.extend({
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

	SequenceAliaserViews.Sequence = App.registerView("seq-alias::sequence", Common.Views.SimpleLayout.extend({
		header: "Sequence Aliaser",
		InstructionsModel: SequenceAliaser.Instructions,
		ParticipantView: SequenceAliaserViews.Participant,
		ParticipantsView: Common.Views.ParticipantsGrid.extend({ insertSorted: false }),
		acceptNew: true,
		noParticipantsMessage: "",
	}));

	SequenceAliaserViews.Register = {};
	SequenceAliaserViews.Register.Participant = Common.Views.ParticipantDisplay.extend({
		cssClass: function (model) {
			return "big-message";
		},

		overlay: function (model) {
			if (model.get("saved")) {
				return "green";
			} else if (model.get("saved") === false) {
				return "cancel";
			}
		},

		idText: function (model) {
			return model.get("seqAlias");
		},

		mainText: function (model) {
			if (model.get("saved")) {
				return "&#x2713;"; // checkmark
			}
		},

		image: function (model) {
			var img = model.get("seqAlias");

			if (img) {
				img = "/app/img/sequence/" + img + ".jpg";
			}
			return img;
		}
	});

	SequenceAliaserViews.Register.Layout = App.registerView("seq-alias::register", Common.Views.SimpleLayout.extend({
		header: "Registered Aliases",
		ParticipantView: SequenceAliaserViews.Register.Participant,
		acceptNew: false,
		noParticipantsMessage: "No aliases registered."
	}));


	return SequenceAliaserViews;
});