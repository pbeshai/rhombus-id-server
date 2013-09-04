require([
  "framework/main",

  // Application.
  "framework/App",

  "Router",

  "apps/Apps"
],

function (frameworkMain, App, Router, Apps) {
  // load user applications
	App.registerApplications(Apps);

	if (frameworkMain) {
		frameworkMain(App, Router);
	}
});
