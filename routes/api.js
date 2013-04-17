/*
 * Serve JSON to our AngularJS client
 */
var db = require('mongojs').connect('mongodb://nickeblewis:Winchester72@alex.mongohq.com:10079/farnboroughguide',['users']),db = require('mongojs').connect('mongodb://nickeblewis:Winchester72@alex.mongohq.com:10079/farnboroughguide',['users']);

/* Helpers */
//To allow use ObjectId or other any type of _id
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

exports.name = function (req, res) {
    res.json({
        name: req.user
    });
};

exports.query = function(req, res) {
    var item, sort = {}, qw = {};
    for (item in req.query) {
        req.query[item] = (typeof +req.query[item] === 'number' && isFinite(req.query[item]))
            ? parseFloat(req.query[item],10)
            : req.query[item];
        if (item != 'limit' && item != 'skip' && item != 'sort' && item != 'order' && req.query[item] != "undefined" && req.query[item]) {
            qw[item] = req.query[item];
        }
    }
    if (req.query.sort) { sort[req.query.sort] = (req.query.order === 'desc' || req.query.order === -1) ? -1 : 1; }
    db.collection(req.params.collection).find(qw).sort(sort).skip(req.query.skip).limit(req.query.limit).toArray(fn(req, res))
};

exports.read = function(req, res) {
    db.collection(req.params.collection).findOne({_id:objectId(req.params.id)}, fn(req, res))
};

exports.save = function(req, res) {
    if (req.body._id) { req.body._id = objectId(req.body._id);}
    db.collection(req.params.collection).save(req.body, {safe:true}, fn(req, res));
};

exports.delete = function(req, res) {
    db.collection(req.params.collection).remove({_id:objectId(req.params.id)}, {safe:true}, fn(req, res));
};

exports.group = function(req, res) {
    db.collection(req.params.collection).group(req.body.keys, req.body.cond, req.body.initial, req.body.reduce, req.body.finalize, fn(req, res))
};

exports.mapreduce = function(req, res) {
    if (!req.body.options) {req.body.options  = {}};
    req.body.options.out = { inline : 1};
    req.body.options.verbose = false;
    db.collection(req.params.collection).mapReduce(req.body.map, req.body.reduce, req.body.options, fn(req, res));
};

exports.command =  function (req, res) {
    switch(req.params.cmd)
    {
        case 'distinct':
            req.body = req.body.key;
            db.collection(req.params.collection)[req.params.cmd](req.body, fn(req, res));
            break;

        default:
            db.collection(req.params.collection)[req.params.cmd](req.body, fn(req, res));
    }
};

