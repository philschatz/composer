var child_process = require('child_process'),
    fs = require('fs'),
    _ = require('underscore'),
    ds = new require('./document_storage.js');


/*
Communication protocol:

server              client
---------------------------
                <--    connect
document:hello  -->
(operations)*   -->
node:selected   -->
user:joined     -->>


                <--  node:select
node:selected   -->>


                <--  node:move
node:moved      -->> { rev++ }


                <-- node:update
node:updated    -->> { rev++ }



user: the socket id

*/

var COLORS = [ '#cc3333', '#3333cc', '#cccc33', '#cc33cc' ];
var lastColor = 0;


// Document Manager
// =============

var DocumentManager = function(server) {
  this.io = require('socket.io').listen(server);
  this.documents = [];
  this.sessions = [];
  this.sentMessages = [ // Re-send them when a new client joins
    {"command": "user:announce", "params": {"user": "michael", "color": "#82AA15"}},
    // {"command": "node:inserted",   "params": {"user": "michael", "type": "text", "rev": 3, "attributes": {"content": "It's literally impossible to build an editor that can be used across different disciplines. Scientists, writers and journalists all have different needs. That's why Substance just provides the core infrastructure, and introduces Content Types that can be developed individually by the community, tailored to their specific needs."}}},
    //{"command": "node:inserted",   "params": {"user": "michael", "type": "map", "rev": 3, "attributes": {"content": "Hey! I'm a map."}}},
    {"command": "node:inserted",   "params": {"user": "michael", "type": "section", "rev": 3, "attributes": {"name": "Structured Composition"}}},
    {"command": "node:inserted",   "params": {"user": "michael", "type": "text", "rev": 4, "attributes": {"content": "Instead of conventional sequential text-editing, documents are composed of Content Nodes in a structured manner. The composer focuses on content, by leaving the layout part to the system, not the user. Because of the absence of formatting utilities, it suggests structured, content-oriented writing."}}},
    {"command": "node:inserted",   "params": {"user": "michael", "type": "section", "rev": 5, "attributes": {"name": "Open Collaboration"}}},
    {"command": "node:inserted",   "params": {"user": "michael", "type": "text", "rev": 6, "attributes": {"content": "The Substance Composer targets open collaboration. Co-authors can edit one document at the same time, while content is synchronized among users in realtime. There's a strong focus on reader collaboration as well. They can easily participate and comment on certain text passages or suggest a patch."}}},
    {"command": "node:inserted",   "params": {"user": "michael", "type": "section", "rev": 7, "attributes": {"name": "Patches"}}},
    {"command": "node:inserted",   "params": {"user": "michael", "type": "text", "rev": 8, "attributes": {"content": "Readers will be able to contribute right away by submitting patches, which can be applied to the document at a later time. Patches are an important concept to realize a peer-review process."}}},
    {"command": "node:inserted",   "params": {"user": "michael", "type": "section", "rev": 9, "attributes": {"name": "Operations"}}},
    {"command": "node:inserted",   "params": {"user": "michael", "type": "text", "rev": 10, "attributes": {"content": "The Substance Composer uses atomic operations to transform documents. This is a fundamental concept that allows collaborative editing of one document (even at the same time). The technique behind it is called Operational Transformation. Based on all recorded operations, the complete document history can be reproduced at any time. In other words. This is the best thing since sliced bread."}}},
    {"command": "user:announce", "params": {"user": "john", "color": "#4da6c7"}},
    {"command": "node:select",   "params": {"user": "john", "nodes": ["/cover/1"], "rev": 11}},
    {"command": "node:select",   "params": {"user": "michael", "nodes": ["/section/2", "/text/3"], "rev": 11}},
    {"command": "node:moved",     "params": {"user": "michael", "nodes": ["/section/2", "/text/3"], "target": "/text/4", "rev": 11}}
  ];
  this.rev = 11; //0;
  this.locks = {};
  this.bindHandlers();
};

