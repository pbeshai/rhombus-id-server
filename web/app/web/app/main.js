require([
  "framework/main",

  // Application.
  "framework/App",

  "apps/Apps"
],

function (frameworkMain, App, Apps) {
  // load user applications
	App.registerApplications(Apps);

	if (frameworkMain) {
		frameworkMain();
	}
});
