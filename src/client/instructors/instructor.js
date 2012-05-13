sc.instructors.Instructor = Dance.Instructor.extend({
  initialize: function() {
    // Using this.route, because order matters
    this.route(':document', 'loadDocument', this.loadDocument);
    this.route('new', 'newDocument', this.newDocument);
  },

  newDocument: function() {
    console.log('new doc');
  },

  loadDocument: function(id) {
    composer.read(id);
  }
});