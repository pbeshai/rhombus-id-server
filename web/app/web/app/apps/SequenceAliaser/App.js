
define([
	// Application.
	"framework/App",

	"framework/modules/StateApp/Module",
	"framework/modules/common/CommonStateApps",
	"apps/SequenceAliaser/Module"
],

function (App, StateApp, CommonStateApps, SequenceAliaser) {

	var SequenceAliaserApp = CommonStateApps.BasicApp.extend({
		id: "seq-alias",
		version: "1.0",
		config: SequenceAliaser.config,
		States: [ SequenceAliaser.States.Sequence, SequenceAliaser.States.Register ],
		prepend: { },

		initStateOptions: function () {
			this.stateOptions[0] = { participants: this.get("participants") };
		}
	});

	// description for use in router
	SequenceAliaserApp.app = {
		instantiate: function (attrs) {
			return new SequenceAliaserApp(attrs, { writeLogAtEnd: false, autoAddNew: true });
		},
		AppControlsView: SequenceAliaser.Views.AppControls,
		title: "Sequence Aliaser"
	};

	return SequenceAliaserApp;
});