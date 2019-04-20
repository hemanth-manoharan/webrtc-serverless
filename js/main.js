'use strict';

// TBD - Not working due to CORS policy violation
// let peer = new Peer(id, {host: 'localhost', port: 9000, path: '/webrtc'});

// This remote PeerJS cloud server works.
let peer = new Peer({key: 'lwjd5qra8257b9'});

peer.on('open', function(id) {
  console.log('Peer received open event ...');
  console.log('My peer ID is: ' + id);
  $('#selfPeerId').html(id);
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

  $('#status').html('Connected to ' + conn.peer);

  initMessageHistory();

  conn.on('open', function() {
    // Receive messages
    conn.on('data', function(data) {
      console.log('Received message:' + data);
      LocalStorageUtil.appendValueToArrayInStore('chatMessages', data);
      $('#messagesTrail').append($('<li>').text(data));
    });
  
    $('#sendButton').click(function() {
      // Send messages
      let msgToSend = $('#message').val();
      LocalStorageUtil.appendValueToArrayInStore('chatMessages', 'Me: ' + msgToSend);
      $('#messagesTrail').append($('<li>').text('Me: ' + msgToSend));
      console.log('Sending message:' + msgToSend);
      conn.send(msgToSend);
      $('#message').val('');
    });
  });
}

function initMessageHistory() {
  // Clear older messages rendered
  $('#messagesTrail').html('');

  // Load from Web Storage
  if (!LocalStorageUtil.getItemInStore('chatMessages')) {
    LocalStorageUtil.setItemInStore('chatMessages', JSON.stringify(['Start']));
  }

  let messages = JSON.parse(LocalStorageUtil.getItemInStore('chatMessages'));
  console.log('Messages from store:' + messages);

  messages.forEach(function(item) {
    $('#messagesTrail').append($('<li>').text(item));
  });
}