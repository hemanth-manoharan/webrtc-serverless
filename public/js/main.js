'use strict';

// Global variables

// peerjs related
let peer = null;
let rtcConn = null;
let peerJSMode = 'local'; // Other value is 'remote'

// Security related
// Cache the pvt key as an optimization
let gblPvtKey = null;

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
    pubKeyJWK: '',
    pvtKeyJWK: ''
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

class UserInfoView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collection: props.userInfoColl
    };
    this.state.collection.fetch(); // Loads list from local storage
    this.state.collection.on('add', this.refresh, this);
    this.state.collection.on('reset', this.refresh, this);
    this.state.collection.on('change', this.refresh, this);
  }

  refresh() {
    this.setState({
      collection: this.state.collection
    });
  }

  clearUserInfo() {
    if (this.state.collection) {
      var length = this.state.collection.length;
      for (var i = 0; i < length; i++) {
        this.state.collection.at(0).destroy();
      }
      // Update local state
      this.setState({
        collection: this.state.collection
      });
    }
  }

  render() {
    return (
      <div>
        <label>UserName: {(this.state.collection && this.state.collection.at(0)) 
          ? this.state.collection.at(0).userName : "NOT SET"}</label>
        <button onClick={() => this.clearUserInfo()}>Clear User Info</button>
      </div>
    );
  }
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

function populateUserInfoCollection(userName) {
  // Generate <Public, Private> key pair here and
  // store it in the userInfoColl.
  const keyPairPromise = generateKeyPair();

  keyPairPromise.then(
    function(keyPair) {
      let pubKeyPromise = exportKeyJWK(keyPair.publicKey);
      pubKeyPromise.then(
        function(pubKeyJWK) {
          // Now trigger the private key set
          // in succession to avoid race conditions.
          let pvtKeyPromise = exportKeyJWK(keyPair.privateKey);
          pvtKeyPromise.then(
            function(pvtKeyJWK) {
              app.userInfoColl.create({
                userName: userName,
                pubKeyJWK: pubKeyJWK,
                pvtKeyJWK: pvtKeyJWK 
              });

              app.userInfoColl.fetch();

              // Trigger peerJS initialization here
              peerJSInitPrep();
            },
            function(error) {
              console.log(`Error updating private key in user info: ${error}`);
            }
          );
        },
        function(error) {
          console.log(`Error updating public key in user info: ${error}`);
        }
      );
    },
    function(error) {
      console.log(`Error updating key-pair in user info: ${error}`);
    }
  );
}

/// End - Utility

/// Start - Web Crypto Utility

async function generateKeyPair() {
  const keyPairPromise = await window.crypto.subtle.generateKey({
      name: "ECDSA",
      namedCurve: "P-384"
    },
    true,
    ["sign", "verify"]
  );
  return keyPairPromise;
}

async function sign(pvtKey, data) {
  const signPromise = await window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: {name: "SHA-384"},
    },
    pvtKey,
    data
  );
  return signPromise;
}

async function exportKeyJWK(key) {
  const exportedJWKPromise = await window.crypto.subtle.exportKey(
    "jwk",
    key
  );
  return exportedJWKPromise;
}

async function importKeyJWK(jwk) {
  const importedKeyPromise = await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDSA",
      namedCurve: "P-384"
    },
    true,
    ["sign"]
  );
  return importedKeyPromise;
}

// Ref: https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
// function ab2str(buf) {
//   return String.fromCharCode.apply(null, new Uint16Array(buf));
// }

// async function checkEncryptAndDecrypt(keyPair) {
//   let secretKey = window.crypto.subtle.deriveKey(
//     {
//       name: "ECDH",
//       public: keyPair.publicKey
//     },
//     keyPair.privateKey,
//     {
//       name: "AES-GCM",
//       length: 256
//     },
//     false,
//     ["encrypt", "decrypt"]
//   );

//   // Encrypt
//   iv = window.crypto.getRandomValues(new Uint8Array(12));
//   let encoded = getMessageEncoding();

//   ciphertext = await window.crypto.subtle.encrypt(
//     {
//       name: "AES-GCM",
//       iv: iv
//     },
//     secretKey,
//     encoded
//   );

//   let buffer = new Uint8Array(ciphertext, 0, 5);
//   console.log(`${buffer}...[${ciphertext.byteLength} bytes total]`);

//   // Decrypt
//   try {
//     let decrypted = await window.crypto.subtle.decrypt(
//       {
//         name: "AES-GCM",
//         iv: iv
//       },
//       secretKey,
//       ciphertext
//     );

