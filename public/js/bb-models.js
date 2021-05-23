// Backbone Related Code
export var app = {}; // create app namespace
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
}); // Model - Message

app.Message = Backbone.Model.extend({
  defaults: {
    body: '',
    userName: '',
    timestamp: -1
  }
}); // Model - User Info

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
}); // Model - Session Info

app.SessionInfo = Backbone.Model.extend({
  defaults: {
    peerUserName: ''
  }
});
app.SessionInfoCollection = Backbone.Collection.extend({
  model: app.SessionInfo,
  localStorage: new Store("backbone-session")
}); /// End - Model Definitions