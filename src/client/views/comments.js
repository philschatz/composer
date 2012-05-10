sc.views.Comments = Dance.Performer.extend({

  // Events
  // ------

  events: {

  },

  // Handlers
  // --------

  render: function () {
    this.$el.html(_.tpl('comments', this.model));
    return this;
  }
});