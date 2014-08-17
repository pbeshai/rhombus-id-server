define([
	// Application.
	"framework/App",

	"apps/SequenceAliaser/Base",
	"apps/SequenceAliaser/Views",
	"apps/SequenceAliaser/States",
],
function (App, Base, Views, States) {
	return _.extend({
		Views: Views,
		States: States
	}, Base);
});