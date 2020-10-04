'use strict';

// Backbone Related Code

var app = {}; // create app namespace

/// Start - Model Definitions

// Model - Chat

// For 1-1 chat - The id is the same
// as the userName of the remote peer
// and members is empty
app.Chat = Backbone.Model.extend({
  default: {
    id: '',
    members: []
  }
});

app.ChatList = Backbone.Collection.extend({
  model: app.Chat,
  localStorage: new Store("backbone-chat")
})

// Model - Message
app.Message = Backbone.Model.extend({
  defaults: {
    body: '',
    userName: '',
    timestamp: -1
  }
});

// Model - User Info
app.UserInfo = Backbone.Model.extend({
  defaults: {
    userName: '',
  }
});

app.UserInfoCollection = Backbone.Collection.extend({
  model: app.UserInfo,
  localStorage: new Store("backbone-user")
});

// Model - Session Info
app.SessionInfo = Backbone.Model.extend({
  defaults: {
    peerUserName: '',
  }
});

app.SessionInfoCollection = Backbone.Collection.extend({
  model: app.SessionInfo,
  localStorage: new Store("backbone-session")
});

/// End - Model Definitions

/// Start - React Components
function ChatView(props) {
  return (<li>{props.chat.id}</li>)
}

class ChatListView extends React.Component {
  constructor(props) {
    super(props);
    this.state = { collection: props.collection };

    this.state.collection.fetch(); // Loads list from local storage
    this.state.collection.on('add', this.refresh, this);
    this.state.collection.on('reset', this.refresh, this);
  }

  refresh() {
    this.setState({
      collection: this.state.collection
    })
  }

  clearChatContactHistory() {
    if (this.state.collection) {
      var length = this.state.collection.length;
      for (var i = 0; i < length; i++) {
        this.state.collection.at(0).destroy();
      }
    }
    this.setState({
      collection: null
    });
  }

  render() {
    const chatContacts = (this.state.collection) ? this.state.collection.map((elem) => 
      <ChatView key={elem.id} chat={elem}/>) : null
    return (
      <div id="chatContacts">
        <h1>Contacts</h1>
        <button onClick={() => this.clearChatContactHistory()}>Clear All</button>
        <ul id="chatContactList">{chatContacts}</ul>
      </div>
    )
  }
}

/// End - React Components

/// Start - View Definitions

app.MessageView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#message-template').html()),
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
app.MessageListView = Backbone.View.extend({
  el: '#chat',
  initialize: function() {
    this.input = this.$('#message');
    this.collection.on('add', this.addAll, this);
    this.collection.on('reset', this.addAll, this);
    this.collection.fetch(); // Loads list from local storage
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

    // Send message via WebRTC here
    rtcConn.send(this.input.val().trim());

    this.collection.create(this.newAttributes());
    this.input.val('');
  },
  clearMessageHistory: function(e) {
    var length = this.collection.length;
    for (var i = 0; i < length; i++) {
      this.collection.at(0).destroy();
    }
  },
  addOne: function(message) {
    var view = new app.MessageView({model: message});
    $('#messageList').append(view.render().el);
  },
  addAll: function() {
    // Clean the message list
    this.$('#messageList').html('');

    this.collection.each(this.addOne, this);
  },
  newAttributes: function() {
    return {
      body: this.input.val().trim(),
      userName: app.userInfoColl.at(0).toJSON().userName,
      timestamp: Date.now()
    }
  }
});

app.UserInfoView = Backbone.View.extend({
  el: '#userId',
  template: _.template($('#user-info-template').html()),
  render: function() {
    console.info('UserInfoView render triggered ... ');

    if (this.model.length > 0) {
      this.$el.html(this.template(this.model.at(0).toJSON()));
    }
    return this; // enable chained calls
  },
  initialize: function() {
    this.model.on('add', this.render, this);
    this.model.on('reset', this.render, this);
  },
});

/// End - View Definitions

/// Start - Utility Functions

// Add to chatList if it is not already present
function addToChatList(peerUserName) {
  if (app.chatList.where({id: peerUserName}).length === 0) {
    app.chatList.create({id: peerUserName});
  }
}

// Refresh messageList and messageListView
function selectChat(peerUserName) {
  app.MessageList = Backbone.Collection.extend({
    model: app.Message,
    localStorage: new Store("backbone-message-" + peerUserName),
  });
  app.messageList = new app.MessageList();

  if (app.messageListView !== undefined) {
    // TODO This switch is not working
    app.messageListView.collection = app.messageList;
    app.messageListView.initialize();
  } else {
    app.messageListView = new app.MessageListView({collection: app.messageList});
  }
}

/// End - Utility

// Initialize the app

app.userInfoColl = new app.UserInfoCollection();

