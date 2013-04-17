var formidable = require('formidable'),
    express = require('express'),
    routes = require('./routes'),
    api = require('./routes/api'),
    http = require('http'),
    passport = require('passport'),
    flash = require('connect-flash'),
    util = require('util'),
    LocalStrategy = require('passport-local').Strategy,
    server = http.createServer(app),
    crypto 		= require('crypto'),
    db = require('mongojs').connect('mongodb://nickeblewis:Winchester72@alex.mongohq.com:10079/farnboroughguide',['users']),
    io = require('socket.io').listen(server);

var objectId = function (_id) {
    if (_id.length === 24 && parseInt(db.ObjectId(_id).getTimestamp().toISOString().slice(0,4), 10) >= 2010) {
        return db.ObjectId(_id);
    }
    return _id;
}

var fn = function (req, res) {
    res.contentType('application/json');
    var fn = function (err, doc) {
        if (err) {
            if (err.message) {
                doc = {error : err.message}
            } else {
                doc = {error : JSON.stringify(err)}
            }
        }
        if (typeof doc === 'number' || req.params.cmd === 'distinct') { doc = {ok : doc}; }
        res.send(doc);
    };
    return fn;
};

function findById(id, fn) {
    db.users.findOne({_id:objectId(id)}, function(e, o) {
        if (o) {
            return fn(null, o);
        } else {
            return fn(null, null);
        }
    });
    return(null,null);
}

function findByUsername(username, fn) {
    db.users.findOne({username:username}, function(e, o) {
        if (o) {
           return fn(null, o);
        } else {
            return fn(null, null);
        }
    });
    return(null,null);
}

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            findByUsername(username, function(err, user) {
                if (err) { return done(err); }
                if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
                if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
                return done(null, user);
            })
        });
    }
));

var app = module.exports = express();

app.configure(function () {
    // app.set('views', __dirname + '/views');
    // app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'secret mouse' }));
    app.use(flash());
    app.use(express.logger('tiny'));  //tiny, short, default
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.static(__dirname + '/app'));
    app.use(app.router);
    app.use(express.errorHandler({dumpExceptions: true, showStack: true, showMessage: true}));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

app.get('/api/:collection', api.query);
app.get('/api/:collection/:id', api.read);
app.post('/api/:collection', api.save);
app.del('/api/:collection/:id', api.delete);
app.put('/api/:collection/group', api.group);
app.put('/api/:collection/mapReduce', api.mapreduce);
app.put('/api/:collection/:cmd', api.command);

// routes
app.get('/', routes.index);
//app.get('/map', routes.index);
//app.get('/details', routes.index);
//app.get('/add', routes.index);
//app.get('/edit', routes.index);
//app.get('/login', routes.index);
//app.get('/partials/:filename/:id', routes.partials);
app.get('/partials/:filename', routes.partials);
//app.get('/details/:id', routes.index);

// JSON API
//app.get('/account', ensureAuthenticated, function(req, res){
//    res.render('account', { user: req.user });
//});

app.get('/partials/login', function(req, res){
    res.render('login', { user: req.user, message: req.flash('error') });
//    res.redirect('#/login');
});

app.get('/partials/register', function(req, res){
    res.render('register');
//    res.redirect('#/login');
});

// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
//
//   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    function(req, res) {
        res.redirect('/');
    });

app.post('/register', function(req, res) {
    console.log('****** Ok someone has attempted to register an account with us hey! ******');
    db.users.save(req.body, {safe:true}, fn(req,res));
    res.redirect('/');
});



app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});



app.get('/user/loggedin', function(req, res) {
    //res.send(req.user.twitter);
    res.send(req.user);
})
// TODO - app.addUser
// TODO - app.authUser

// delete to see more logs from sockets
//io.set('log level', 1);

io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});

io.sockets.on('connection', function (socket) {
  socket.on('send:coords', function (data) {
    socket.broadcast.emit('load:coords', data);
  });
});


var port = process.env.PORT || 5000;

app.listen(port, function() {
    console.log("Listening on " + port);
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}