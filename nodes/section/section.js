sc.views.Node.define('/type/section', {

  className: 'content-node section',

  initialize: function (options) {
    sc.views.Node.prototype.initialize.apply(this, arguments);
  },

  focus: function () {
    this.headerEl.click();
  },

  remove: function () {
    this.nodeList.remove();
    $(this.el).remove();
  },

  transitionTo: function (state) {
    sc.views.Node.prototype.transitionTo.call(this, state);
    if (this.state === state) {
      this.nodeList.transitionTo(state);
    }
  },

  // Deal with incoming update
  update: function() {
    this.silent = true;
    this.editor.setValue(this.model.get('name'));
  },

  // Dispatch local update to server
  serializeUpdate: function() {
    return {name: this.editor.getValue()};
  },

  render: function () {
    var that = this;
    sc.views.Node.prototype.render.apply(this, arguments);
//    $(this.contentEl).html(this.model.get('name'));
//    $(this.contentEl).attr('contenteditable', true);

    setTimeout(function() {
      that.editor = CodeMirror(that.contentEl[0], {
        lineWrapping: true,
        value: that.model.get('name'),
        onChange: function() {
          that.model.set({name: that.editor.getValue()});
          if (!that.silent) that.dispatch();
          that.silent = false;
        }
      });      
    }, 20);

    return this;
  }
});