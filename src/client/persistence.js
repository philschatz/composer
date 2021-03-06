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
  var socket = null;
  var doc = null;

  this.setDocument = function(document) {
    doc = document;
    socket = io.connect();

    socket.on('connect', connected);
    socket.on('update', receiveUpdate);

    socket.on('document:hello', receiveHello);
    
    var commands = ['user:announce', 'user:left', 'node:selected', 'node:inserted', 'node:moved', 'node:updated'];
    _.each(commands, function(cmd) {
      socket.on(cmd, function(params) { doc.execute({command:cmd, params:params}); });
    });
    
    socket.on('disconnect', disconnected);
  };

  function receiveHello(params) {
    console.log("Event received HELLO!", params);
    doc.user = params.user;
    // TODO: Record this user's color
    //doc.model.users[params.user] = params;
  }

  function connected() {
    console.log('socket: connected');
  }

  function disconnected() {
    console.log('socket: disconnected');
  }

  // Merge in operations from other clients
  // -----------

  function receiveUpdate(op) {
    console.log("socket: Received Update!");
    console.log(op);
  }

  // Update document incrementally using operations
  // -----------

  this.update = function(op, cb) {
    console.log("socket: Sending Document Update");
    socket.emit('document:update', op, function (err, data) {
      cb(err, data);
    });
  };

  this.trigger = function(name, op, cb) {
    console.log("socket: Sending Event", name, op);
    socket.emit(name, op, function (err, data) {
      if(cb) { cb(err, data); }
    });
  };
  
  // Create a document
  // -----------

  this.create = function(cb) {
    socket.emit('document:create', function(err, doc) {
      cb(null, doc);
    });
  };  

  // Open a document
  // -----------

  this.open = function(id, rev, cb) {
    var document = id;
    socket.emit('document:open', id, rev, function(err, data) {
      console.log('got it', data);
    });
  };

};

window.store = new SocketIOAdapter();