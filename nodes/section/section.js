sc.views.Node.define('/type/section', {


  // offset is how the section (heading) differs compared to the previous heading sibling
  // You can either:
  // - Be at the same level  (0)
  // - Go down 1 level       (1)
  // - Or go up 1...n levels (-x)


  className: 'content-node section',
  //contentTagName: 'h1',

  initialize: function (options) {
    sc.views.Node.prototype.initialize.apply(this, arguments);
    
    //this.level = this._calculateLevel(options);
    //this.contentTagName = 'h' + (this.level + 1);

    // childViews elements taken from substance node_list.js
    var childViews = this.childViews = [];
    _.each(this.model.get('children'), _.bind(function (child) {
      childViews.push(this.createChildView(child));
    }, this));

  },

  _calculateLevel: function() {
    // Calculate the heading level based on previous heading's levels
    var level = 0;
    var n = this.model;
    
    // Move up to the start then work back down to the current node
    while (n.get('prev')) {
      n = n.get('prev');
    }
    while (n.get('next') && n != this.model) {
      if (n.get('offset')) {
        level = level + n.get('offset');
        if (level < 0) level = 0;
      }
      n = n.get('next');
    }
    
    level = level + this.model.get('offset');
    if (level < 0) level = 0;
    return level;
  },

  createChildView: function (child) {
    return sc.views.Node.create({
      parent: this.model,
      model: child,
      offset: this.model.offset + 1,
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
    
    // TODO Change the heading level
    this._setContentEl();
  },


  _setContentEl: function() {
    var that = this;
    // Decide if we need to create a new element
    var level = this._calculateLevel();
    this.contentTagName = 'h' + (level+1);
    var needNew = this.contentEl ? (this.contentTagName != this.contentEl[0].tagName.toLowerCase()) : true;
    if (needNew) {
      var contentEl = $('<'+ this.contentTagName + ' class="' + this.contentClasses + '"/>').addClass('content').appendTo(this.el);
      if (this.contentEl) {
        this.contentEl.replaceWith(contentEl);
        //contentEl[0].innerHTML = this.contentEl[0].innerHTML;
      }
      this.contentEl = contentEl;
      this.contentEl[0].innerHTML = this.model.get('name');
      this._bindEditor(true);

      var handleEl = $('<div class="handle"></div>').appendTo(this.el);
      if (this.handleEl) {
        this.handleEl.replaceWith(handleEl);
      }
      this.handleEl = handleEl;
  
      this.contentEl.add(this.handleEl).on('click', function() { that.select(); });
  
      // Handle Drag and Drop
      var scope = 'content-node-only';
      this.$el.draggable({
        handle: this.handleEl,
        scope: scope,
        revert: "invalid",
        cursor: "move",
        start: function() {
          // Make sure the current user locks the node
          that.select();
        },
      });


    }

  },


  // Dispatch local update to server
  serializeUpdate: function() {
    return {name: this.editor.content()};
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

  _bindEditor: function(startItUp) {

    var that = this;
    
    var toolbar = $('#tools');
    // Add in the OER tags

    //redefine what indent/outdent do
    var commands = {
      indent: {
        // isActive means "can't be pressed" hence the negation
        isActive: function() {
          return !((that.model.get('offset') || 0) < 1);
        },
        exec: function() {
          var offset = that.model.get('offset') || 0;
          that.model.set({offset: offset + 1});
          that.update();
          that.dispatch();
        }
      },
      
      outdent: {
        // isActive means "can't be pressed" hence the negation
        isActive: function() {
          return !(true);
        },
        exec: function() {
          var offset = that.model.get('offset') || 0;
          that.model.set({offset: offset - 1});
          that.update();
          that.dispatch();
        }
      },
    
    };

    that.editor = new Proper({commands: commands});

    var controls = [ that.editor.defaultControls[6], that.editor.defaultControls[7] ]; // [6] and [7] are indent/outdent

    function startEditor() {
      that.editor.activate(that.contentEl, {
        placeholder: 'Enter Text',
        controlsTarget: toolbar,
        //markup: false,
        multiline: false,
        codeFontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
        controls: controls,
      });
      
      // Update node when editor commands are applied
      that.editor.bind('changed', function() {
        that.model.set({name: that.editor.content()});
        if (!that.silent) that.dispatch();
        that.silent = false;
      });
    }

    if(startItUp) {
      startEditor();
    } else {
      that.contentEl.on('click', function() {
        startEditor();
      });
    }
  },

  render: function () {
    var that = this;
    sc.views.Node.prototype.render.apply(this, arguments);
//    $(this.contentEl).html(this.model.get('name'));
//    $(this.contentEl).attr('contenteditable', true);

    this.contentEl[0].innerHTML = this.model.get('name');

    this.eachChildView(_.bind(function (childView) {
      this.renderChildView(childView).appendTo(this.el);
    }, this));


    this._bindEditor(false);
    return this;
  }
});