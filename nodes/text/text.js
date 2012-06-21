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
    this.editor.setValue(this.model.get('content'));
  },

  // Dispatch local update to server
  serializeUpdate: function() {
    return {content: this.editor.getValue()};
  },

  render: function () {
    var that = this;
    sc.views.Node.prototype.render.apply(this, arguments);

    function newParagraph() {
      alert("Enter not supported yet but here it will create a new paragraph");
    }

    setTimeout(function() {
      that.editor = CodeMirror(that.contentEl[0], {
        lineWrapping: true,
        value: that.model.get('content'),
        extraKeys: {
          'Enter': newParagraph
        },
        onChange: function() {
          that.model.set({content: that.editor.getValue()});
          if (!that.silent) that.dispatch();
          that.silent = false;
        }
      });      
    }, 20);
    return this;
  }
});