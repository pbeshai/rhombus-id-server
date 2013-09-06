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
	site.post("/api/alias", registerAliases);
	site.put("/api/alias", updateAliases);
	site.get("/api/alias", listAliases);
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

function updateAliases(req, res) {
	console.log("UPDATE ALIASES");
	return registerAliases(req, res);
}

// supports either an array of aliases or an object (single alias)
function registerAliases(req, res) {
	console.log("saving aliases", req.body);

	if (req.body == null) return;

	var participants = _.isArray(req.body) ? req.body : [req.body];

	dbCall(function (db) {
		var statement = db.prepare("INSERT INTO alias (participantId, alias) VALUES ($participantId, $alias)");
		var errors = [];
		_.each(participants, function (participant) {
			// TODO: probably should be more secure....
			var params = {
				$alias: participant.alias,
				$participantId: participant.participantId,
			};
			statement.run(params, function (err) {
				if (err) {
					console.log(err); // TODO: figure out how to interpret errors.
					debugger;
					errors.push(err);
				}
			});
		});

		// send response after all participants have been added
		statement.finalize(function (err) {
			if (err || errors.length) {
				if (err) {
					console.log(err);
				}
				if (errors.length) {
					console.log(errors);
				}

				res.send(500, errors);
			} else {
				res.send(200, "");
			}
		});
	});
}


function listAliases(req, res) {
	// list all aliases
	dbCall(function (db) {
		db.all("SELECT * FROM alias", function (err, rows) {
			res.send(rows);
		});
	});
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