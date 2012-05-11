sc.views.Tools = Dance.Performer.extend({

  // Events
  // ------

  events: {
    
  },

  // Handlers
  // --------

  initialize: function() {

    // Views
    this.views = {};
    this.views.tool = new sc.views.Patches({model: this.model});
  },

  render: function() {
    this.$el.html(_.tpl('tools', this.model));
    this.$('.tool').html(this.views.tool.render().el);
    return this;
  }
});