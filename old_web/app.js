/**
 * Module dependencies.
 */
var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , websocketHandler = require('./socket/websocket_handler')
  , api = require('./api_handler')
  , path = require('path');


// all environments
app.set('port', process.env.PORT || 8008);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
app.use(express.bodyParser());
api.initialize(app);

// start the http server
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

websocketHandler.init(io);