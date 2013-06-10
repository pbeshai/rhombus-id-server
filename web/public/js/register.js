$(function () {
  /*var $manual = $("#manual-reg");
  var $auto = $("#auto-reg");
  $("#auto-reg-btn").on("click", function () {
    $manual.hide();
    $auto.show();
  });

  $("#manual-reg-btn").on("click", function () {
    $auto.hide();
    $manual.show();
  });

  var config = {
    websocketUrl: "localhost"
  };
  window.socket = io.connect(config.websocketUrl);

  socket.on("choice-data", function () {
    console.log("Data", arguments);
  });

  var Register = {
    initialize: function () {
      $(".listen-server-id").toggleButton({
        textState1: "Listen",
        textState2: "Cancel",
        clickState1: this.listenForId,
        clickState2: this.cancelListen
      });
    },

    listenForId: function (event) {
      console.log("listen for server id", this);
      this.model.set("serverId", "");
      this.$("input.server-id").attr("placeholder", "Listening...").prop("disabled", true);
      // should be listenToOnce
      this.listenTo(app.participantServer, "data", function (data) {
        this.cancelListen();
        console.log(data[0]);
        this.$(".listen-server-id").trigger("to-state1");

        updateModel.apply(this, [data[0]]);
      });
    },


    cancelListen: function () {
      console.log("cancel");
      this.stopListening(app.participantServer, "data");
      this.$("input.server-id").removeAttr("placeholder").prop("disabled", false);
    },
  }
  */

  window.Participant = {Views: {}};
  Participant.Model = Backbone.Model;

  var participantServer = new Backbone.Model();
  window.Register = {Views: {}};

  function updateModel(data, alias) {
    // check if we already have this guy
    var exists = this.collection.find(function (elem) {
      return elem.get("serverId") === data.id;
    });

    if (exists) {
      var message = data.id + " is already mapped to " + exists.get("alias");
      console.log(message);
      $("<div class='alert fade in'>"+message+"</div>").appendTo(this.$(".alert-container").empty()).alert();
      return false;
    }

    this.model.set("serverId", data.id);
    if (alias) {
      this.model.set("alias", alias);
    }
    return true;
  }


  Register.Views.FormRegistration = Backbone.View.extend({
    template: "register/form",

    events: {
      "click .register-submit" : "register",
      "change .server-id": "hideAlert"
    },

    hideAlert: function () {
      this.$(".alert").alert('close');
    },



    register: function (event) {
      event.preventDefault();

      var serverId = this.$("input.server-id").val();
      var alias = this.$("input.alias").val();

      this.model.set({
        "serverId": serverId,
        "alias": alias
      });

      this.trigger("save-registration", this.model);
    },

    afterRender: function () {
      this.$(".listen-server-id").toggleButton({
        textState1: "Listen",
        textState2: "Cancel",
        clickState1: this.listenForId,
        clickState2: this.cancelListen
      });
    },

    initialize: function () {
      //_.bindAll(this, "listenForId", "cancelListen");
      this.listenTo(this.model, {
        change: function () {
          console.log("model changed!");
          this.$("input.server-id").val(this.model.get("serverId"));
          this.$("input.alias").val(this.model.get("alias"));
        }
       });
    }
  });

  Register.Views.AutoRegistration = Backbone.View.extend({
    template: "register/auto",
    idPrefix: "Clicker",
    counter: 1,

    events: {
      "click .auto-register-submit" : "register",
      "change .prefix" : "updatePrefix",
      "change .server-id": "hideAlert"
    },

    serialize: function () {
      return {
        model: this.model,
        prefix: this.idPrefix
      }
    },

    afterRender: function () {
      this.$(".auto-start-btn").toggleButton({
        classState1: "btn-success",
        classState2: "btn-danger",
        textState1: "Start",
        textState2: "Stop",
        clickState1: this.startAuto,
        clickState2: this.stopAuto
      });
    },

    initialize: function () {
      _.bindAll(this, "startAuto", "stopAuto");

      this.listenTo(this.model, {
        change: function () {
          this.$("input.server-id").val(this.model.get("serverId"));
          this.$("input.alias").val(this.model.get("alias"));
        }
       });
    },

    generateAlias: function () {
      return this.idPrefix+this.counter.toString();
    },

    updatePrefix: function () {
      var prefixVal = this.$("input.prefix").val();

      if (this.idPrefix !== prefixVal) {
        this.idPrefix = prefixVal; // update the value to match the textfield

        // update alias to use new prefix
        if (!_.isEmpty(this.model.get("alias"))) {
          this.model.set("alias", this.generateAlias());
        }

        return true; // updated
      }

      return false; // no update
    },

    hideAlert: function () {
      this.$(".alert").alert('close');
    },

    startAuto: function () {
      this.listenTo(participantServer, "data", function (data) {
        // ensure the prefix is up to date
        var prefixChanged = this.updatePrefix();

        if (!prefixChanged && this.model.get("serverId") === data[0].id) {
          // no prefix change, but same ID came in => save
          this.register();
        } else {
          updateModel.apply(this, [data[0], this.generateAlias()]);
        }
      });
    },

    stopAuto: function () {
      this.stopListening(participantServer, "data");
    },

    register: function (event) {
      if (event) {
        event.preventDefault();
      }

      var serverId = this.$("input.server-id").val();
      var alias = this.$("input.alias").val();

      this.model.set({
        "serverId": serverId,
        "alias": alias
      });

      this.counter += 1;

      this.trigger("save-registration", this.model);
    }
  });

  Register.Views.Register = Backbone.View.extend({
    tagName: "div",
    template: "register/register",
    registrationViews: {},

    events: {
      "click .manual-reg-btn" : "manualRegistration",
      "click .auto-reg-btn" : "autoRegistration",
    },

  	serialize: function () {
  	},

  	beforeRender: function () {
      this.insertViews({
        ".participants": new Participant.Views.Table({ participants: this.options.participants }),
        ".register-participant": this.currentView
      });
  	},

  	initialize: function () {
      // app.setTitle("Register Participant");

      this.currentView = new Register.Views.FormRegistration({ model: new Participant.Model(), collection: this.options.participants });

      this.on("save-registration", this.register);
  	},

    register: function (participant) {
      console.log("registering ", participant.get("serverId"), participant.get("alias"));

      var participants = this.options.participants;
      var saved = participant.save(null, {
        success: function () {
          console.log("successfully saved!");
          participants.fetch();
          participant.clear();
        },
        error: function () {
          console.log("error saving", arguments);
        }
      });

      if (!saved) {
        console.log("didn't save: " +participant.validationError);
      }
    },

    updateRegistrationView: function () {
      this.setView(".register-participant", this.currentView);
      this.currentView.render();
    },

    manualRegistration: function () {
      if (!(this.currentView instanceof Register.Views.FormRegistration)) {
        this.currentView = new Register.Views.FormRegistration({ model: new Participant.Model(), collection: this.options.participants });
        this.updateRegistrationView();
      }
    },

    autoRegistration: function () {
      if (!(this.currentView instanceof Register.Views.AutoRegistration)) {
        this.currentView = new Register.Views.AutoRegistration({ model: new Participant.Model(), collection: this.options.participants });
        this.updateRegistrationView();
      }
    }
  });

  return Register;
});