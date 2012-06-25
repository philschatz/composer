sc.views.Node.define('/type/text', {

  className: 'content-node text',

  focus: function () {
    $(this.textEl).click();
  },

  select: function (event) {
    sc.views.Node.prototype.select.apply(this);
  },

  deselect: function () {
    sc.views.Node.prototype.deselect.apply(this);
  },

  // Deal with incoming update
  update: function() {
    this.silent = true;
    this.contentEl[0].innerHTML = this.model.get('content');
  },

  // Dispatch local update to server
  serializeUpdate: function() {
    return {content: this.editor.content()};
  },

  render: function () {
    var that = this;
    sc.views.Node.prototype.render.apply(this, arguments);

    that.contentEl[0].innerHTML = that.model.get('content');

    var toolbar = $('#tools');
    // Add in the OER tags
    that.editor = new Proper(window.oer.options);
    // Add in buttons for the OER markup
    var controls = _.flatten([ window.oer.controls, that.editor.defaultControls ]);
    
    that.contentEl.on('click', function() {
      that.editor.activate($(this), {
        placeholder: 'Enter Text',
        controlsTarget: toolbar,
        codeFontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
        controls: controls,
      });
      
      // Update node when editor commands are applied
      that.editor.bind('changed', function() {
        that.model.set({content: that.editor.content()});
        if (!that.silent) that.dispatch();
        that.silent = false;
      });
    });
      
    return this;
  }
});