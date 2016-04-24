
require('marko/compiler').defaultOptions.preserveWhitespace = true;
var express = require('express');
var serveStatic = require('serve-static');
var http    = require( 'http' );
var path = require('path');
var session = require('express-session');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var engine  = require( 'ejs-locals' );
var compression = require('compression');
var bodyParser = require('body-parser')
var app = express();
var port = process.env.PORT || 8080;

var routes = require('./routes/index');
var app = express();
app.set( 'port', process.env.PORT || 8080 );
app.engine( 'ejs', engine );

// view engine setup
app.set( 'views', path.join( __dirname, 'views' ));
app.set( 'view engine', 'ejs' );

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/static/favicon.ico'));
//app.use(logger('dev'));
app.use(cookieParser()); //cookieparser must be before
app.use(session({ resave: false,
                  saveUninitialized: false,
                  secret: '12341234qwert' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ keepExtensions: true,extended: false }));
app.use('/static', function(req, res, next) {
    setTimeout(next, 200);
});

app.use('/static', serveStatic(__dirname + '/static', {
    lastModified: false,
    maxAge: 86400000
}));

app.get('/alchemyAPI', require('./pages/api'));
app.get('/home/index', routes);
app.get('/home/handle', routes);
app.post('/home/twitterSignIn', routes);
app.get('/home/callbackurl', routes);
app.post('/home/api', routes);

//Uncomment below blocked-comment in local
app.listen(port, function() {
    console.log('Server started! Try it out:\nhttp://127.0.0.1:' + port + '/home/index');

    if (process.send) {
        process.send('online');
    }
});

//comment below line in local
//app.listen(process.env.PORT);

