function ChatView(props) {
  return /*#__PURE__*/React.createElement("li", null, props.chat.get('userId'));
}

export function ChatListView(props) {
  const chatContacts = props.collection ? props.collection.map(elem => /*#__PURE__*/React.createElement(ChatView, {
    key: elem.get('userId'),
    chat: elem
  })) : null;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, "Contacts"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("button", {
    onClick: props.onClear
  }, "Clear All")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("ul", {
    id: "chatContactList"
  }, chatContacts)));
}

function MessageView(props) {
  return /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("b", null, props.message.get('userName'), " "), new Date(props.message.get('timestamp')).toLocaleString(), ": ", props.message.get('body')));
}

export function MessageListView(props) {
  const messages = props.collection ? props.collection.map(elem => /*#__PURE__*/React.createElement(MessageView, {
    key: elem.get('timestamp'),
    message: elem
  })) : null;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, "Messages"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("button", {
    onClick: props.onClear
  }, "Clear All")), /*#__PURE__*/React.createElement("div", {
    id: "messages"
  }, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("ul", {
    id: "messageList"
  }, messages)), /*#__PURE__*/React.createElement("div", {
    id: "footer"
  }, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("form", {
    onSubmit: props.onSend
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: props.currMessage,
    onChange: props.onCurrMessageChange
  }), /*#__PURE__*/React.createElement("input", {
    type: "submit",
    value: "Send"
  }))));
}
export function UserInfoView(props) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "UserName:"), " ", props.collection && props.collection.at(0) ? props.collection.at(0).toJSON().userName : "NOT SET"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("button", {
    onClick: props.onClear
  }, "Clear User Info"));
}
export function PeerJSInfoView(props) {
  return /*#__PURE__*/React.createElement("div", {
    className: "peerjs-info"
  }, /*#__PURE__*/React.createElement("h3", null, "PeerJS Info:"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", null, "Peer Id:"), " ", props.info.selfPeerId, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", null, "Status:"), " ", props.info.status);
}