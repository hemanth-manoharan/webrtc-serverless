'use strict';

const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/version', (req, res, next) => { res.send('0.0.2'); });

const options = {
  debug: true
}

const server = require('http').createServer(app);

app.use(express.static('public'));

app.use(function(req, res, next) {
  // TODO Development hack - Definitely not the secure way
  // Refer: https://fosterelli.co/developers-dont-understand-cors
  res.header("Access-Control-Allow-Origin", "*");
  //res.setHeader("Access-Control-Request-Method", "*");
  //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

server.listen(PORT);