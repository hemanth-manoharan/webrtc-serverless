function ChatView(props) {
  return (<li>{props.chat.get('userId')}</li>)
}

export function ChatListView(props) {
  const chatContacts = (props.collection) ? props.collection.map((elem) => 
    <ChatView key={elem.get('userId')} chat={elem}/>) : null;
  return (
    <div>
      <div>
        <h2>Contacts</h2>
        <br/>
        <button onClick={props.onClear}>Clear All</button>
      </div>
      <div>
        <br/>
        <ul id="chatContactList">{chatContacts}</ul>
      </div>
    </div>
  );
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

export function MessageListView(props) {
  const messages = (props.collection) ? props.collection.map((elem) => 
    <MessageView key={elem.get('timestamp')} message={elem}/>) : null;
  return (
    <div>
      <div>
        <h2>Messages</h2>
        <br/>
        <button onClick={props.onClear}>Clear All</button>
      </div>
      <div id="messages">
        <br/>
        <ul id="messageList">{messages}</ul>
      </div>
      <div id="footer">
        <br/>
        <form onSubmit={props.onSend}>
          <input type="text" value={props.currMessage} onChange={props.onCurrMessageChange} />
          <input type="submit" value="Send" />
        </form>
      </div>
    </div>
  );
}

export function UserInfoView(props) {
  return (
    <div>
      <div><b>UserName:</b> {(props.collection && props.collection.at(0)) 
        ? props.collection.at(0).toJSON().userName : "NOT SET"}</div>
      <br/>
      <button onClick={props.onClear}>Clear User Info</button>
    </div>
  );
}

export function PeerJSInfoView(props) {
  return (
    <div className="peerjs-info">
      <h3>PeerJS Info:</h3>
      <br/>

      <b>Peer Id:</b> { props.info.selfPeerId }
      <br/>
      
      <b>Status:</b> { props.info.status }
    </div>
  );
}
