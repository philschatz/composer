var Document = function(document) {
  var that = this;

  // Initialize document
  this.nodes = new Data.Graph(seed);
  this.nodes.merge(document.nodes);

  this.head = this.nodes.get(document.head);
  this.tail = this.nodes.get(document.tail);

  this.rev = document.rev;

  this.selections = {};
  this.users = {};

  // Operations History
  this.operations = [];

  function checkRev(rev) {
    return that.rev === rev;
  }

  // Node API
  // --------

  this.node = {

    // Process update command
    update: function(options) {
      var node = {};
      that.trigger('node:update', node);
    },

    // Update selection
    select: function(options) {
      // this.selected(options);
      // Rely on the socket working
      // TODO: allow disconnected use
      window.store.trigger('node:select', options);
    },
    
    // Remote selection
    selected: function(options) {
      // Remove all selections that the server doesn't know about
      that.selections = {};
      // Remove all selections attributed to users (so we can re-add them)
      for (user in that.users) {
        that.users[user].selection = [];
      }

      // Add/Edit selections
      for (var node in options) {
        var user = options[node];
        that.selections[node] = user;
        
        //Hack... should not happen
        if (!(user in that.users)) {
          that.users[user] = {};
        }
        if (!('selection' in that.users[user])) {
          that.users[user].selection = [];
        }
        that.users[user].selection.push(node);
      
      }
      
      that.trigger('node:select', that.selections);
    },
    

    // Insert a new node
    insert: function(options) {
      if (checkRev(options.rev)) {
        
        var node = that.nodes.set(_.extend({
          "type": ["/type/node", "/type/"+options.type],
          _id: ["", options.type, options.rev].join('/'),
          prev: that.tail._id
        }, options.attributes));
        that.tail.set({next: node._id});
        that.tail = node;
        if (node) {
          that.rev += 1;
          that.trigger('node:insert', node);
          return node;
        }
      }
      return null;
    },

    // Move selected nodes
    move: function(options) {
      // console.log(that.rev);
      if (checkRev(options.rev)) {
        var f = that.get(_.first(options.nodes)), // first node of selection
            l = that.get(_.first(options.nodes)), // last node of selection
            t = that.get(options.target), // target node
            fp = f.get('prev'),
            ln = l.get('next'),
            tn = t.get('next');

        // console.log('before');
        // console.log('f', f.toJSON(), 'l', l.toJSON(), 't', t.toJSON(), 'fp', fp.toJSON(), 'ln', ln.toJSON(), 'tn', tn.toJSON());

        t.set({next: f._id, prev: t.get('prev') === l ? fp._id : t.get('prev')._id});
        fp.set({next: ln._id});
        
        if (ln) ln.set({prev: fp._id});
        l.set({next: tn ? tn._id : null});
        if (tn) tn.set({prev: l._id});
        that.trigger('node:move', options);
        that.rev += 1;

        // console.log('after');
        // console.log('f', f.toJSON(), 'l', l.toJSON(), 't', t.toJSON(), 'fp', fp.toJSON(), 'ln', ln.toJSON(), 'tn', tn.toJSON());
      }
    },

    // Delete node by id
    delete: function(node) {

    }
  };


  // Patch API
  // --------

  this.patch = {

  };

  // Comment API
  // --------

  this.comment = {

  };

  // User API
  // --------

  this.user = {
    // TODO: dynamic color assignment for users
    announce: function(options) {
      that.users[options.user] = { username: options.user, color: options.color || "red"};
    }
  };


  // Document API
  // --------

  // Iterate over all nodes
  this.each = function(fn, ctx) {
    var current = this.head;
    var index = 0;

    fn.call(ctx || this, current, current._id, index);
    while (current = current.get('next')) {
      index += 1;
      fn.call(ctx || this, current, current._id, index);
    }
  };

  this.logOperation = function(op) {
    this.operations.push(op);
    this.trigger('operation:executed', op);
  };

  this.execute = function(op) {
    var command = op.command.split(':');
    this[command[0]][command[1]](op.params);
    this.logOperation(op);
  };

  // Get a specific node
  this.get = function(id) {
    return this.nodes.get(id);
  };

  // Serialize document state to JSON
  this.toJSON = function() {

  };
};


// Export for browser
if (typeof exports !== 'undefined') {
  module.exports = Document;
} else {
  sc.models.Document = Document;  

// Load a document
sc.models.Document.load = function(url, cb) {
  $.getJSON(url, function(data) {
    cb(null, data);
  });
};

_.extend(sc.models.Document.prototype, _.Events);

}


