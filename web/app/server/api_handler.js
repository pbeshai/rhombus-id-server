/** Module for handling API requests */

module.exports = {
	initialize: initialize,
};

var fs = require('fs'),
		_ = require('lodash'),
		sqlite3 = require('sqlite3').verbose();

var dbConfig = {
		file: "../aliaser.db",
		create: __dirname + "/../sql/create.sql"
};

function initialize(site, initConfig) {
	site.post("/api/alias", registerAlias);
	site.get("/api/alias/:action", handleAlias);
	site.delete("/api/alias", deleteAliases);

	initConfig = initConfig || {};
	_.extend(dbConfig, initConfig.database);
}

function deleteAliases(req, res) {
	console.log("deleting all aliases");

	dbCall(function (db) {
		db.run("DELETE FROM alias", function (err) {
			if (err) {
				console.log(err);
				res.send(500);
			} else {
				res.send(200, "");
			}
		});
	});
}

function registerAlias(req, res) {
	console.log("saving alias ", req.body);

	dbCall(function (db) {
		// TODO: probably should be more secure....
		var params = {
			$participantId: req.body.participantId,
			$alias: req.body.alias
		};

		db.run("INSERT INTO alias (participantId, alias) VALUES ($participantId, $alias)", params,
			function (err) {
				if (err) {
					console.log(err);
					res.send(500);
				} else {
					res.send(200, "");
				}
			});
	});
}

function handleAlias(req, res, next) {
	console.log("alias handler! ", req.params.action, req.params);
	var action = req.params.action;
	if (action === "list") {
		// list all aliases
		dbCall(function (db) {
			db.all("SELECT * FROM alias", function (err, rows) {
				res.send(rows);
			});
		});

	} else {
		res.send(404);
	}
}


function dbCall(callback) {
	fs.exists(dbConfig.file, function (exists) {
		var db = new sqlite3.Database(dbConfig.file);

		if (!exists) {
			console.log("this database does not exist");

			fs.readFile(dbConfig.create, "utf8", function (err, data) {
				if (err) throw err;

				db.exec(data, function (err) {
					if (err) throw err;
					console.log("finished running db create script", dbConfig.create);
				});

				// db setup
				callback(db);
			});
		} else {
			callback(db);
		}

	});
}