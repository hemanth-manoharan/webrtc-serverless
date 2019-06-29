'use strict';

// github repo for PeerJS Server - https://github.com/hemanth-manoharan/peerjs-server-express
let peer = new Peer({host: 'localhost', port: 9000, path: '/peerjs'});
// let peer = new Peer({host: 'safe-eyrie-39067.herokuapp.com', port: 443, path: '/peerjs'});

// This remote PeerJS cloud server works.
// let peer = new Peer({key: 'lwjd5qra8257b9'});

let rtcConn = null;

peer.on('open', function(id) {
  console.log('Peer received open event ...');
  console.log('My peer ID is: ' + id);
  $('#selfPeerId').html(id);
});

peer.on('connection', function(conn) {
  console.log('Peer received connection event ...');
  rtcConn = conn;
  setupConnection(conn);
});

$('#peerConnectButton').click(function() {
  console.log('Connecting to peer ...' + $('#peerId').val());
  var conn = peer.connect($('#peerId').val());
  rtcConn = conn;
  setupConnection(conn);
});

function setupConnection(conn) {
  console.log('Setting up connection');

  $('#status').html('Connected to ' + conn.peer);

  conn.on('open', function() {
    // Receive messages
    conn.on('data', function(data) {
      console.log('Received message:' + data);
      app.messageList.create({
        title: data
      });
    });
  });
}

var app = {}; // create app namespace

app.Message = Backbone.Model.extend({
  defaults: {
    title: ''
  }
});

app.MessageList = Backbone.Collection.extend({
  model: app.Message,
  localStorage: new Store("backbone-message")
});

app.messageList = new app.MessageList();

app.MessageView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#item-template').html()),
  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this; // enable chained calls
  },
  initialize: function() {
    this.model.on('change', this.render, this);
  },
});

// Renders the full list of messages calling MessageView
// for each message
app.AppView = Backbone.View.extend({
  el: '#chatApp',
  initialize: function() {
    this.input = this.$('#message');
    app.messageList.on('add', this.addAll, this);
    app.messageList.on('reset', this.addAll, this);
    app.messageList.fetch(); // Loads list from local storage
  },
  events: {
    'keypress #message': 'sendMessageOnEnter'
  },
  sendMessageOnEnter: function(e) {
    if (e.which !== 13 || !this.input.val().trim()) {
      // Enter key == 13
      return;
    }

    // Todo Send message via WebRTC here
    rtcConn.send(this.input.val().trim());

    app.messageList.create(this.newAttributes());
    this.input.val('');
  },
  addOne: function(message) {
    var view = new app.MessageView({model: message});
    $('#messagesTrail').append(view.render().el);
  },
  addAll: function() {
    // Clean the messages list
    this.$('#messagesTrail').html('');

    app.messageList.each(this.addOne, this);
  },
  newAttributes: function() {
    return {
      title: 'Me: ' + this.input.val().trim()
    }
  }
});

// Initialize the app
app.appView = new app.AppView();