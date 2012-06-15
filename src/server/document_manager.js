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
          fn.apply(that, [socket].concat(arguments));
        };
      }

      // Hi user
      that.openSession(socket)

      // Do things
      socket.on('document:create', delegate(that.createDocument));
      socket.on('document:join',   delegate(that.joinDocument));
      socket.on('document:leave',  delegate(that.leaveDocument));
      socket.on('document:update', delegate(that.updateDocument));
      socket.on('disconnect',      delegate(that.closeSession));
    });
  },

  // Document
  // -------------

  // Create a document, join the fun
  createDocument: function(socket, cb) {
    var document = Document.create(util.schema());
    registerDocument(document);
    cb(null, { document: doc, sessions: {} });
  },

  // Join a document editing session, update the session
  joinDocument: function(socket, document, cb) {
    this.documents[document.id] = {
      collaborators: [socket.id],
      model: document
    }
  },

  updateDocument: function(socket, operation, cb) {
    cb(null, 'confirmed');
  },

  // User closes a particular document
  // TODO: should this be explicitly called, or should it
  // be just overruled by another call of joinDocument
  leaveDocument: function(socket, cb) {
    // TODO: implement
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
    delete this.sessions[socket.id];
  }

});

module.exports = DocumentManager;