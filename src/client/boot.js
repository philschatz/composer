$(function() {

  sc.models.Document.load("example.json", function(err, doc) {
    window.composer = new Substance.Composer({model: doc, el: '#container', user: "michael"});
    composer.start();
  });

});