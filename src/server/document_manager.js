var child_process = require('child_process'),
    fs = require('fs'),
    _ = require('underscore'),
    ds = new require('./document_storage.js');



// Document Manager
// =============

var DocumentManager = function(server) {
  this.io = require('socket.io').listen(server);
  this.documents = [];
  this.sessions = [];
  this.sentMessages = [ // Re-send them when a new client joins
    {"command": "user:announce", "params": {"user": "michael", "color": "#82AA15"}},    
    // {"command": "node:insert",   "params": {"user": "michael", "type": "text", "rev": 3, "attributes": {"content": "It's literally impossible to build an editor that can be used across different disciplines. Scientists, writers and journalists all have different needs. That's why Substance just provides the core infrastructure, and introduces Content Types that can be developed individually by the community, tailored to their specific needs."}}},
    //{"command": "node:insert",   "params": {"user": "michael", "type": "map", "rev": 3, "attributes": {"content": "Hey! I'm a map."}}},
    {"command": "node:insert",   "params": {"user": "michael", "type": "section", "rev": 3, "attributes": {"name": "Structured Composition"}}},
    {"command": "node:insert",   "params": {"user": "michael", "type": "text", "rev": 4, "attributes": {"content": "Instead of conventional sequential text-editing, documents are composed of Content Nodes in a structured manner. The composer focuses on content, by leaving the layout part to the system, not the user. Because of the absence of formatting utilities, it suggests structured, content-oriented writing."}}},
    {"command": "node:insert",   "params": {"user": "michael", "type": "section", "rev": 5, "attributes": {"name": "Open Collaboration"}}},
    {"command": "node:insert",   "params": {"user": "michael", "type": "text", "rev": 6, "attributes": {"content": "The Substance Composer targets open collaboration. Co-authors can edit one document at the same time, while content is synchronized among users in realtime. There's a strong focus on reader collaboration as well. They can easily participate and comment on certain text passages or suggest a patch."}}},
    {"command": "node:insert",   "params": {"user": "michael", "type": "section", "rev": 7, "attributes": {"name": "Patches"}}},
    {"command": "node:insert",   "params": {"user": "michael", "type": "text", "rev": 8, "attributes": {"content": "Readers will be able to contribute right away by submitting patches, which can be applied to the document at a later time. Patches are an important concept to realize a peer-review process."}}},
    {"command": "node:insert",   "params": {"user": "michael", "type": "section", "rev": 9, "attributes": {"name": "Operations"}}},
    {"command": "node:insert",   "params": {"user": "michael", "type": "text", "rev": 10, "attributes": {"content": "The Substance Composer uses atomic operations to transform documents. This is a fundamental concept that allows collaborative editing of one document (even at the same time). The technique behind it is called Operational Transformation. Based on all recorded operations, the complete document history can be reproduced at any time. In other words. This is the best thing since sliced bread."}}},
    {"command": "user:announce", "params": {"user": "john", "color": "#4da6c7"}},
    {"command": "node:select",   "params": {"user": "john", "nodes": ["/cover/1"], "rev": 11}},
    {"command": "node:select",   "params": {"user": "michael", "nodes": ["/section/2", "/text/3"], "rev": 11}},
    {"command": "node:moved",     "params": {"user": "michael", "nodes": ["/section/2", "/text/3"], "target": "/text/4", "rev": 11}}
  ];
  this.locks = {};
  this.bindHandlers();
};

_.extend(DocumentManager.prototype, {
  // Bind Socket.io handlers
  bindHandlers: function() {
    var that = this;

    this.io.sockets.on('connection', function (socket) {

      // Bind to this and pass through socket instance as the first parameter
      function delegate(fn) {
        return function() {
          _.bind(fn, that);
          fn.apply(that, [socket].concat(arguments[0]).concat(function(){}));
        };
      }

      // Hi user
      that.openSession(socket)

      // Do things
      socket.on('document:create', delegate(that.createDocument));
      socket.on('document:join',   delegate(that.joinDocument));
      socket.on('document:leave',  delegate(that.leaveDocument));
      socket.on('document:update', delegate(that.updateDocument));
      socket.on('node:select',     delegate(that.selectNodes));
      socket.on('node:move',       delegate(that.moveNodes));
      socket.on('disconnect',      delegate(that.closeSession));
      
      // Perform some bootstrap operations
      _.each(that.sentMessages, function(message) {
        socket.emit(message.command, message.params);
      });
      // Send an update of users and their locks
      socket.emit('node:selected', that.locks);
      
    });
  },

  // Keep track of messages emitted so new clients can "catch up"
  emitAll: function(command, params) {
    console.log("Emitting " + command);
    this.sentMessages.push({command: command, params: params});
    this.io.sockets.emit(command, params);
  },

  // Document
  // -------------

  // Create a document, join the fun
  createDocument: function(socket, cb) {
    console.log("Received document:create");
    var document = Document.create(util.schema());
    registerDocument(document);
    cb(null, { document: doc, sessions: {} });
  },

  // Join a document editing session, update the session
  joinDocument: function(socket, document, cb) {
    console.log("Received document:join");
    this.documents[document.id] = {
      collaborators: [socket.id],
      model: document
    }
  },

  updateDocument: function(socket, operation, cb) {
    console.log("Received document:update");
    cb(null, 'confirmed');
  },

  // User closes a particular document
  // TODO: should this be explicitly called, or should it
  // be just overruled by another call of joinDocument
  leaveDocument: function(socket, cb) {
    // TODO: implement
    console.log("Received document:leave");
  },

  // Node
  // -------------
  selectNodes: function(socket, params, cb) {
    var that = this;
    var nodes = params.nodes;
    var user = params.user;

    console.log("Received node:select");
    
    // Clear out all the locks the user currently has on nodes
    for(node in this.locks) {
      if (that.locks[node] == user) {
        delete that.locks[node];
      }
    };

    // And set locks on ones the user has just sent us
    //   (assuming no one else has locked it)
    _.each(nodes, function(node) {
      if (!that.locks[node]) {
        that.locks[node] = user;
      }
    });
    //Don't use this.emitAll because we don't need to log node selections
    this.io.sockets.emit("node:selected", that.locks);
    cb(null, 'selected');
  },

  moveNodes: function(socket, params, cb) {
    var that = this;
    var target = params.target;
    var user = params.user;

    console.log("Received node:move");
    
    // Make sure the user has the node locked or that it is not locked
    if((target in this.locks) && (this.locks[target] != user)) {
      console.log("Ignoring move");
      return;
    };

    this.emitAll("node:moved", params);
    cb(null, 'selected');
  },

  // Session
  // -------------

  // A new user joins the party
  openSession: function(socket, cb) {
    this.sessions[socket.id] = {
      id: socket.id,
      username: socket.id,
      document: null,
      color: "#82AA15"
    };
    console.log('Started a new session ' + socket.id);
  },

  // When a user leaves the party
  closeSession: function(socket, cb) {
    console.log('removing session ' + socket.id);
    
    // Remove locked nodes
    for (node in this.locks) {
      if (this.locks[node] == socket.id) {
        delete this.locks[node];
      }
    }
    delete this.sessions[socket.id];
  }

});

module.exports = DocumentManager;