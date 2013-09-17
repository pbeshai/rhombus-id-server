var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ json: false, timestamp: true, level: "debug", colorize: true }),
    new winston.transports.File({ filename: __dirname + '/server.log.json', json: true, level: "debug", name: "file#json" }),
    new winston.transports.File({ filename: __dirname + '/server.log', json: false, level: "debug" })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({ json: false, timestamp: true }),
    new winston.transports.File({ filename: __dirname + '/exceptions.log', json: true })
  ],
  exitOnError: false
});
module.exports = logger;