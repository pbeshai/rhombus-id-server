/**

	A participant (e.g., a clicker user)

*/
define([
	"framework/App",
],
function(app) {

	var Participant = app.module();

	Participant.Model = Backbone.Model.extend({
		url: "/api/alias",

		validate: function (attrs, options) {
			if (_.isEmpty(attrs.alias)) {
				return "cannot have empty alias";
			}
			if (_.isEmpty(attrs.participantId)) {
				return "cannot have empty participantId";
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
			this.on("reset", this.initAliasMap);
			this.initAliasMap(models);
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

	Participant.Views.TableItem = Backbone.View.extend({
		template: "app/templates/participant/table_item",
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
		template: "app/templates/participant/table",

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

	return Participant;
});