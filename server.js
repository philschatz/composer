var express = require('express');
var app = express.createServer();
var fs = require('fs');
var url = require('url');
var Data = require('./lib/data');
var _ = require('underscore');
var util = require('./src/server/util.js');
var Document = require('./src/shared/model/document.js');
var io = require('socket.io').listen(app);

var DocumentStorage = require('./src/server/document_storage.js');
var ds = new DocumentStorage();

// App config
// ===========

global.config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'));
global.example = fs.readFileSync(__dirname+ '/data/example.json', 'utf-8');

// Express.js Configuration
// -----------

app.configure(function() {
  var CookieStore = require('cookie-sessions');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(CookieStore({secret: config.secret}));
  app.use(app.router);
  app.use(express.static(__dirname+"/public", { maxAge: 41 }));
  app.use(express.static(__dirname+"/test", { maxAge: 41 }));
  app.use(express.static(__dirname+"/src/client", { maxAge: 41 }));
  app.use(express.static(__dirname+"/src/shared", { maxAge: 41 }));
  app.use(express.static(__dirname+"/lib", { maxAge: 41 }));
  app.use(express.static(__dirname+"/data", { maxAge: 41 }));
  app.use(express.static(__dirname+"/nodes", { maxAge: 41 }));
  app.use(express.logger({ format: ':method :url' }));
});

app.enable("jsonp callback");

function serveStartpage(req, res) {
  html = fs.readFileSync(__dirname+ '/layouts/app.html', 'utf-8');
  res.send(html.replace('{{{{seed}}}}', JSON.stringify(util.schema()))
               .replace('{{{{scripts}}}}', JSON.stringify(util.scripts()))
               .replace('{{{{example}}}}', example)
               .replace('{{{{templates}}}}', JSON.stringify(util.templates())));
}

// Web server
// ===========


// Style sheets
// -----------

app.get('/styles.css', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/css'});
  util.loadStyles(function(css) {
    res.write(css);
    res.end();
  });
});

// Read document from store
// -----------

app.get('/read/:id', function(req, res) {
  ds.read(req.params.id, function(err, data) {
    res.send(data);
  });
});

// Incrementally update document
// -----------

app.put('/update', function(req, res) {
  var data = req.body;
  ds.read(req.params.id, function(err, data) {
    res.send(data);
  });
});

// Store a document
// -----------

app.post('/write', function(req, res) {
  var doc = req.body;
  ds.write(doc, function(err, rev) {
    res.send('Document successfully stored. New revision: '+doc.rev);
  });
});


// Serve startpage
// -----------

app.get('/', serveStartpage);


// Active sessions
var sessions = {};

// Open documents
var documents = {};

function registerSession(id) {
  sessions[id] = {
    id: id,
    username: id,
    color: "#82AA15"
  };
}

function removeSession(id) {
  delete sessions[id];
}

// Creates a new active document session
function registerDocument(document) {
  console.log('serving document: ')
}

// Remove document session (as soon as all users have left)
function removeDocument() {

}



// Real time server
// ===========

io.sockets.on('connection', function (socket) {
  console.log('new user arrived');
  console.log(socket.id);

  // Request a document
  // -----------

  socket.on('open:document', function (document, rev, cb) {
    console.log('new document requested.', document, rev);

    // Try to fetch that document
    ds.read(document, rev, function(err, document) {
      console.log('meh');
    });

    socket.set('document', document, function () {
      // socket.emit('ready');
      console.log('document set');
      cb(null, {id: "your-doc"});
    });
    // socket.on('set nickname', function (name) {

    // });
    // ds.read(req.params.id, function(err, data) {
    //   res.send(data);
    // });
  });


  // Create a new document
  // -----------

  socket.on('create:document', function (cb) {
    var doc = {
      "id": Data.uuid(),
      "created_at": "2012-04-10T15:17:28.946Z",
      "updated_at": "2012-04-10T15:17:28.946Z",
      "head": "/cover/1",
      "tail": "/section/2",
      "rev": 3,
      "nodes": {
        "/cover/1": {
          "type": ["/type/node", "/type/cover"],
          "title": "A new document",
          "abstract": "The Substance Composer is flexible editing component to be used by applications such as Substance.io for collaborative content composition.",
          "next": "/section/2",
          "prev": null
        },
        "/section/2": {
          "type": ["/type/node", "/type/section"],
          "name": "Plugins",
          "prev": "/cover/1",
          "next": null
        }
      }
    };

    // Create a new doc
    // Confirm document creation
    cb(null, { document: doc, sessions: sessions });
  });


  // New incoming operation
  // Needs to be broadcasted to other clients
  // -----------

  socket.on('operation', function (operation, cb) {
    console.log(operation);
    console.log(socket);
    cb(null, 'confirmed.');
  });

  // A user says good bye
  // -----------

  socket.on('disconnect', function () {
    console.log('user has been disconnected');
    // io.sockets.emit('user disconnected');
  });
});

// Start server
// -----------

app.listen(config['server_port'], config['server_host'], function (err) {
  console.log('READY: Substance is listening http://'+config['server_host']+':'+config['server_port']);
});
