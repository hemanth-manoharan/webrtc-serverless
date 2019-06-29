'use strict';

// PeerJS related code

// github repo for PeerJS Server - https://github.com/hemanth-manoharan/peerjs-server-express
// let peer = new Peer({host: 'localhost', port: 9000, path: '/peerjs'});
let peer = new Peer({host: 'safe-eyrie-39067.herokuapp.com', port: 443, path: '/peerjs', secure: 'true'});

// This remote PeerJS cloud server works.
// let peer = new Peer({key: 'lwjd5qra8257b9'});

let rtcConn = null;

peer.on('open', function(id) {
  console.log('Peer received open event ...');
  console.log('My peer ID is: ' + id);
  $('#selfPeerId').html('Peer Id - ' + id);
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
    sendCommand(conn, 'userId', app.userInfoColl.at(0).toJSON().userName);
    // Receive messages
    conn.on('data', function(data) {
      console.log('Received message:' + data);
      if (isCommandMessage(data)) {
        processCommand(data);
      } else {
        // Normal message
        app.messageList.create({
          title: data
        });
      }
    });
  });
}

function sendCommand(conn, command, message) {
  // TODO Very rudimentary command impl. for now
  conn.send(command + ':' + message);
}

function isCommandMessage(data) {
  // TODO
  return false;
}

function processCommand(data) {
  // TODO
}

// Backbone Related Code

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
    this.model.on('destroy', this.remove, this);
  },
});

// Renders the full list of messages calling MessageView
// for each message
app.ChatMessagesView = Backbone.View.extend({
  el: '#chatApp',
  initialize: function() {
    this.input = this.$('#message');
    app.messageList.on('add', this.addAll, this);
    app.messageList.on('reset', this.addAll, this);
    app.messageList.fetch(); // Loads list from local storage
  },
  events: {
    'keypress #message': 'sendMessageOnEnter',
    'click #clearMessages': 'clearMessageHistory'
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
  clearMessageHistory: function(e) {
    var length = app.messageList.length;
    for (var i = 0; i < length; i++) {
      app.messageList.at(0).destroy();
    }
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

// User Info
app.UserInfo = Backbone.Model.extend({
  defaults: {
    userName: ''
  }
});

app.UserInfoCollection = Backbone.Collection.extend({
  model: app.UserInfo,
  localStorage: new Store("backbone-user")
});

app.userInfoColl = new app.UserInfoCollection();

app.UserInfoView = Backbone.View.extend({
  el: '#userId',
  template: _.template($('#user-info-template').html()),
  render: function() {
    console.info('UserInfoView render triggered ... ');

    if (app.userInfoColl.length > 0) {
      this.$el.html(this.template(app.userInfoColl.at(0).toJSON()));
    }
    return this; // enable chained calls
  },
  initialize: function() {
    app.userInfoColl.on('add', this.render, this);
    app.userInfoColl.on('reset', this.render, this);
  },
});

app.userInfoColl.fetch(); // Loads list from local storage
console.log('User Info Collection Length: ' + app.userInfoColl.length);
if (app.userInfoColl.length == 0) {
  let userNameVal = prompt("User name", "Please enter your user name ...");

  if (userNameVal != null) {
    app.userInfoColl.create({userName: userNameVal});
  }
}

// Initialize the app
app.userInfoView = new app.UserInfoView();
app.userInfoView.render();
app.appView = new app.ChatMessagesView();