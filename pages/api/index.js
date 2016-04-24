
var template = require('marko').load(require.resolve('./template.marko'));
var https = require('https');
var fs = require('fs');

module.exports = function(req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    var renderMode = req.query.renderMode || 'progressive-out-of-order';
    var jsLocation = req.query.jsLocation || 'middle';
    var reorder = renderMode === 'progressive-out-of-order';

    var encodedText = fs.readFileSync('public/uploads/tweetContent.txt', "utf8");
    var reqBody = 'apikey=22464a50cb63064d1a0a74e41b6702823f30b2a5&outputMode=json&'
                  +'text='+encodeURIComponent(encodedText);

    var configAPI = {
        host : 'gateway-a.watsonplatform.net', 
        port : 443,
        method : 'POST',
        headers : {'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': reqBody.length},
        rejectUnauthorized: false
    };

    var viewModel = {
        langDataProvider: function(args, callback) {
            var languageDetectionAPI = configAPI;
            languageDetectionAPI.path = '/calls/text/TextGetLanguage';
            reqGet = https.request(languageDetectionAPI, function(res) {
                var body = '';
                res.on('data', function(d) {
                    body += d;
                });
                res.on('end', function() {
                    var par = JSON.parse(body);
                    
                    if(par.status === 'OK'){
                        setTimeout(function() {
                            callback(null, {
                                lang : par.language
                            });
                        }, 0);
                    }
                });
            });
            reqGet.write(reqBody);
            reqGet.end();
            reqGet.on('error', function(e) {
                console.error(e);
            });      
        },
        sentimentDataProvider: function(args, callback) {
            var sentimentAnalysisAPI = configAPI;
            sentimentAnalysisAPI.path = '/calls/text/TextGetTextSentiment';
            reqGet = https.request(sentimentAnalysisAPI, function(res) {
                var body = '';
                res.on('data', function(d) {
                    body += d;
                });
                res.on('end', function() {
                    var par = JSON.parse(body);
                    if(par.status === 'OK'){
                        setTimeout(function() {
                            callback(null, {
                                result : par.docSentiment.type
                            });
                        }, 0);
                    }
                });
            });
            reqGet.write(reqBody);
            reqGet.end();
            reqGet.on('error', function(e) {
                console.error(e);
            });
        },
        emotionDataProvider: function(args, callback) {
            var emotionAPI = configAPI;
            emotionAPI.path = '/calls/text/TextGetEmotion';
            reqGet = https.request(emotionAPI, function(res) {
                var body = '';
                res.on('data', function(d) {
                    body += d;
                });
                res.on('end', function() {
                    var par = JSON.parse(body);
                    if(par.status === 'OK'){
                        setTimeout(function() {
                            callback(null, {
                                anger: par.docEmotions.anger,
                                disgust: par.docEmotions.disgust,
                                fear: par.docEmotions.fear,
                                joy: par.docEmotions.joy,
                                sadness: par.docEmotions.sadness
                            });
                        }, 0);
                    }    
                });
            });
            reqGet.write(reqBody);
            reqGet.end();
            reqGet.on('error', function(e) {
                console.error(e);
            });
        },
        conceptsDataProvider: function(args, callback) {
            var conceptsAPI = configAPI;
            conceptsAPI.path = '/calls/text/TextGetRankedConcepts';
            reqGet = https.request(conceptsAPI, function(res) {
                var body = '';
                res.on('data', function(d) {
                    body += d;
                });
                res.on('end', function() {
                    var par = JSON.parse(body);
                    if(par.status === 'OK'){
                        var result = [];
                        par.concepts.forEach( function (concept){
                            var x = concept.text + " : " + concept.relevance;
                            result.push(x);
                        });
                        setTimeout(function() {
                            callback(null, {
                                resultArr : result
                            });
                        }, 0);
                    }    
                });
            });
            reqGet.write(reqBody);
            reqGet.end();
            reqGet.on('error', function(e) {
                console.error(e);
            });
        },
        footerDataProvider: function(args, callback) {
            setTimeout(callback, args.delay);
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