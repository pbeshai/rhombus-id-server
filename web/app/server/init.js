module.exports = {
	webInit: webInit,
	webSocketInit: webSocketInit
};

var fs = require("fs"),
		fwInit = require("../../framework/server/init"),
		fwConfig = require("../../fwconfig.json"),
		logger = require("../../log/logger");


// function to do extra initialization before starting web server
function webInit(site, serverOptions) {
	logger.info("app webInit");
	logger.info("initializing api_handler");
	require("./api_handler").initialize(site, fwConfig);

	fwInit.webInit(site, serverOptions, fwConfig);
}

// function to do extra initialization after listening with websocket
function webSocketInit(io, serverOptions) {
	logger.info("app webSocketInit");
	io.set('log level', 1); // reduces logging.
	fwInit.webSocketInit(io, serverOptions, fwConfig);
}