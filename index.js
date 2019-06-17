'use strict';

var nodeStatic = require('node-static');
var http = require('http');
const PORT = process.env.PORT || 8080;

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(PORT);