require([
  "framework/main",

  // Application.
  "framework/App",

  "Router",

  "/api/apps", // get the dynamically generated dependencies for apps
],

function (frameworkMain, App, Router, Apps) {
  // load user applications
	App.registerApplications(Apps);

	if (frameworkMain) {
		frameworkMain(App, Router);
	}
});
