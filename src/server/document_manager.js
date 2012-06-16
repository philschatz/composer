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
      socket.on('disconnect',      delegate(that.closeSession));
    });
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
    console.log(operation);
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
    console.log(params);
    
    // Clear out all the locks the user currently has on nodes
    for(node in this.locks) {
      if (that.locks[node] == user) {
        delete that.locks[node];
      }
    };
    console.log("Emitting node:selected");
    console.log(that.locks);

    // And set locks on ones the user has just sent us
    //   (assuming no one else has locked it)
    _.each(nodes, function(node) {
      if (!that.locks[node]) {
        that.locks[node] = user;
      }
    });
    this.io.sockets.emit("node:selected", that.locks);
    cb(null, 'selected');
  },

  leaveNodes: function(socket, nodes, cb) {
    console.log("Emitting node:unlocked");
    
    var that = this;
    _.each(nodes, function(node) {
    
      if (that.locks[node] == socket.id) {
        delete that.locks[node];
      }
    });
    this.io.sockets.emit("node:selected", that.locks);
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