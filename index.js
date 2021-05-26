'use strict';

const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

const options = {
  debug: true
}

const server = require('http').createServer(app);

app.use(function(req, res, next) {
  // TODO Does CORS apply for WebSockets?? It seems it does not!!!
  // https://blog.securityevaluators.com/websockets-not-bound-by-cors-does-this-mean-2e7819374acc

  // 'cors' options seems to apply for static content on express as well
  // However, it does not really help since the app primarily uses WebSockets.

  // CORS related
  // Refer: https://fosterelli.co/developers-dont-understand-cors
  res.header("Access-Control-Allow-Origin", "https://peerjs-srv-vpa-mod.herokuapp.com");
  //res.setHeader("Access-Control-Request-Method", "*");
  //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // iFrame related
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  res.setHeader("X-Frame-Options", "DENY");

  // CSP related
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
  // TODO Adding http://localhost:8080 only for dev-testing
  // This is the one that really seems to work!
  res.setHeader("Content-Security-Policy", "script-src https://cdnjs.cloudflare.com https://unpkg.com https://ajax.googleapis.com https://webrtc-serverless.herokuapp.com http://localhost:8080 'unsafe-inline'");

  next();
});

app.use(express.static('public'));

app.get('/version', (req, res, next) => { res.send('0.0.2'); });

server.listen(PORT);