sc.views.Node = Dance.Performer.extend(_.extend({}, s.StateMachine, {

  className: 'content-node',
  contentTagName: 'div', // div by default but sections override it for the h# title

  attributes: {
    draggable: 'false'
  },

  initialize: function (options) {
    this.state  = 'read';
    this.document = options.document;
    var $existingEl = $('#' + _.htmlId(this.model));
    if ($existingEl.length) {
      this.setElement($existingEl, true);
      // Add all the attributes and classes
      this.$el.addClass(this.className);
      this.$el.attr(this.attributes);
    } else {
      $(this.el).attr({ id: _.htmlId(this.model) });
    }
  },

  transitionTo: function (state) {
    StateMachine.transitionTo.call(this, state);
    if (this.state === state) {
      this.afterControls.transitionTo(state);
    }
  },

  // Dispatching a change
  dispatch: function() {
    this.document.execute({command:"node:update", params: { node: this.model._id, properties: this.serializeUpdate() }});
  },

  // Events
  // ------

  events: {
    'click .toggle-move-node': 'toggleMoveNode',
    'click': 'select'
  },

  toggleMoveNode: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (this.state === 'move') {
      this.root.transitionTo('write');
    } else {
      // There could be another node that is currently in move state.
      // Transition to read state to make sure that no node is in move state.
      this.root.transitionTo('read');
      this.transitionTo('move');
      
      this.root.movedNode = this.model;
      this.root.movedParent = this.parent;
      this.root.transitionTo('moveTarget');
    }
  },

  // TODO: move to document level ?
  select: function (e) {
    this.document.execute({command:"node:select", params: { nodes: [this.model._id] }});
    event.stopPropagation();
  },
  
  focus: function () {},

  render: function () {
    var that = this;
    this.contentEl = $('<'+ this.contentTagName + '/>').addClass('content').appendTo(this.el);
    this.handleEl = $('<div class="handle"></div>').appendTo(this.el);

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
    
    this.$el.droppable({
      scope: scope,
      hoverClass: "drop-before",
      drop: function(event, ui) {
        // Get back the node id from the html id (replace "_" with "/")
        var src = _.htmlId(ui.draggable.attr('id')).replace(/_/g, '/');
        that.document.execute({command:"node:move", params: { nodes: [src], target: that.model._id}});
        ui.draggable.insertAfter($(this));
        ui.draggable.attr('style', '');
      }
    });
    
    return this;
  }

}), {


  // States
  // ------

  states: {
    read: {
      enter: function () {},
      leave: function () {}
    },
    
    write: {
      enter: function () {},
      leave: function () {}
    },

    move: {
      enter: function () {
        $(this.el).addClass('being-moved'); // TODO
      },
      leave: function (nextState) {
        if (nextState === 'moveTarget') { return false; }
        $(this.el).removeClass('being-moved'); // TODO
      }
    },

    moveTarget: {
      enter: function () {},
      leave: function () {}
    }
  },


  // Inheritance & Instantiation
  // ---------------------------

  subclasses: {},

  define: function (types, protoProps, classProps) {
    classProps = classProps || {};
    var subclass = this.extend(protoProps, classProps);
    
    function toArray (a) { return _.isArray(a) ? a : [a] }
    _.each(toArray(types), function (type) {
      this.subclasses[type] = subclass;
    }, this);
    
    return subclass;
  },

  create: function (options) {
    var model = options.model
    ,   type = model.type()._id
    ,   Subclass = this.subclasses[type];
    
    if (!Subclass) { throw new Error("Node has no subclass for type '"+type+"'"); }
    return new Subclass(options);
  }

});