/** Module for handling API requests */

module.exports = {
	initialize: initialize,
};

var fs = require('fs'),
		_ = require('lodash'),
		sqlite3 = require('sqlite3').verbose(),
		logger = require("../../log/logger");

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
	logger.info("deleting one alias " + req.params.id);
	dbCall(function (db) {
		db.run("DELETE FROM alias WHERE id = ?", req.params.id, function (err) {
			if (err) {
				logger.error(err);
				res.send(500);
			} else {
				res.send(200, "");
			}
		});
	});
}

function deleteAliases(req, res) {
	logger.info("deleting all aliases");

	dbCall(function (db) {
		db.run("DELETE FROM alias", function (err) {
			if (err) {
				logger.error(err);
				res.send(500);
			} else {
				res.send(200, "");
			}
		});
	});
}

function updateAliases(req, res) {
	logger.info("UPDATE ALIASES");
	return registerAliases(req, res);
}

// supports either an array of aliases or an object (single alias)
function registerAliases(req, res) {
	logger.info("saving aliases", {requestBody: req.body});

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
			logger.info("insert");
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
							logger.warn("alias not unique", {params: params});
						} else if (err.errno === 19 && err.toString().match("column participantId is not unique")) {
							// update the participantId to use the new alias
							updates.push(params);
							logger.warn("participantId not unique", {params: params});
						}	else {
							logger.error("error", {err: err, params: params});
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
			logger.info("update %j", updates);
			_.each(updates, function (params) {
				updateStatement.run(params, function (err) {
					logger.info("ran update", {changes: this.changes, params: params});
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
			logger.info("check ", {checkDuplicates: checkDuplicates });
			_.each(checkDuplicates, function (params) {
				checkStatement.get(params, function (err, row) {
					logger.info("ran check", {err: err, changes: this.changes, params: params});
					if (row["count(*)"]) {
						logger.info("ALREADY IN DB", {params: params});
					} else {
						logger.info("ALIAS DUPLICATED ERROR", {params: params});
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
			logger.info("sending response");
			if (err || errors.length) {
				if (err) {
					logger.error(err);
				}
				if (errors.length) {
					logger.error(errors);
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
		// order by id DESC to get newest at top
		db.all("SELECT * FROM alias ORDER BY id DESC", function (err, rows) {
			res.send(rows);
		});
	});
}


function dbCall(callback) {
	fs.exists(dbConfig.file, function (exists) {
		var db = new sqlite3.Database(dbConfig.file);

		if (!exists) {
			logger.info("this database does not exist");

			fs.readFile(dbConfig.create, "utf8", function (err, data) {
				if (err) throw err;

				db.exec(data, function (err) {
					if (err) throw err;
					logger.info("finished running db create script " + dbConfig.create);
				});

				// db setup
				callback(db);
			});
		} else {
			callback(db);
		}

	});
}