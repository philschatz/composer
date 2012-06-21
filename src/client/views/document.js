sc.views.Document = Dance.Performer.extend({
  id: 'document',

  // Events
  // ------

  events: {

  },

  // Handlers
  // --------

  initialize: function (options) {
    _.bindAll(this, 'insertNode');

    this.model.on('node:insert', this.insertNode, this);
    this.model.on('node:update', this.updateNode, this);
    this.model.on('node:updated', this.updateNode, this);
    this.model.on('node:select', this.updateSelections, this);
    this.model.on('node:move', this.move, this);
    this.model.on('node:moved', this.move, this);

    this.build();

    $(document.body).keydown(this.onKeydown);
  },
  
  build: function() {
    this.nodes = [];
    this.model.each(function(node) {
      this.nodes.push(this.createNodeView(node));
    }, this);
  },

  insertNode: function(node, options) {
    var view = this.createNodeView(node);
    this.nodes.push(view);
    $(view.render().el).appendTo(this.el);
  },

  updateNode: function(options) {
    console.log("SHould limit which nodes are updated");
    _.each(this.nodes, function(node, index) {
      if(node.model._id == options._id) {
        node.update();
      }
    }, this);
  },


  // Incoming move node operation
  move: function(options) {
    var $selection = $(_.map(options.nodes, function(n) { return '#'+_.htmlId(n); }).join(', '));
    $selection.insertAfter($('#'+_.htmlId(options.target)));
  },

  moved: function(options) {
    this.move(options);
  },
  
  updateSelections: function(selections) {
    $('.content-node.selected .handle').css('background', '');
    $('.content-node.selected').removeClass('selected');
    
    _.each(selections, function(user, node) {
      $('#'+_.htmlId(node)).addClass('selected')
        .find('.handle').css('background', this.model.users[user].color);
    }, this);
  },

  expandSelection: function() {
    alert("Expand Selection doesn't currently work");
    return;
    var lastnode = _.last(this.model.users[this._user()].selection);
    if (lastnode) {
      var next = this.model.get(lastnode).get('next');
      if (next) {
        var newSelection = this.model.users[this._user()].selection.concat([next._id]);
        this.model.execute({command:"node:select", params: { nodes: newSelection }});
      }
    }
  },

  narrowSelection: function() {
    alert("Narrow Selection doesn't currently work");
    return;
    var selection = this.model.users[this._user()].selection;
    selection = _.clone(selection).splice(0, selection.length-1);
    this.model.execute({command:"node:select", params: { nodes: selection }});
  },

  moveDown: function() {
    console.log("Move Down doesn't currently work");
    return;
    var selection = this.model.users[this._user()].selection;
    var last = this.model.get(_.last(selection));
    if (last.get('next')) {
      this.model.execute({command:"node:move", params: { user: this._user(), nodes: selection, target: last.get('next')._id, rev: this.model.rev }});
    }
  },

  moveUp: function() {
    console.log("Move Up doesn't currently work");
    return;
    var selection = this.model.users[this._user()].selection;
    var first = this.model.get(_.last(selection));
    if (first.get('prev') && first.get('prev').get('prev')) {
      this.model.execute({command:"node:move", params: { 
        user: this._user(),
        nodes: selection,
        target: first.get('prev').get('prev')._id,
        rev: this.model.rev
      }});
    }
  },

  createNodeView: function(node) {
    return sc.views.Node.create({
      document: this.model,
      model: node
    });
  },

  selectNode: function (view) {
    this.deselectNode();
    $(this.el).addClass('something-selected');
    view.select();
    this.selected = view;
  },

  deselectNode: function () {
    if (this.selected) {
      $(this.el).removeClass('something-selected');
      this.selected.deselect();
      delete this.selected;
    }
  },

  render: function () {
    _.each(this.nodes, function(node, index) {
      $(node.render().el).appendTo(this.el);
    }, this);
    return this;
  },

  // Helpers
  // -------

  edit: function () {
    this.node.transitionTo('write');
  },

  deselect: function () {
    // TODO
  }

});