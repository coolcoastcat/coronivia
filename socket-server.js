const webSocketsServerPort = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Spinning the http server and the websocket server.
const server = http.createServer();

server.listen(webSocketsServerPort);

const wsServer = new webSocketServer({
  httpServer: server
});

// I'm maintaining all active connections in this object
const clients = {};


wsServer.on('request', function(request) {
  var userID = uuidv4(); //Create a GUID for the connection
  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
  // You can rewrite this part of the code to accept only the requests from allowed origin
  const connection = request.accept(null, request.origin);
  clients[userID] = connection;
  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients))
}); 