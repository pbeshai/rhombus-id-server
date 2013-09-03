/** Module for handling API requests */

module.exports = {
	initialize: initialize,
  handle: handle
};

var fs = require('fs')
	, sqlite3 = require('sqlite3').verbose();

var dbFilename = "../anonymizer.db";

function initialize(site) {

	site.post("/api/alias", registerAlias);
	site.get("/api/alias/:action", handleAlias)
	site.delete("/api/alias", deleteAliass);
	site.all("/api/*", handle);
}

// if we make it here, 404.
function handle(req, res, next) {
	console.log("API Handler: ", req.params);
	res.send(404);
}

function deleteAliass(req, res) {
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
			})
		});

	} else {
		res.send(404);
	}
}

function dbCall(callback) {
	fs.exists(dbFilename, function (exists) {
		var db = new sqlite3.Database(dbFilename);

		if (!exists) {
			console.log("this database does not exist");
			fs.readFile("../sql/create.sql", "utf8", function (err, data) {
				if (err) throw err;

				db.exec(data, function (err) {
					if (err) throw err;
					console.log("finished running ../sql/create.sql");
				});

				// db setup
				callback(db);
			});
		} else {
			callback(db);
		}

	});
}