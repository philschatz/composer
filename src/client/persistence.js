// Document Persistence Interface

var DocumentStorageAdapter = function() {

  this.save = function(id, document, cb) {
    // this.client.put(id, JSON.stringify(document), function(err) {
    //   cb(err);
    // });
  };

  this.get = function(id, rev, cb) {
    // client.get(id, function(err, data) {
    //   cb(err, data);
    // });
  };

  this.delete = function(id, cb) {
    // client.delete(id, function(err) {
    //   cb(err);
    // });
  };
};

window.store = new DocumentStorageAdapter();