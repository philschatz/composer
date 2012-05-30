var express  = require('express'),
    app      = express.createServer(),
    fs       = require('fs'),
    url      = require('url'),
    Data     = require('./lib/data'),
    _        = require('underscore'),
    util     = require('./src/server/util.js'),
    Document = require('./src/shared/model/document.js'),
    ds       = new (require('./src/server/document_storage.js'))(),
    dm       = new (require('./src/server/document_manager.js'))(app);


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


// Start server
// -----------

app.listen(config['server_port'], config['server_host'], function (err) {
  console.log('Substance Library is listening at http://'+config['server_host']+':'+config['server_port']);
});
