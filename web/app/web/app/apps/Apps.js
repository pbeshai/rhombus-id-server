/**
	collection of all apps. Used by the router.
*/
define([
	"framework/App",

	"apps/GridApp",
	"apps/SequenceAliaserApp"
],
function (App, GridApp, SequenceAliaserApp) {

	var Apps = {
		"grid": GridApp.app,
		"seq-alias": SequenceAliaserApp.app,
	};

	return Apps;
});