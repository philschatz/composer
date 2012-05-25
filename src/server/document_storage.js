var child_process = require('child_process'),
    fs = require('fs'),
    db = require('riak-js').getClient(),
    _ = require('underscore');
    

var DocumentStorage = function() {

};

_.extend(DocumentStorage.prototype, {
  write: function(document, cb) {
    db.save('documents', document.id, document, function(err) {
      cb(err);
    });
  },

  read: function(id, rev, cb) {
    db.get('documents', id, function(err, doc) {
      cb(err, doc);
    });
  }
});

module.exports = DocumentStorage;