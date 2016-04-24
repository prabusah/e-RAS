var express = require('express');
var router = express.Router();
var Promise = require("bluebird");
var twitterAPI = require('node-twitter-api');
var fs = require('fs');

var twitter = new twitterAPI({
    consumerKey: 'REPLACE YOUR KEY',
    consumerSecret: 'REPLACE YOUR SECRET',
    //callback: 'http://127.0.0.1:8080/home/callbackurl'
    callback: 'http://e-ras.tcs.us-south.mybluemix.net/home/callbackurl'
});
var twitter = Promise.promisifyAll(twitter);
var twitterTokens = {
    rToken : '',
    rTokenSecret : '',
    aToken : '',
    aTokenSecret : ''
}

/* GET home page. */
router.get('/home/index', function(req, res, next) {
    res.render('index.ejs');
});

router.get('/home/handle', function(req, res, next) {
    res.render('handle.ejs');
});

router.post('/home/twitterSignIn', function(req, res, next) {
    twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
        if (error) {
            console.log("Error getting OAuth request token : " + error);
        } else {
            twitterTokens.rToken = requestToken;
            twitterTokens.rTokenSecret = requestTokenSecret;
            res.redirect("https://api.twitter.com/oauth/authenticate?oauth_token=" + requestToken);
        }
    });
});

router.get('/home/callbackurl', function(req, res, next) {
    var oToken = req.query.oauth_token;
    var oVerifier = req.query.oauth_verifier;
    
    twitter.getAccessToken(twitterTokens.rToken, twitterTokens.rTokenSecret, oVerifier, function(error, accessToken, accessTokenSecret, results) {
        if (error) {
            console.log(error);
        } else {
            twitterTokens.aToken = accessToken;
            twitterTokens.aTokenSecret = accessTokenSecret;
            res.render('handle.ejs');
        }
    });
});


router.post('/home/api', function(req, res, next) {
    var userHandle = req.body.twitterHandle;
    console.log('userHandle '+userHandle);
    var tweetContent = '';
    var paras = {screen_name: userHandle, count: 200};
    twitter.getTimelineAsync("user_timeline", paras, twitterTokens.aToken, twitterTokens.aTokenSecret)
        .then(function(data){
            var counter = 0;
            var totalTweets = data[0].user.statuses_count;
            if(totalTweets > 300) totalTweets = 300;//ALWAYS SETTING TO 300
            
            //Array to loop promises
            var intArr = [];
            for(j=0;j<totalTweets/200;j++){
                intArr[j] = j;
            }

            //First set of 200 tweets (if available)
            var maxID = '';
            for(var i=0; i<data.length;i++){
                counter = counter + 1;
                tweetContent = tweetContent + data[i].text;
                maxID = data[i].id;
            }

            //Next set of 100 tweets
            Promise.each(intArr, function(counting){
                return twitter.getTimelineAsync("user_timeline", {screen_name:userHandle, count: 100, max_id: maxID}, twitterTokens.aToken, twitterTokens.aTokenSecret)
                    .then(function(data){
                        for(var i=0; i<data.length;i++){
                            counter = counter + 1;
                            tweetContent = tweetContent + data[i].text;
                            maxID = data[i].id;
                            if(counter === 300) break;
                        }
                    })
                    .catch(function(error){
                        console.log(error);
                    });
            }).finally(function(){
                //console.log(tweetContent);
                fs.writeFile('public/uploads/tweetContent.txt', tweetContent, function (err) {
                    if (err) return console.log(err);
                    console.log('file saved');
                    
                    res.redirect('http://e-ras.tcs.us-south.mybluemix.net/alchemyAPI');
                    //res.redirect('http://127.0.0.1:8080/alchemyAPI');
                });
                //res.redirect('http://127.0.0.1:8080/alchemyAPI');
            });
         })
        .catch(function(error){
            console.log(error);
         });
});

module.exports = router; //mising this will show "requires middleware function but got a ' + gettype(fn));" 
