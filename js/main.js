'use strict';

// TBD - Not working due to CORS policy violation
// let peer = new Peer(id, {host: 'localhost', port: 9000, path: '/webrtc'});

// This remote PeerJS cloud server works.
let peer = new Peer({key: 'lwjd5qra8257b9'});

peer.on('open', function(id) {
  console.log('Peer received open event ...');
  console.log('My peer ID is: ' + id);
});

peer.on('connection', function(conn) {
  console.log('Peer received connection event ...');
  setupConnection(conn);
});

$('#peerConnectButton').click(function() {
  console.log('Connecting to peer ...' + $('#peerId').val());
  var conn = peer.connect($('#peerId').val());
  setupConnection(conn);
});

function setupConnection(conn) {
  console.log('Setting up connection');

  initMessageHistory();

  conn.on('open', function() {
    // Receive messages
    conn.on('data', function(data) {
      console.log('Received message:' + data);
      appendValueToArrayInStore('chatMessages', data);
      $('#messagesTrail').append($('<li>').text(data));
    });
  
    $('#sendButton').click(function() {
      // Send messages
      let msgToSend = $('#message').val();
      appendValueToArrayInStore('chatMessages', 'Me: ' + msgToSend);
      $('#messagesTrail').append($('<li>').text('Me: ' + msgToSend));
      console.log('Sending message:' + msgToSend);
      conn.send(msgToSend);
      $('#message').val('');
    });
  });
}

function initMessageHistory() {
  // Load from Web Storage
  if (!getItemInStore('chatMessages')) {
    setItemInStore('chatMessages', JSON.stringify(['Start']));
  }

  let messages = JSON.parse(getItemInStore('chatMessages'));
  console.log('Messages from store:' + messages);

  messages.forEach(function(item) {
    $('#messagesTrail').append($('<li>').text(item));
  });
}