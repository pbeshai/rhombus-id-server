var winston = require('winston'),
  moment = require("moment");

function timestamp() {
  return moment().format("HH:mm:ss");
}

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ json: false, timestamp: timestamp, level: "debug", colorize: true }),
    new winston.transports.File({ filename: __dirname + '/server.log.json', json: true, level: "debug", name: "file#json" }),
    new winston.transports.File({ filename: __dirname + '/server.log', json: false, level: "debug" })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({ json: false, timestamp: timestamp }),
    new winston.transports.File({ filename: __dirname + '/exceptions.log', json: true })
  ],
  exitOnError: false
});
module.exports = logger;