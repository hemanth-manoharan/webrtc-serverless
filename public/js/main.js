'use strict';

async function run() {
  const appVersion = 'v0.2.0';
  let {
    generateKeyPair,
    sign,
    exportKeyJWK,
    importPrivateKeyJWK
  } = await import('./crypto.js');
  let {
    app
  } = await import('./bb-models.js');
  let {
    ChatListView,
    MessageListView,
    UserInfoView,
    PeerJSInfoView
  } = await import('./components.js');

  class ChatApp extends React.Component {
    constructor(props) {
      super(props);
      let userInfoColl = new app.UserInfoCollection();
      let sessionInfoColl = new app.SessionInfoCollection();
      let chatList = new app.ChatList(); // Loads lists from local storage

      userInfoColl.fetch();
      sessionInfoColl.fetch();
      chatList.fetch();
      console.log('User Info Collection Length: ' + userInfoColl.length);
      this.state = {
        peerJSInfo: {
          peer: null,
          rtcConn: null,
          peerJSMode: 'remote',
          // Values: 'local' or 'remote',
          selfPeerId: '',
          peerId: '',
          status: ''
        },
        userInfoColl,
        sessionInfoColl,
        chatList,
        currMessage: '',
        messageList: null
      }; // Perform all method bindings

      this.clearUserInfo = this.clearUserInfo.bind(this);
      this.clearMessageHistory = this.clearMessageHistory.bind(this);
      this.clearChatContactHistory = this.clearChatContactHistory.bind(this);
      this.handleCurrMessageChange = this.handleCurrMessageChange.bind(this);
      this.handleSend = this.handleSend.bind(this);
      this.handlePeerIdChange = this.handlePeerIdChange.bind(this);
      this.handleConnect = this.handleConnect.bind(this);
      this.peerJSInitPrep = this.peerJSInitPrep.bind(this);
      this.peerJSInit = this.peerJSInit.bind(this);
      this.setupPeer = this.setupPeer.bind(this);
      this.updateSelfPeerId = this.updateSelfPeerId.bind(this);
      this.connectNew = this.connectNew.bind(this);
      this.setPeerJSStatus = this.setPeerJSStatus.bind(this);
      this.setupConnectionPrep = this.setupConnectionPrep.bind(this);
      this.setupConnection = this.setupConnection.bind(this);
      this.getUserName = this.getUserName.bind(this);
      this.getPeerUserName = this.getPeerUserName.bind(this);
      this.sendCommand = this.sendCommand.bind(this);
      this.isCommandMessage = this.isCommandMessage.bind(this);
      this.processCommand = this.processCommand.bind(this);
      this.addToChatList = this.addToChatList.bind(this);
      this.selectChat = this.selectChat.bind(this);
      this.addToMessageList = this.addToMessageList.bind(this);
      this.populateUserInfoCollection = this.populateUserInfoCollection.bind(this);
      this.setUserInfo = this.setUserInfo.bind(this);

      if (userInfoColl.length == 0) {
        let userNameVal = prompt("User name", "Please enter your user name ...");

        if (userNameVal != null) {
          this.populateUserInfoCollection(userNameVal);
        }
      } else {
        this.peerJSInitPrep();
      }
    }

    render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "chat-app"
      }, /*#__PURE__*/React.createElement("h1", null, "WebRTC chat"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("h3", null, appVersion), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement(UserInfoView, {
        collection: this.state.userInfoColl,
        onClear: () => this.clearUserInfo()
      }), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Peer id to connect to:")), /*#__PURE__*/React.createElement("form", {
        onSubmit: this.handleConnect
      }, /*#__PURE__*/React.createElement("input", {
        type: "text",
        value: this.state.peerJSInfo.peerId,
        onChange: this.handlePeerIdChange
      }), /*#__PURE__*/React.createElement("input", {
        type: "submit",
        value: "Connect"
      }))), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement(PeerJSInfoView, {
        info: this.state.peerJSInfo
      }), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement(ChatListView, {
        collection: this.state.chatList,
        onClear: () => this.clearChatContactHistory()
      }), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement(MessageListView, {
        collection: this.state.messageList,
        currMessage: this.state.currMessage,
        onSend: event => this.handleSend(event),
        onCurrMessageChange: event => this.handleCurrMessageChange(event),
        onClear: () => this.clearMessageHistory()
      }));
    }

    clearUserInfo() {
      if (this.state.userInfoColl) {
        this.state.userInfoColl.fetch();
        var length = this.state.userInfoColl.length;

        for (var i = 0; i < length; i++) {
          this.state.userInfoColl.at(0).destroy();
        }

        this.setState({
          userInfoColl: this.state.userInfoColl
        });
      }
    }

    clearMessageHistory() {
      if (this.state.messageList) {
        this.state.messageList.fetch();
        var length = this.state.messageList.length;

        for (var i = 0; i < length; i++) {
          this.state.messageList.at(0).destroy();
        }
      } else {
        console.error("Message collection is undefined!");
      }

      this.setState({
        messageList: this.state.messageList
      });
    }

    clearChatContactHistory() {
      if (this.state.chatList) {
        this.state.chatList.fetch();
        var length = this.state.chatList.length;

        for (var i = 0; i < length; i++) {
          this.state.chatList.at(0).destroy();
        }
      }

      this.setState({
        chatList: this.state.chatList
      });
    }

    handleCurrMessageChange(event) {
      this.setState({
        currMessage: event.target.value
      });
    }

    handleSend(event) {
      event.preventDefault();
      const msg = this.state.currMessage.trim();

      if (!msg) {
        return;
      } // Send message via WebRTC here


      this.state.peerJSInfo.rtcConn.send(msg);
      this.state.messageList.create({
        body: msg,
        userName: this.getUserName(),
        timestamp: Date.now()
      });
      this.setState({
        currMessage: '',
        messageList: this.state.messageList
      });
    }

    handlePeerIdChange(event) {
      this.setState({
        peerJSInfo: { ...this.state.peerJSInfo,
          peerId: event.target.value
        }
      });
    }

    handleConnect(event) {
      event.preventDefault();
      const peerId = this.state.peerJSInfo.peerId.trim();

      if (!peerId) {
        return;
      }

      console.log('Connecting to peer ...' + peerId);

      if (this.state.peerJSInfo.rtcConn !== null) {
        this.state.peerJSInfo.rtcConn.close(); // TODO Why are we destroying the 'peer' as well?
        // It should be sufficient to just close the rtcConn.
        // TODO This flow is not enabled for encryption and
        // signature based authentication.

        this.state.peerJSInfo.peer.destroy();
        let peer = new Peer({
          host: peerJSHost,
          port: peerJSPort,
          path: '/peerjs',
          secure: 'true'
        });
        peer.on('open', updateSelfPeerId);
        this.setState({
          peerJSInfo: { ...this.state.peerJSInfo,
            peer
          }
        });
        setTimeout(this.connectNew, 3000);
      } else {
        this.connectNew();
      }
    } // PeerJS related init code


    peerJSInitPrep() {
      if (!this.state.userInfoColl) {
        console.log('ERROR: userInfoColl is undefined!');
        return;
      }

      let user = this.state.userInfoColl.at(0).toJSON();
      let id = user.userName;
      let pubKeyJWK = JSON.stringify(user.pubKeyJWK);
      let pvtKeyJWK = JSON.stringify(user.pvtKeyJWK);
      let pvtKeyPromise = importPrivateKeyJWK(JSON.parse(pvtKeyJWK));
      const chatApp = this;
      pvtKeyPromise.then(function (pvtKey) {
        chatApp.peerJSInit(id, pubKeyJWK, pvtKey);
      }, function (error) {
        console.log(`Error importing private key: ${error}`);
      });
    }

    peerJSInit(id, pubKeyJWK, pvtKey) {
      // github repo for PeerJS Server - https://github.com/hemanth-manoharan/peerjs-server-express
      let peerJSHost = 'peerjs-srv-vpa-mod.herokuapp.com';
      let peerJSPort = 443;
      let peerJSSecure = true;

      if (this.state.peerJSInfo.peerJSMode === 'local') {
        peerJSHost = 'localhost';
        peerJSPort = 9000;
        peerJSSecure = false;
      }

      let authNDetails = {
        model: "SIGNATURE",
        publicKeyJWK: JSON.stringify(pubKeyJWK),
        privateKey: pvtKey
      };
      let peer = new Peer(id, {
        host: peerJSHost,
        port: peerJSPort,
        path: '/peerjs',
        secure: peerJSSecure,
        authNDetails: authNDetails
      });
      this.setupPeer(peer);
    }

    setupPeer(peer) {
      this.setState({
        peerJSInfo: { ...this.state.peerJSInfo,
          peer: peer
        }
      }); // This remote PeerJS cloud server works.
      // let peer = new Peer({key: 'lwjd5qra8257b9'});

      const chatApp = this;
      peer.on('open', this.updateSelfPeerId);
      peer.on('close', function () {
        chatApp.setPeerJSStatus('Disconnected from ' + chatApp.getPeerUserName());
      });
      peer.on('disconnected', function () {
        chatApp.setPeerJSStatus('Disconnected from ' + chatApp.getPeerUserName());
      });
      peer.on('connection', function (conn) {
        chatApp.setupConnectionPrep(conn);
      });
    }

    updateSelfPeerId(id) {
      console.log('Peer received open event ...');
      console.log('My peer ID is: ' + id);
      this.setState({
        peerJSInfo: { ...this.state.peerJSInfo,
          selfPeerId: id
        }
      });
    }

    connectNew() {
      let conn = this.state.peerJSInfo.peer.connect(this.state.peerJSInfo.peerId);
      this.setupConnection(conn);
    }

    setPeerJSStatus(msg) {
      this.setState({
        peerJSInfo: { ...this.state.peerJSInfo,
          status: msg
        }
      });
    }

    setupConnectionPrep(conn) {
      console.log('Peer received connection event ...');

      if (this.state.peerJSInfo.rtcConn !== null) {
        this.state.peerJSInfo.rtcConn.close();
      }

      this.setupConnection(conn);
    }

    setupConnection(conn) {
      console.log('Setting up connection');
      this.setPeerJSStatus('Connected to ' + conn.peer);
      const chatApp = this;
      conn.on('open', function () {
        chatApp.sendCommand(conn, 'userId', chatApp.getUserName()); // Receive messages

        conn.on('data', function (data) {
          console.log('Received message:' + data);

          if (chatApp.isCommandMessage(data)) {
            chatApp.processCommand(data);
          } else {
            // Normal message
            // Add it to the currently live messageList
            // Assumes that the current WebRTC connection
            // is for the current remote peer.
            chatApp.addToMessageList(data);
          }
        });
        conn.on('close', function () {
          chatApp.setPeerJSStatus('Disconnected from ' + chatApp.getPeerUserName());
        });
      });
      this.setState({
        peerJSInfo: { ...this.state.peerJSInfo,
          rtcConn: conn
        }
      });
    }

    getUserName() {
      if (!this.state.userInfoColl || !this.state.userInfoColl.at(0)) {
        return 'NOT SET';
      }

      return this.state.userInfoColl.at(0).toJSON().userName;
    }

    getPeerUserName() {
      if (!this.state.sessionInfoColl || !this.state.sessionInfoColl.at(0)) {
        return 'NOT SET';
      }

      return this.state.sessionInfoColl.at(0).toJSON().peerUserName;
    }

    sendCommand(conn, command, message) {
      // TODO Very rudimentary command impl. for now
      conn.send(command + ':' + message);
    }

    isCommandMessage(data) {
      // TODO Very rudimentary command impl. for now
      if (data.includes(':')) {
        let commandName = data.split(':')[0];

        switch (commandName) {
          case 'userId':
            return true;
        }
      }

      return false;
    }

    processCommand(data) {
      // TODO Very rudimentary impl. for now
      let commandName = data.split(':')[0];

      switch (commandName) {
        case 'userId':
          let peerUserName = data.split(':')[1];
          let sessionInfoColl = this.state.sessionInfoColl;
          sessionInfoColl.fetch();
          const length = sessionInfoColl.length;

          for (var i = 0; i < length; i++) {
            sessionInfoColl.at(0).destroy();
          }

          sessionInfoColl.create({
            peerUserName: peerUserName
          });
          this.setState({
            sessionInfoColl
          });
          this.setPeerJSStatus('Connected to ' + peerUserName);
          this.addToChatList(peerUserName);
          this.selectChat(peerUserName);
          break;
      }
    } // Add to chatList if it is not already present


    addToChatList(peerUserName) {
      if (this.state.chatList.where({
        userId: peerUserName
      }).length === 0) {
        this.state.chatList.create({
          userId: peerUserName
        });
        this.setState({
          chatList: this.state.chatList
        });
      }
    } // Refresh messageList and messageListView


    selectChat(peerUserName) {
      app.MessageList = Backbone.Collection.extend({
        model: app.Message,
        localStorage: new Store("backbone-message-" + peerUserName)
      });
      let messageList = new app.MessageList();
      messageList.fetch();
      this.setState({
        messageList
      });
    }

    addToMessageList(data) {
      this.state.messageList.create({
        body: data,
        userName: this.getPeerUserName(),
        timestamp: Date.now() // Timestamp at which message is received, not sent

      });
      this.setState({
        messageList: this.state.messageList
      });
    }

    populateUserInfoCollection(userName) {
      // Generate <Public, Private> key pair here and
      // store it in the userInfoColl.
      const keyPairPromise = generateKeyPair();
      const chatApp = this;
      keyPairPromise.then(function (keyPair) {
        let pubKeyPromise = exportKeyJWK(keyPair.publicKey);
        pubKeyPromise.then(function (pubKeyJWK) {
          // Now trigger the private key set
          // in succession to avoid race conditions.
          let pvtKeyPromise = exportKeyJWK(keyPair.privateKey);
          pvtKeyPromise.then(function (pvtKeyJWK) {
            chatApp.setUserInfo(userName, pubKeyJWK, pvtKeyJWK);
          }, function (error) {
            console.log(`Error updating private key in user info: ${error}`);
          });
        }, function (error) {
          console.log(`Error updating public key in user info: ${error}`);
        });
      }, function (error) {
        console.log(`Error updating key-pair in user info: ${error}`);
      });
    }

    setUserInfo(userName, pubKeyJWK, pvtKeyJWK) {
      this.state.userInfoColl.create({
        userName: userName,
        pubKeyJWK: pubKeyJWK,
        pvtKeyJWK: pvtKeyJWK
      });
      this.state.userInfoColl.fetch();
      this.setState({
        userInfoColl: this.state.userInfoColl
      }); // Trigger peerJS initialization here

      this.peerJSInitPrep();
    }

  }

  ReactDOM.render( /*#__PURE__*/React.createElement(ChatApp, null), document.getElementById('root'));
}