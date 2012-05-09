Hi! We are the team of [Substance](http://substance.io), and we're passionate about making web-based content composition easy. We believe that [Content is Data](http://www.slideshare.net/_mql/substanceio-content-is-data) and should be separated from presentation. Authors want to create meaningful content in the first place, they don't want to spend time with aligning text, choosing fonts and resizing images. 

Also we've made a claim:

> Building an editor for everyone is impossible

And we've proposed a solution:

> Provide an easy way for communities to build their own editor


The Substance Composer
=========

The Substance Composer is a foundation for building your own editor tailored for you particular usecase. You can extend basic content types such as Text, Sections and Images with custom types such as Maps, Formulas, or pre-structured types such as an Event content type that allows you entering name, date, organizer etc. You can add whatever you can imagine, the sky is the limit. But here comes the bummer: You need to do it yourself. Our mission is to make it very easy for you, by creating an infrastructure for basic operations such as inserting, moving and deleting nodes, and a generic UI for dealing with patches and comments.

![Composer](http://f.cl.ly/items/2j0g3c0S0E290p3d3E2E/Screen%20Shot%202012-05-08%20at%2010.48.09%20PM.png)

Collaboration
=========

Since collaboration is more imporantant than ever before to create high quality content we've added the concept of patches to turn every readers into a potential collaborator.

![Patches](http://f.cl.ly/items/1q2w2W0F0Q06043Y3346/Screen%20Shot%202012-05-08%20at%2011.08.23%20PM.png)

The Substance Composer uses operations to transform documents. By keeping track of atomic document operations, the complete history can be replayed and allows users to go back and forth in time. You can either use the web-based editor for manipulating documents, or do it programmatically using the API.

Why should we consider content as data?
=========

![Content is data](http://f.cl.ly/items/2o2f2c3x0C0L392H2w0c/Screen%20Shot%202012-05-08%20at%2010.55.10%20PM.png)

Extensions
=========

You can implement your own content types. We'll provide a tutorial once the editor stable enough.

![Composer](http://f.cl.ly/items/0w1D1u203D120j1R2938/Screen%20Shot%202012-05-08%20at%2010.52.02%20PM.png)


API
=====================

Document Manipulation
---------------------

Documents are manipulated using commands. Commands are represented as JSON.


User API
---------------------

### user:announce

Announce a new author collaborating on the document.

```js
{"command": "user:announce", "params": {"user": "michael", "color": "#82AA15"}}
```

Node API
---------------------

Commands for inserting, updating, moving and deleting content nodes.

### node:insert

Insert a new node.

```js
{
  "command": "node:insert", 
  "params": {
    "user": "michael",
    "type": "text",
    "rev": 3,
    "attributes": {"content": "Text goes here."}
  }
}
```

### node:move

Move node(s). They are inserted after a specified target node.

```js
{
  "command": "node:insert", 
  "params": {
    "user": "michael",
    "nodes": ["/section/2", "/text/3"],
    "target": "/text/5"
    "rev": 12
  }
}
```

### node:select

Make a new node selection.

```js
{
  "command": "node:select",
  "params": {
    "user": "michael",
    "nodes": ["/section/2", "/text/3"],
    "rev": 12
  }
}
```

### node:update

To be implemented.

### node:delete

To be implemented.


Patch API
---------------------

To be implemented.

Comment API
---------------------

To be implemented.

