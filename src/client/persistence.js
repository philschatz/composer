// Document Persistence Interface

var RemoteStorageAdapter = function() {

  this.connect = function(cb) {
    var that = this;

    remoteStorage.getStorageInfo('mql@owncube.com', function(err, storageInfo) {
      var token = remoteStorage.receiveToken();
      if(token) {
        //we can access the 'notes' category on the remoteStorage of user@example.com:
        that.client = remoteStorage.createClient(storageInfo, 'substance-documents', token);
        cb(null, token);
      } else {
        //get an access token for 'notes' by dancing OAuth with the remoteStorage of user@example.com:
        window.location = remoteStorage.createOAuthAddress(storageInfo, ['substance-documents'], window.location.href);
      }
    });
  };

  this.save = function(id, document, cb) {
    this.client.put(id, JSON.stringify(document), function(err) {
      cb(err);
    });
  };

  this.get = function(id, rev, cb) {
    client.get(id, function(err, data) {
      cb(err, data);
    });
  };

  this.delete = function(id, cb) {
    client.delete(id, function(err) {
      cb(err);
    });
  };
};

window.store = new RemoteStorageAdapter();