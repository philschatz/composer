sc.views.Node.define('/type/section', {

  className: 'content-node section',

  initialize: function (options) {
    sc.views.Node.prototype.initialize.apply(this, arguments);

    // childViews elements taken from substance node_list.js
    var childViews = this.childViews = [];
    _.each(this.model.get('children'), _.bind(function (child) {
      childViews.push(this.createChildView(child));
    }, this));

  },

  createChildView: function (child) {
    return sc.views.Node.create({
      parent: this.model,
      model: child,
      level: this.level + 1,
      root: this.root,
      document: this.document
    });
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

  renderChildView: function (childView) {
    var rendered = $(childView.render().el);
    
    childView.model.bind('removed', _.bind(function () {
      controls.remove();
      childView.remove();
      // Remove childView from the childViews array
      this.childViews = _.select(this.childViews, function (cv) {
        return cv !== childView;
      });
    }, this));
    return rendered;
  },

  eachChildView: function (fn) {
    _.each(this.childViews, fn);
  },

  render: function () {
    var that = this;
    sc.views.Node.prototype.render.apply(this, arguments);
//    $(this.contentEl).html(this.model.get('name'));
//    $(this.contentEl).attr('contenteditable', true);


    this.eachChildView(_.bind(function (childView) {
      this.renderChildView(childView).appendTo(this.el);
    }, this));


    function newParagraph() {
      alert("Enter not supported yet but here it will create a new paragraph");
    }


    setTimeout(function() {
      that.editor = CodeMirror(that.contentEl[0], {
        lineWrapping: true,
        value: that.model.get('name'),
        keyMap: {
          'Enter': newParagraph
        },
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