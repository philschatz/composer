var express = require('express');
var app = express.createServer();
var fs = require('fs');
var url = require('url');
var Data = require('./lib/data');
var _ = require('underscore');
var util = require('./src/server/util.js')

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

// Store a document
// -----------

app.put('/write', function(req, res) {
  var doc = req.body;
  ds.write(doc, function(err, rev) {
    res.send('Document successfully stored. New revision: '+doc.rev);
  });
});

// Serve startpage
// -----------

app.get('/', serveStartpage);

// Start server
// -----------

app.listen(config['server_port'], config['server_host'], function (err) {
  console.log('READY: Substance is listening http://'+config['server_host']+':'+config['server_port']);
});
