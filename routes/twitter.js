let express = require('express');
let router = express.Router();
let tweet = require('../modules/twitterconnect');
let util = require('../modules/util');
let ModelModule = require('../models/module');
const UserTwitterModel = ModelModule.UserTwitterVerify();
const UserModel = ModelModule.Users();

router.post('/generate-id',util.isAuthenticatedJSON, (req, res, next) => {
    let username = "";
    if (req.session.steemconnect) {
        username = req.session.steemconnect.name;
    } 

    if (username == '' && req.cookies.steemconnect_name) {
        username = req.cookies.steemconnect_name;
    }

    if (username === '') {
     return res.json({ data:null ,msg: 'Invalid user. Please login again', status: 400 });
    }

    UserTwitterModel.get_user(username,(user) => {
        if(user){
            if(user.is_verified === 1){
                return res.json({data: null, msg:'User is already verified', status:200 });
            }
            return res.json({data: user, msg:'success', status:200 });
        }else{
            let random_num = 'dbuzz_'+util.randomNumber();
            let dbdata = {
                username : username,
                generated_id : random_num
            };
            UserModel.get_user(username,(user) => {
                if(user){
                    dbdata.steem_id = user.id;
                    UserTwitterModel.insert(dbdata,(result)=> {
                        if(result){
                            return res.json({data: { generated_id: random_num }, msg:'success', status:200 });
                        }else{
                            return res.json({data: null, msg:'Failed to generate random number',  status:400 });
                        }
                    });
                }else{
                    return res.json({data: null, msg:'Invalid user',  status:400 });
                }
            });
        }
    });
});

router.get('/generated-id/@:author', (req, res, next) => {
    let author = req.params.author;
    UserTwitterModel.get_generated_id(author,(result) => {
        if(result){
            return res.json({data: result, msg:'Success', status: 200 });
        }
        return res.json({data: null, msg:'No data fetched', status:400 });
    });
});

router.get('/get-by-generated-id/:code', (req, res, next) => {
    let code = req.params.code;
    UserTwitterModel.get_user_duplicate(code,(result) => {
        if(result){
            return res.json({data: result, msg:'Success', status: 200 });
        }
        return res.json({data: null, msg:'No data fetched', status:400 });
    });
});


router.get('/check-status/@:author', (req, res, next) => {
    let author = req.params.author;
    UserTwitterModel.check_if_verified(author,(verified) => {
        if(verified){
            return res.json({data: verified, msg:'Verified', status: 200 });
        }
        return res.json({data: verified, msg:'Not yet verified', status:200 });
    });
});

router.get('/search/:query', async (req, res, next) => {
    let query = req.params.query
    try {
        const response = await tweet.get("search/tweets",{
            q : query,
            count: 10,
            result_type: 'recent'
        });
        if(response && response.statuses.length > 0){
            return res.json({ data: response, status: 200 });
        }else{
            return res.json({ data: 'No data fetched', status: 200 });
        }
        
    } catch (error) {
        return res.json({ data: error.errors, status: 400 });
    } 
});


// Returns fully-hydrated user objects for up to 100 users per request, 
// as specified by comma-separated values passed to the user_id and/or screen_name parameters.
router.get('/profile/@:screenname', async (req, res, next) => {
    let screenname = req.params.screenname
    try {
        const response = await tweet.get("users/lookup",{
            screen_name : screenname
        });
        return res.json({ data: response, status: 200 });
    } catch (error) {
        return res.json({ data: error.errors, status: 400 });
    } 
});

// Returns a variety of information about the user specified by the required user_id or screen_name parameter. 
// The author's most recent Tweet will be returned inline when possible.
router.get('/show/@:screenname', async (req, res, next) => {
    let screenname = req.params.screenname
    try {
        const response = await tweet.get("users/show",{
            screen_name : screenname
        });
        return res.json({ data: response, status: 200 });
    } catch (error) {
        return res.json({ data: error.errors, status: 400 });
    }
});

// Returns a collection of the most recent Tweets posted by the user indicated by the screen_name or user_id parameters.
router.get('/mytweets/@:screenname/:since_id?/:limit?', async (req, res, next) => {
    let screenname = req.params.screenname;
    let since_id = req.params.since_id || '';
    let limit = req.params.limit || 20;
    try {
        let response = await tweet.get("statuses/user_timeline",{
            screen_name : screenname,
            count: limit,
            exclude_replies: true, // default
            include_rts: false // default
        });
        if(since_id){
            response.since_id = since_id;
        }
        return res.json({ data: response, status: 200 });
    } catch (error) {
        return res.json({ data: error.errors, status: 400 });
    } 
});

// Returns a collection of the most recent Tweets and Retweets posted by the authenticating user and the users they follow. 
// The home timeline is central to how most users interact with the Twitter service.
router.get('/hometweets/:limit?', async (req, res, next) => {
    let limit = req.params.limit || 20;
    try {
        const response = await tweet.get("statuses/home_timeline",{
            count: limit,
            exclude_replies: true, // default
            include_entities: false // default
        });
        return res.json({ data: response, status: 200 });
    } catch (error) {
        return res.json({ data: error.errors, status: 400 });
    } 
});

// Returns the 20 most recent mentions (Tweets containing a users's @screen_name) for the authenticating user.
router.get('/mentions/@:screenname/:limit?', async (req, res, next) => {
    let limit = req.params.limit || 20;
    let screenname = req.params.screenname;
    try {
        const response = await tweet.get("statuses/mentions_timeline",{
            screen_name : screenname,
            count: limit,
            include_entities: false // default
        });
        return res.json({ data: response, status: 200 });
    } catch (error) {
        return res.json({ data: error.errors, status: 400 });
    } 
});

router.get('/following/:limit?/:screenname?', async (req, res, next) => {
    let limit = req.params.limit || 20;
    let screenname = req.params.screenname;
    try {
        const response = await tweet.get("friends/list",{
            screen_name : screenname,
            count: limit,
            include_user_entities: true // default
        });
        return res.json({ data: response, status: 200 });
    } catch (error) {
        return res.json({ data: error.errors, status: 400 });
    } 
});

module.exports = router;
// source: https://developer.twitter.com/en/docs