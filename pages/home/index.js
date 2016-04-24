
var template = require('marko').load(require.resolve('./template.marko'));
var express = require('express');
var router = express.Router();
var Promise = require("bluebird");
var twitterAPI = require('node-twitter-api');

var twitter = new twitterAPI({
    consumerKey: 'mziwMTIiiqKv8b9sojIt4mVTc',
    consumerSecret: 'RFPtlAfxFyCIPyzRd0nIrxumcLt0CRTKuKuOsYyr3TEPqJj1By',
    //callback: 'http://127.0.0.1:8080/callbackurl'
    callback: 'http://ariyalur.tcs.us-south.mybluemix.net/callbackurl'
});
twitter = Promise.promisifyAll(twitter);
var rToken = '';
var rTokenSecret = '';
var aToken = '';
var aTokenSecret = '';
var hellMaxID = '';

module.exports = function(req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    var renderMode = req.query.renderMode || 'progressive-out-of-order';
    var jsLocation = req.query.jsLocation || 'middle';
    var reorder = renderMode === 'progressive-out-of-order';
    var stateName = req.query.state;
    var auth = 'Basic '+ new Buffer("CONSUMER-KEY:CONSUMER-SECRET").toString('base64'); //Replace your key and secret
    var post_data = querystring.stringify({
      'grant_type' : 'client_credentials'
    });
    var tokenAPI = {
        host : 'apphonics.tcs.com', 
        path : '/token',
        port : 443,
        method : 'POST',
        headers : {'Authorization': auth},
        json: {'grant_type': 'client_credential',
        'Content-Length': Buffer.byteLength(post_data) },
        rejectUnauthorized: false
    };

    var viewModel = {
        headerDataProvider: function(args, callback) {
            var token = '';
            reqGet = https.request(tokenAPI, function(res) {
                var body = '';
                res.on('data', function(d) {
                    body += d;
                });
                res.on('end', function() {
                    var par = JSON.parse(body);
                    token += par.access_token;
                    if(token !== undefined && token !== null){
                        setTimeout(function() {
                            callback(null, {
                                timetaken : token
                            });
                        }, 0);
                    }
                });
            });
            reqGet.write(post_data);
            reqGet.end();
            reqGet.on('error', function(e) {
                console.error("err : " +e);
            });  
        },
        renderMode: renderMode,
        reorderEnabled: reorder,
        jsLocation: jsLocation
    };

    if (renderMode === 'single-chunk') {
        template.render(viewModel, function(err, html) {
            if (err) {
                res.end(err.toString());
                return;
            }
            res.end(html);
        });
    } else {
        template.render(viewModel, res);
    }

}