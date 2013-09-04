define([
  // Application.
  "framework/App",

  "framework/Router",

  "modules/Register",

  "modules/Participant"
],

function (App, fwRouter, Register, Participant) {

  // Defining the application router, you can attach sub routers here.
  var Router = fwRouter.extend({
    initialize: function () {
      fwRouter.prototype.initialize.call(this);

      this.participants = new Participant.Collection();
    },

    routes: _.extend({}, fwRouter.prototype.routes, {
      "register": "register",
    }),

    register: function () {
      console.log("[router: register]");

      App.setTitle("Register");
      this.participants.fetch();

      this.selectMode("standalone", "register").done(_.bind(function () {
        this.loadStandaloneView(new Register.Views.Register({ participants: this.participants }));
      }, this));
    }
  });

  return Router;

});