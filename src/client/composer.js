(function(exports) {

  // The Substance Namespace
  var Substance = {};

  var Composer = Dance.Performer.extend({
    el: 'container',
    initialize: function(options) {

      window.store.setDocument(this);

      // Document Model
      this.id = this.model.id;
      this.model = new Composer.models.Document(this.model);

      // Possible modes: edit, view, patch, apply-patch
      this.mode = "edit";

      // Views
      this.views = {};
      this.views.document = new Substance.Composer.views.Document({model: this.model});
      this.views.operations = new Substance.Composer.views.Operations({model: this.model});
      
      this.model.on('operation:executed', this.renderOperations, this);
      this.model.on('operation:executed', this.sendUpdate, this);

      // Initialize Instructor
      this.instructor = new Substance.Composer.instructors.Instructor({});

      // Selection shortcuts
      key('shift+down', _.bind(function() { this.views.document.expandSelection(); return false; }, this));
      key('shift+up', _.bind(function() { this.views.document.narrowSelection(); return false; }, this));
      key('esc', _.bind(function() { console.log('clear selection'); return false; }, this));

      // Move shortcuts
      key('down', _.bind(function() { this.views.document.moveDown(); return false; }, this));
      key('up', _.bind(function() { this.views.document.moveUp(); return false; }, this));

      // Node insertion shortcuts
      key('alt+t', _.bind(function() { console.log('insert text node'); }, this));
    },

    // Dispatch Operation
    execute: function(op) {
      if(op.params.user == this.user) {
        //Ignore remote responses to local messages
        console.log("ignoring local event");
      } else {
        console.log("Event received: " + op.command, op.params);
        this.model.execute(op);
      }
    },

    start: function() {
      Dance.history.start();
      this.render();
    },

    render: function() {
      this.$el.html(_.tpl('composer'));
      this.$('#document').replaceWith(this.views.document.render().el);
    },

    renderOperations: function(data) {
      this.$('#sidebar').html(this.views.operations.render().el);
      console.log("Event " + data.command);
      console.log(data);
    },
    
    sendUpdate: function(data) {
      window.store.trigger(data.command, data.params);
    },
    
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