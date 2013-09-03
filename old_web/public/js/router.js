(function () {
  "use strict"

  var ParticipantServer = app.modules.ParticipantServer;
  var Participant = app.modules.Participant;
  var Register = app.modules.Register;

  // Defining the application router, you can attach sub routers here.
  app.Router = Backbone.Router.extend({
    initialize: function() {
      var participantServer = app.participantServer = new ParticipantServer.Model();

      // TODO: remove; for debugging
      console.log("Making ParticipantServer available in window");
      window.participantServer = participantServer;

      var collections = {
        // Set up the users.
        participants: new Participant.Collection(),
      };


      // Ensure the router has references to the collections.
      _.extend(this, collections);

      // Use main layout and set Views.
      app.useLayout("main-layout").setViews({
        ".server-status": new ParticipantServer.Views.Status({ model: participantServer}),
        "#main-content": new Register.Views.Register({participants: this.participants}),
      });
    },

    routes: {
      "": "index",
    },

    index: function () {
      console.log("[router: index]");
      this.participants.fetch();
      app.layout.render();
      console.log("rendered");
    }
  });

  console.log("router.js: ", app.Router);
})();