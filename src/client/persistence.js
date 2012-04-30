// Document persistence

var DocumentStorage = function() {

  this.save = function() {
    remoteStorage.getStorageInfo('mql@owncube.com', function(err, storageInfo) {
      var token = remoteStorage.receiveToken();
      if(token) {
        console.log('yeah got token');
        //we can access the 'notes' category on the remoteStorage of user@example.com:
        // var client = remoteStorage.createClient(storageInfo, 'notes', token);
        // client.put('key', 'value', function(err) {
        //   client.get('key', function(err, data) {
        //     client.delete('key', function(err) {
        //     });
        //   });
        // });
      } else {
        //get an access token for 'notes' by dancing OAuth with the remoteStorage of user@example.com:
        window.location = remoteStorage.createOAuthAddress(storageInfo, ['notes'], window.location.href);
      }
    });
  }

};
window.store = new DocumentStorage();