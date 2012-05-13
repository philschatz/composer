// Document Persistence Interface

var DocumentStorageAdapter = function() {

  this.write = function(document, cb) {
    _.request('PUT', '/write', document, function(err) {
      cb(err);
    });
  };

  this.read = function(id, rev, cb) {
    _.request('GET', '/read/' + id, function(err, data) {
      cb(null, data);
    });

  };

  this.delete = function(id, cb) {
    // TODO: implement
  };
};


// Load a document
loadFixture = function(url, cb) {
  $.getJSON(url, function(data) {
    cb(null, data);
  });
};

window.store = new DocumentStorageAdapter();