/**

	A participant (e.g., a clicker user)

*/
(function() {

  var Participant = app.module();
  app.modules.Participant = Participant;

  Participant.Model = Backbone.Model.extend({
    url: "/api/alias",

    validate: function (attrs, options) {
      if (_.isEmpty(attrs.alias)) {
        return "cannot have empty alias"
      }
      if (_.isEmpty(attrs.serverId)) {
        return "cannot have empty serverId"
      }
    }
  });

  Participant.Collection = Backbone.Collection.extend({
    url: "/api/alias/list",
  	model: Participant.Model,
    aliasMap: {},

  	initialize: function (models, options) {
      options = options || {};
      // initialize alias->model map
      console.log("models = ", models, "this.models = ", this.models)
      this.on("reset", this.initAliasMap);
      this.initAliasMap(models);

      this.participantServer = app.participantServer;

  		// update models on data received from server.
      this.listenTo(participantServer, "data", function (data) {
        console.log("data received", data);
				_.each(data.choices, function (choiceData, i) {
					var model = this.aliasMap[choiceData.id];
					if (model) {
						model.set({"choice": choiceData.choice}, { validate: options.validateOnChoice });
					}
				}, this);
			}, this);
  	},

    initAliasMap: function (models) {
      this.aliasMap = {};
      if (_.isArray(models)) {
        _.each(models, setAlias, this);
      } else {
        this.each(setAlias, this);
      }

      function setAlias(model) {
        var alias = model.get("alias");
        if (alias !== undefined) {
          this.aliasMap[alias] = model;
        }
      }
    }
  });

  Participant.Views.Item = Backbone.View.extend({
  	template: "participant/item",

  	serialize: function () {
  		return { model: this.model };
  	},

  	initialize: function () {
  		this.listenTo(this.model, "change", this.render);
  	}
  });

  Participant.Views.List = Backbone.View.extend({
  	template: "participant/list",

  	serialize: function () {
  		return { collection: this.options.participants };
  	},

  	beforeRender: function () {
  		this.options.participants.each(function (participant) {
  			this.insertView(".participant-list", new Participant.Views.Item({ model: participant }));
  		}, this);
  	},

  	initialize: function () {
      console.log("initializing participant views list", this.options);
  		this.listenTo(this.options.participants, {
  			"reset": this.render,

  			"fetch": function () {
  				console.log("Fetch participants???");
  			}
  		});
  	}

  });

  Participant.Views.TableItem = Backbone.View.extend({
    template: "participant/table_item",
    tagName: "tr",

    serialize: function () {
      return {
        model: this.model,
        showChoice: this.options.showChoice
      };
    },

    initialize: function () {
      this.listenTo(this.model, "change", this.render);
    }
  });

  Participant.Views.Table = Backbone.View.extend({
    template: "participant/table",

    serialize: function () {
      return {
        collection: this.options.participants,
        showChoice: this.options.showChoice
      };
    },

    beforeRender: function () {
      this.options.participants.each(function (participant) {
        this.insertView("tbody", new Participant.Views.TableItem({ model: participant, showChoice: this.options.showChoice }));
      }, this);
    },

    initialize: function () {
      this.listenTo(this.options.participants, {
        "reset": this.render,

        "fetch": function () {
          console.log("Fetch participants???");
        }
      });
    }

  });

})();