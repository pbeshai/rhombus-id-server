define([
  // Application.
  "framework/App",

  "framework/Router",

  "modules/Register",

  "modules/Alias"
],

function (App, fwRouter, Register, Alias) {

  // Defining the application router, you can attach sub routers here.
  var Router = fwRouter.extend({
    initialize: function () {
      fwRouter.prototype.initialize.call(this);

      this.aliasCollection = new Alias.Collection();
    },

    routes: _.extend({}, fwRouter.prototype.routes, {
      "register": "register",
    }),

    register: function () {
      console.log("[router: register]");

      App.setTitle("Register");
      this.aliasCollection.fetch();

      this.selectMode("standalone", "register").done(_.bind(function () {
        this.loadStandaloneView(new Register.Views.Register({ collection: this.aliasCollection }));
      }, this));
    }
  });

  return Router;

});