_.extend(DocumentManager.prototype, {
  // Bind Socket.io handlers
  bindHandlers: function() {
    var that = this;
    
    this.io.sockets.on('connection', function (socket) {

      var color = COLORS[lastColor++ % COLORS.length];



      // Keep track of messages emitted so new clients can "catch up"
      var emitAll = function(command, params) {
        console.log("Emitting " + command);
        that.sentMessages.push({command: command, params: params});
        that.io.sockets.emit(command, params);
      };


      // Document
      // -------------

      // Create a document, join the fun
      var createDocument = function(socket, cb) {
        console.log("Received document:create");
        var document = Document.create(util.schema());
        registerDocument(document);
        cb(null, { document: doc, sessions: {} });
      };

      // Join a document editing session, update the session
      var joinDocument = function(socket, document, cb) {
        console.log("Received document:join");
        that.documents[document.id] = {
          collaborators: [socket.id],
          model: document
        }
      };

      var updateDocument = function(operation, cb) {
        console.log("Received document:update");
        cb(null, 'confirmed');
      };

      // User closes a particular document
      // TODO: should this be explicitly called, or should it
      // be just overruled by another call of joinDocument
      var leaveDocument = function(cb) {
        // TODO: implement
        console.log("Received document:leave");
      };

      // Node
      // -------------
      var selectNodes = function(params, cb) {
        var nodes = params.nodes;
        var user = socket.id;
        var dirty = false; // Only broadcast if selection changes

        console.log("Received node:select from " + socket.id);
        
        // Clear out all the locks the user currently has on nodes
        for(node in that.locks) {
          if (that.locks[node] == user && (-1 == params.nodes.indexOf(node))) {
            delete that.locks[node];
            dirty = true;
          }
        };

        // And set locks on ones the user has just sent us
        //   (assuming no one else has locked it)
        _.each(nodes, function(node) {
          if (!that.locks[node]) {
            that.locks[node] = user;
            dirty = true;
          }
        });
        
        if (dirty) {
          //Don't use emitAll because we don't need to log node selections
          that.io.sockets.emit("node:selected", that.locks);
        }
        cb(null, 'selected');
      };

      var moveNodes = function(params, cb) {
        var target = params.target;
        var user = socket.id;

        console.log("Received node:move");
        
        // Make sure the user has the node locked or that it is not locked
        if((target in that.locks) && (that.locks[target] != user)) {
          //console.log("Ignoring move");
          //return;
        };

        that.rev++;
        params.rev = that.rev;
        params.user = socket.id;

        emitAll("node:moved", params);
        cb(null, 'selected');
      };

      var updateNode = function(params, cb) {
        var node = params.node;
        var user = socket.id;

        console.log("Received node:update from " + socket.id);
        
        // Make sure the user has the node locked or that it is not locked
        if (!(node in that.locks)) {
          that.locks[node] = user;
        }
        if(that.locks[node] != user) {
          //console.log("Ignoring edit. user doesn't have a lock");
          //return;
        }
        
        that.rev++;
        params.rev = that.rev;
        params.user = user;

        emitAll("node:updated", params);
        cb(null, 'edited');
      };

      // Session
      // -------------

      // A new user joins the party
      var openSession = function(cb) {
        that.sessions[socket.id] = {
          id: socket.id,
          username: socket.id,
          document: null,
          color: "#82AA15"
        };
        console.log('Started a new session ' + socket.id);
      };

      // When a user leaves the party
      var closeSession = function(cb) {
        console.log('removing session ' + socket.id);
        
        // Remove locked nodes
        for (node in that.locks) {
          if (that.locks[node] == socket.id) {
            delete that.locks[node];
          }
        }
        delete that.sessions[socket.id];
        
        that.io.sockets.emit('user:left', {user: socket.id});
      };


      // Do things
      socket.on('document:create', createDocument);
      //socket.on('document:join',   delegate(that.joinDocument));
      //socket.on('document:leave',  delegate(that.leaveDocument));
      //socket.on('document:update', delegate(that.updateDocument));
      socket.on('node:select',     selectNodes);
      socket.on('node:update',     updateNode);
      socket.on('node:move',       moveNodes);
      socket.on('disconnect',      closeSession);
      

      // Hi user
      openSession();

      // Let the client know who the server thinks they are (so they can ignore local messages)
      socket.emit('document:hello', {user: socket.id, color: color});

      // Perform some bootstrap operations
      _.each(that.sentMessages, function(message) {
        socket.emit(message.command, message.params);
      });
      
      // Send an update of users and their locks
      socket.emit('node:selected', that.locks);

      // Notify everyone someone joined our party
      emitAll('user:announce', {user: socket.id, color: color});
      
    });
  },

});

module.exports = DocumentManager;