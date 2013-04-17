exports.index = function(req, res){
    res.render('index');
};

exports.partials = function (req, res) {
    var name = req.params.filename;
res.render('partials/' + name);
};

exports.account = function (req, res) {
    console.log('here');
    res.render('account', {user: req.user});
}