//     let dec = new TextDecoder();
//     console.log(dec.decode(decrypted));
//   } catch (e) {
//     console.log("*** Decryption error ***");
//   }
// }

/// End - Web Crypto Utility 

// Initialize the app

app.userInfoColl = new app.UserInfoCollection();
app.sessionInfoColl = new app.SessionInfoCollection();

app.userInfoColl.fetch(); // Loads list from local storage
console.log('User Info Collection Length: ' + app.userInfoColl.length);
if (app.userInfoColl.length == 0) {
  let userNameVal = prompt("User name", "Please enter your user name ...");

  if (userNameVal != null) {
    populateUserInfoCollection(userNameVal);
  }
} else {
  peerJSInitPrep();
}

app.chatList = new app.ChatList();
const chatListDomContainer = document.querySelector('#chatContacts');
ReactDOM.render(
  <ChatListView collection={app.chatList} />, 
  chatListDomContainer);

// PeerJS related init code
function peerJSInitPrep() {
  const userInfoDomContainer = document.querySelector('#userInfoPanel');
  ReactDOM.render(
    <UserInfoView userInfoColl={app.userInfoColl} />,
    userInfoDomContainer);

  // let timestamp = Date.now();
 
  // app.userInfoColl.fetch();
  let id = app.userInfoColl.at(0).toJSON().userName;
  
  let pvtKeyJWK = JSON.stringify(app.userInfoColl.at(0).toJSON().pvtKeyJWK);
  let pvtKeyPromise = importKeyJWK(JSON.parse(pvtKeyJWK));

  pvtKeyPromise.then(
    function(pvtKey) {
      gblPvtKey = pvtKey;

      // const data = id + ':' + timestamp;
      // const enc = new TextEncoder();
      // const encoded = enc.encode(data);

      // const signaturePromise = sign(pvtKey, encoded);

      // signaturePromise.then(
      //   function(signature) {
      //     let dec = new TextDecoder();
      peerJSInit(id);
      //   },
      //   function(error){
      //     console.log(`Error generating signature: ${error}`);
      //   }
      // );
    },
    function(error) {
      console.log(`Error updating importing pvt key: ${error}`);
    }
  );
}

function peerJSInit(id) {
  // github repo for PeerJS Server - https://github.com/hemanth-manoharan/peerjs-server-express
  let peerJSHost = 'peerjs-srv-vpa-mod.herokuapp.com';
  let peerJSPort = 443;
  let peerJSSecure = 'true';

  if (peerJSMode === 'local') {
    peerJSHost = 'localhost';
    peerJSPort = 9000;
    peerJSSecure = 'false';
  }

  // Get public key in string format
  // let peerJSPublicKeyJWK = JSON.stringify(app.userInfoColl.at(0).toJSON().pubKeyJWK);

  if (app.userInfoColl !== undefined) {
    if (peerJSMode === 'local') {
      peer = new Peer(id, {
          host: 'localhost', port: 9000, path: '/peerjs',
          authNModel: "SIGNATURE"
      });
    } else {
      peer = new Peer(id, {
          host: peerJSHost, port: peerJSPort, path: '/peerjs',
          secure: peerJSSecure,
          authNModel: "SIGNATURE",
      });
    }
  } else {
    console.log('ERROR: app.userInfoColl is undefined!');
    // peer = new Peer({host: 'localhost', port: 9000, path: '/peerjs'});
    peer = new Peer({host: peerJSHost, port: peerJSPort, path: '/peerjs', secure: peerJSSecure});
  }

  // This remote PeerJS cloud server works.
  // let peer = new Peer({key: 'lwjd5qra8257b9'});

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

      // TODO Why are we destroying the 'peer' as well?
      // It should be sufficient to just close the rtcConn.
      // TODO This flow is not enabled for encryption and
      // signature based authentication.
      peer.destroy();
      peer = new Peer({host: peerJSHost, port: peerJSPort, path: '/peerjs', secure: 'true'});
      peer.on('open', updateSelfPeerId);

      setTimeout(connectNew, 3000);
    } else {
      connectNew();
    }
  });
}

function updateSelfPeerId(id) {
  console.log('Peer received open event ...');
  console.log('My peer ID is: ' + id);
  $('#selfPeerId').html('Peer Id - ' + id);
}

function connectNew() {
  var conn = peer.connect($('#peerId').val());
  rtcConn = conn;
  setupConnection(conn);
}

function setupConnection(conn) {
  console.log('Setting up connection');

  $('#status').html('Connected to ' + conn.peer);

  conn.on('open', function() {
    // hemanth-manoharan
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
  // hemanth-manoharan
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
