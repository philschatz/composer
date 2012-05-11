sc.instructors.Instructor = Dance.Instructor.extend({
  initialize: function() {
    // Using this.route, because order matters
    this.route(':document', 'loadDocument', this.loadDocument);
  },

  loadDocument: function(id) {
    composer.read(id);
  }
});