// RemoteStorageAdapter
// ===========

var RemoteStorageAdapter = function() {

  this.write = function(document, cb) {
    // TODO: implement
  };

  this.open = function(id, rev, cb) {
    // TODO: implement
  };

  this.update = function(id, op, cb) {
    // TODO: implement
  };

  this.delete = function(id, cb) {
    // TODO: implement
  };
};


// AjaxAdapter
// ===========

var AjaxAdapter = function() {

  this.write = function(document, cb) {
    _.request('PUT', '/write', document, function(err) {
      cb(err);
    });
  };

  this.open = function(id, rev, cb) {
    _.request('GET', '/open/' + id, function(err, data) {
      cb(null, data);
    });
  };

  this.delete = function(id, cb) {
    // TODO: implement
  };
};


// SocketIOAdapter
// ===========

var SocketIOAdapter = function() {
  var socket = io.connect('http://localhost');
  var document = null;

  function connected() {
    console.log('connected');
  }

  // Merge in operations from other clients
  // -----------

  function receiveUpdate(op) {
    
  }

  // Update document incrementally using operations
  // -----------

  this.update = function(op, cb) {
    socket.emit('update:document', op, function (err, data) {
      cb(err, data);
    });
  };

  // Create a document
  // -----------

  this.create = function(cb) {
    socket.emit('create:document', function(err, doc) {
      cb(null, doc);
    });
  },  

  // Open a document
  // -----------

  this.open = function(id, rev, cb) {
    document = id;
    socket.emit('open:document', id, rev, function(err, data) {
      console.log('got it', data);
    });
  },

  socket.on('connect', connected);
  socket.on('update', receiveUpdate);
};

window.store = new SocketIOAdapter();