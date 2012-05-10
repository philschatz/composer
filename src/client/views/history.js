sc.views.History = Dance.Performer.extend({

  // Events
  // ------

  events: {

  },

  // Handlers
  // --------

  render: function () {
    this.$el.html(_.tpl('history', this.model));
    return this;
  }
});