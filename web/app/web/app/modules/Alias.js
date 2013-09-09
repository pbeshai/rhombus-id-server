/**

	An alias to clicker Id model

*/
define([
	"framework/App",
],
function(app) {

	var Alias = app.module();

	Alias.Model = Backbone.Model.extend({
		urlRoot: "/api/alias",

		validate: function (attrs, options) {
			if (_.isEmpty(attrs.alias)) {
				return "cannot have empty alias";
			}
			if (_.isEmpty(attrs.participantId)) {
				return "cannot have empty participantId";
			}
		}
	});

	Alias.Collection = Backbone.Collection.extend({
		url: "/api/alias",
		model: Alias.Model,

		save: function (options) {
			if (this.length) {
				console.log("saving aliases", this);
				return Backbone.sync("update", this, _.extend({
					url: this.url,
					success: _.bind(this.reset, this),
					error: _.bind(this.reset, this)
				}, options));
			}
		}
	});

	Alias.Views.TableItem = Backbone.View.extend({
		template: "app/templates/alias/table_item",
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

	Alias.Views.Table = Backbone.View.extend({
		template: "app/templates/alias/table",

		serialize: function () {
			return {
				collection: this.collection,
				showChoice: this.options.showChoice
			};
		},

		beforeRender: function () {
			this.collection.each(function (aliasModel) {
				this.insertView("tbody", new Alias.Views.TableItem({ model: aliasModel, showChoice: this.options.showChoice }));
			}, this);
		},

		initialize: function () {
			this.listenTo(this.collection, "reset", this.render);
		}
	});

	return Alias;
});