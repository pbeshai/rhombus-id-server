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
	site.delete("/api/alias/:id", deleteAlias);

	initConfig = initConfig || {};
	_.extend(dbConfig, initConfig.database);
}

function deleteAlias(req, res) {
	console.log("deleting one alias", req.params.id);
	dbCall(function (db) {
		db.run("DELETE FROM alias WHERE id = ?", req.params.id, function (err) {
			if (err) {
				console.log(err);
				res.send(500);
			} else {
				res.send(200, "");
			}
		});
	});
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
		var updateStatement = db.prepare("UPDATE alias SET alias=$alias WHERE participantId=$participantId");
		var checkStatement = db.prepare("SELECT count(*) FROM alias WHERE participantId=$participantId AND alias=$alias");
		var errors = [];
		var updates = [];
		var checkDuplicates = [];
		var duplicates = [];
		insert();

		function insert() {
			console.log("insert");
			_.each(participants, function (participant) {
				// TODO: probably should be more secure....
				var params = {
					$alias: participant.alias,
					$participantId: participant.participantId,
				};
				statement.run(params, function (err) {
					if (err) {
						if (err.errno === 19 && err.toString().match("column alias is not unique")) {
							// somebody has this alias (possibly this participantId)
							checkDuplicates.push(params);
							console.log("alias not unique", params);
						} else if (err.errno === 19 && err.toString().match("column participantId is not unique")) {
							// update the participantId to use the new alias
							updates.push(params);
							console.log("participantId not unique", params);
						}	else {
							console.log("error", err, params);
							errors.push(err);
						}
					}
				});
			});

			// send response after all participants have been added
			statement.finalize(function (err) {
				if (updates.length) {
					update();
				} else if (checkDuplicates.length) {
					check();
				} else {
					sendResponse(err);
				}
			});
		}

		function update() {
			console.log("update", updates);
			_.each(updates, function (params) {
				updateStatement.run(params, function (err) {
					console.log("ran update", this.changes, params);
					if (err) {
						errors.push(err);
					}
				});
			});

			updateStatement.finalize(function (err) {
				if (checkDuplicates.length) {
					check();
				} else {
					sendResponse(err);
				}
			});
		}

		function check() {
			console.log("check", checkDuplicates);
			_.each(checkDuplicates, function (params) {
				checkStatement.get(params, function (err, row) {
					console.log("ran check", err, this.changes, params);
					if (row["count(*)"]) {
						console.log("ALREADY IN DB", params);
					} else {
						console.log("ALIAS DUPLICATED ERROR", params);
						duplicates.push({ alias: params.$alias, participantId: params.$participantId });
					}
					if (err) {
						errors.push(err);
					}
				});
			});

			checkStatement.finalize(sendResponse);
		}

		function sendResponse(err) {
			console.log("sending response");
			if (err || errors.length) {
				if (err) {
					console.log(err);
				}
				if (errors.length) {
					console.log(errors);
				}

				res.send(500);
			} else {
				var result = {};
				if (duplicates.length) {
					result.duplicates = duplicates;
				}
				res.send(200, result);
			}
		}
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