app.userInfoColl.fetch(); // Loads list from local storage
console.log('User Info Collection Length: ' + app.userInfoColl.length);
if (app.userInfoColl.length == 0) {
  let userNameVal = prompt("User name", "Please enter your user name ...");

  if (userNameVal != null) {
    app.userInfoColl.create({userName: userNameVal});
  }
}

app.sessionInfoColl = new app.SessionInfoCollection();

app.userInfoView = new app.UserInfoView({model: app.userInfoColl});
app.userInfoView.render();

app.chatList = new app.ChatList();
// app.appView = new app.ChatListView({collection: app.chatList});
const domContainer = document.querySelector('#chatContacts');
ReactDOM.render(
  <ChatListView collection={app.chatList} />, 
  domContainer);

// PeerJS related code

let peerJSMode = 'remote';

// Default is remote
let peerJSHost = 'peerjs-srv-vpa-mod.herokuapp.com';
let peerJSPort = 443;
let peerJSSecure = 'true';

if (peerJSMode === 'local') {
  peerJSHost = 'localhost';
  peerJSPort = 9000;
  peerJSSecure = 'false';
}
   

// github repo for PeerJS Server - https://github.com/hemanth-manoharan/peerjs-server-express
let peer = null;
if (app.userInfoColl !== undefined) {
  if (peerJSMode === 'local') {
    peer = new Peer(app.userInfoColl.at(0).toJSON().userName,
      {host: 'localhost', port: 9000, path: '/peerjs'});
  } else {
  peer = new Peer(app.userInfoColl.at(0).toJSON().userName,
    {host: peerJSHost, port: peerJSPort, path: '/peerjs', secure: peerJSSecure});
  }
} else {
  console.log('ERROR: app.userInfoColl is undefined!');
  // peer = new Peer({host: 'localhost', port: 9000, path: '/peerjs'});
  peer = new Peer({host: peerJSHost, port: peerJSPort, path: '/peerjs', secure: peerJSSecure});
}

// This remote PeerJS cloud server works.
// let peer = new Peer({key: 'lwjd5qra8257b9'});

let rtcConn = null;

function updateSelfPeerId(id) {
  console.log('Peer received open event ...');
  console.log('My peer ID is: ' + id);
  $('#selfPeerId').html('Peer Id - ' + id);
}

peer.on('open', updateSelfPeerId);

peer.on('close', function() { 
  $('#status').html('Disconnected from ' + app.sessionInfoColl.at(0).toJSON().peerUserName);
});
peer.on('disconnected', function() {
  $('#status').html('Disconnected from ' + app.sessionInfoColl.at(0).toJSON().peerUserName);
});

peer.on('connection', function(conn) {
  console.log('Peer received connection event ...');

  if (rtcConn !== null) {
    rtcConn.close();
  }

  rtcConn = conn;
  setupConnection(conn);
});

$('#peerConnectButton').click(function() {
  console.log('Connecting to peer ...' + $('#peerId').val());

  if (rtcConn !== null) {
    rtcConn.close();
    peer.destroy();
    peer = new Peer({host: peerJSHost, port: peerJSPort, path: '/peerjs', secure: 'true'});
    peer.on('open', updateSelfPeerId);
    setTimeout(connectNew, 3000);
  } else {
    connectNew();
  }
});

function connectNew() {
  var conn = peer.connect($('#peerId').val());
  rtcConn = conn;
  setupConnection(conn);
}

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
        // Add it to the currently live messageList
        // Assumes that the current WebRTC connection
        // is for the current remote peer.
        app.messageList.create({
          body: data,
          userName: app.sessionInfoColl.at(0).toJSON().peerUserName,
          timestamp: Date.now() // Timestamp at which message is received, not sent
        });
      }
    });

    conn.on('close', function() {
      $('#status').html('Disconnected from ' + app.sessionInfoColl.at(0).toJSON().peerUserName);
    });
  });
}

function sendCommand(conn, command, message) {
  // TODO Very rudimentary command impl. for now
  conn.send(command + ':' + message);
}

function isCommandMessage(data) {
  // TODO Very rudimentary command impl. for now
  if (data.includes(':')) {
    let commandName = data.split(':')[0];
    switch(commandName) {
      case 'userId':
        return true;
    }
  }
  return false;
}

function processCommand(data) {
  // TODO Very rudimentary impl. for now
  let commandName = data.split(':')[0];
  switch(commandName) {
    case 'userId':
      let peerUserName = data.split(':')[1];

      if (app.sessionInfoColl.length == 1) {
        app.sessionInfoColl.at(0).destroy();
      }
      app.sessionInfoColl.create({peerUserName: peerUserName});

      $('#status').html('Connected to ' + peerUserName);
      
      addToChatList(peerUserName);
      selectChat(peerUserName);
      break;
  }
}
