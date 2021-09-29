
var express = require('express'),
    request = require('request'),
    crypt = require('./kripto.js'),
    router = express.Router(),
    db = require('./db.js'),
    jwt = require('./jwt/jwt'),
    fs = require('fs');


router.get('/test', function (req, res) {
    res.send({ "message": "OK"});
});


module.exports = router;