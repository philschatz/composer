(function(exports) {

  // The Substance Namespace
  var Substance = {};

  var Composer = Dance.Performer.extend({
    el: 'container',

    events: {
      'click .save-document': function() {
        store.write(this.model.toJSON(), function() {
          console.log('saved.');
        });
        return false;
      }
    },

    initialize: function(options) {
      // this.user = options.user || this.newUser();

      // Selection shortcuts
      key('shift+down', _.bind(function() { this.views.document.expandSelection(); return false; }, this));
      key('shift+up', _.bind(function() { this.views.document.narrowSelection(); return false; }, this));
      key('esc', _.bind(function() { console.log('clear selection'); return false; }, this));

      // Move shortcuts
      key('down', _.bind(function() { this.views.document.moveDown(); return false; }, this));
      key('up', _.bind(function() { this.views.document.moveUp(); return false; }, this));

      // Node insertion shortcuts
      key('alt+t', _.bind(function() { console.log('insert text node'); }, this));

      // Initialize Instructor
      this.instructor = new Substance.Composer.instructors.Instructor({});
    },
    
    // Build a document
    build: function(doc) {
      // Document Model
      this.model = new Composer.models.Document(doc.document);

      // All active sessions (=users on that document)
      this.sessions = doc.sessions;

      // Possible modes: edit, view, patch, apply-patch
      this.mode = "edit";

      // Views
      this.views = {};
      this.views.document = new Substance.Composer.views.Document({ model: this.model });
      this.views.tools = new Substance.Composer.views.Tools({model: this.model});
      
      this.model.on('operation:executed', function() {}, this);
      this.renderDoc();
    },

    // Dispatch Operation
    execute: function(op) {
      this.model.execute(op);
    },

    start: function() {
      Dance.history.start();
      this.render();
    },

    read: function(id, rev) {
      store.open(id, rev, function(err, doc) {
        console.log('loaded:', doc);
      });
    },

    newDocument: function() {
      var that = this;
      store.create(function(err, doc) {
        // console.log('yay', doc);
        that.build(doc);
      });
    },

    // Store document on the server
    save: function() {

    },

    render: function() {
      this.$el.html(_.tpl('composer'));
    },

    renderDoc: function() {
      this.$('#document').replaceWith(this.views.document.render().el);
      this.$('#tools').html(this.views.tools.render().el);
    }
  },
  // Class Variables
  {
    models: {},
    views: {},
    instructors: {},
    utils: {}
  });

  // Exports
  Substance.Composer = Composer;
  exports.Substance = Substance;
  exports.s = Substance;
  exports.sc = Substance.Composer;

})(window);