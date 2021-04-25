'use strict';

// Backbone Related Code

var app = {}; // create app namespace

/// Start - Model Definitions

// Model - Chat

// For 1-1 chat - The userId is the same
// as the userName of the remote peer
// and members is empty
app.Chat = Backbone.Model.extend({
  default: {
    userId: '',
    members: []
  }
});

app.ChatList = Backbone.Collection.extend({
  model: app.Chat,
  localStorage: new Store("backbone-chat")
});

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
  return (<li>{props.chat.get('userId')}</li>)
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
    });
  }

  clearChatContactHistory() {
    if (this.state.collection) {
      var length = this.state.collection.length;
      for (var i = 0; i < length; i++) {
        this.state.collection.at(0).destroy();
      }
    }
    this.setState({
      collection: this.state.collection
    });
  }

  render() {
    const chatContacts = (this.state.collection) ? this.state.collection.map((elem) => 
      <ChatView key={elem.get('userId')} chat={elem}/>) : null;
    return (
      <div>
        <h1>Contacts</h1>
        <button onClick={() => this.clearChatContactHistory()}>Clear All</button>
        <ul id="chatContactList">{chatContacts}</ul>
      </div>
    );
  }
}

function MessageView(props) {
  return (
    <li>
      <label>
        <b>{props.message.get('userName')} </b>
        {new Date(props.message.get('timestamp')).toLocaleString()}: {props.message.get('body')}
      </label>
    </li>);
}

class MessageListView extends React.Component {
  constructor(props) {
    super(props);
    this.state = { currMessage: '', collection: props.collection };

    this.state.collection.fetch(); // Loads list from local storage
    this.state.collection.on('add', this.refresh, this);
    this.state.collection.on('reset', this.refresh, this);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCurrMessageChange = this.handleCurrMessageChange.bind(this);
  }

  refresh() {
    this.setState({
      currMessage: this.state.currMessage,
      collection: this.state.collection
    });
  }

  clearMessageHistory() {
    if (this.state.collection) {
      var length = this.state.collection.length;
      for (var i = 0; i < length; i++) {
        this.state.collection.at(0).destroy();
      }
    } else {
      console.error("Message collection is undefined!")
    }
    this.setState({
      currMessage: '',
      collection: this.state.collection
    });
  }

  handleCurrMessageChange(event) {
    this.setState({...this.state, currMessage: event.target.value});
  }

  handleSubmit(event) {
    // alert('A name was submitted: ' + this.state.value);
    event.preventDefault();
   
    const msg = this.state.currMessage.trim();
    if (!msg) {
      return;
    }

    // Send message via WebRTC here
    rtcConn.send(msg);

    this.state.collection.create({
      body: msg,
      userName: app.userInfoColl.at(0).toJSON().userName,
      timestamp: Date.now()
    });

    // Update local state
    this.setState({
      currMessage: '',
      collection: this.state.collection
    });
  }

  render() {
    const messages = (this.state.collection) ? this.state.collection.map((elem) => 
      <MessageView key={elem.get('timestamp')} message={elem}/>) : null;
    return (
      <div>
        <div id="header">
          <h1>Messages</h1>
          <button onClick={() => this.clearMessageHistory()}>Clear All</button>
        </div>
        <div id="messages">
          <ul id="messageList">{messages}</ul>
        </div>
        <div id="footer">
          <br/>
          <form onSubmit={this.handleSubmit}>
            <input type="text" value={this.state.currMessage} onChange={this.handleCurrMessageChange} />
            <input type="submit" value="Send" />
          </form>
        </div>
      </div>
    );
  }
}

function UserInfoView(props) {
  return (
    <div>
      <label>UserName: {props.userName}</label>
    </div>
  );
}

/// End - React Components

/// Start - Utility Functions

// Add to chatList if it is not already present
function addToChatList(peerUserName) {
  if (app.chatList.where({userId: peerUserName}).length === 0) {
    app.chatList.create({userId: peerUserName});
  }
}

// Refresh messageList and messageListView
function selectChat(peerUserName) {
  app.MessageList = Backbone.Collection.extend({
    model: app.Message,
    localStorage: new Store("backbone-message-" + peerUserName),
  });

  app.messageList = new app.MessageList();
  const domContainer = document.querySelector('#chat');
  ReactDOM.render(
    <MessageListView collection={app.messageList} />, 
    domContainer)
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

const userInfoDomContainer = document.querySelector('#userInfoPanel');
ReactDOM.render(
  <UserInfoView userName={app.userInfoColl.at(0).toJSON().userName} />,
  userInfoDomContainer);

app.chatList = new app.ChatList();
const chatListDomContainer = document.querySelector('#chatContacts');
ReactDOM.render(
  <ChatListView collection={app.chatList} />, 
  chatListDomContainer);

// PeerJS related code

let peerJSMode = 'local';

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
