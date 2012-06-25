$(function() {


  var doc = {
    id: "substance-composer",
    created_at: "2012-04-10T15:17:28.946Z",
    updated_at: "2012-04-10T15:17:28.946Z",
    nodes: {},  //populated later
    head: null, //populated later
    tail: null, //populated later
    rev: 3
  };
  
  var nextId = 0;
  
  // Note: lastLevel is used for computing heading levels (non-zero inside sections)
  function htmlParser($els, lastLevel) {
    var nodeIds = [];
    var prevNode = null;
    var prevId = null;
    var lastLevel = 1; // H1 by default
    _.each($els, function(el) {
      var $el = $(el);
      var tag = $el.get(0).tagName.toLowerCase();
      var id = $el.attr('id') || "autoid-" + tag + "-" + nextId++;
      $el.attr({id: id}); // Set the id if it didn't exist before
      var node = { type: [ '/type/node' ] };
      if(tag == 'p') {
        node.type.push('/type/text');
        node.content = el.innerHTML;
        el.innerHTML = '';
      } else if (tag == 'h1' || tag == 'h2' || tag == 'h3' || tag == 'h4' || tag == 'h5' || tag == 'h6') {
        node.type.push('/type/section');
        node.name = $el[0].innerHTML;
        var level = tag[1] == '1' ? 1 : tag[1] == '2' ? 2 : tag[1] == '3' ? 3 : 4;
        node.offset = level - lastLevel;
        lastLevel = level;
        
      } else if(tag == 'div' && $el.hasClass('section')) {
        node.type.push('/type/section');
        $title = $el.find("> .title");
        node.name = $title ? $title.get(0).innerHTML : '[Insert Title]';
        
        // Remove the titles from the DOM
        $title.remove();
        
        node.children = htmlParser($el.find("> *:not(.title)"), lastLevel + 1);
        
      } else {
        console.log("skipping element with tag '" + tag + "'");
        return;
      }
      node.prev = prevId;
      node.next = null;
      
      nodeIds.push(id);
      
      // Link up the previous node's next to this node
      if (prevNode) prevNode.next = id;
      
      doc.nodes[id] = node;
      if (!(doc.head)) doc.head = id;
      doc.tail = id;
      
      // Get ready for the next node
      prevId = id;
      prevNode = node;
    });
    
    return nodeIds;
  }


  htmlParser($('#container > *'));
  console.log("Parsed HTML into ", doc);
  
  //sc.models.Document.load("example.json", function(err, doc) {
    window.composer = new Substance.Composer({model: doc, el: '#container', user: "michael"});
    composer.start();
  //});

});