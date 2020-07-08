const express = require('express');
const repository = require('../modules/repository');
const steem = require('../modules/hivesignerconnect');
const router = express.Router();
const ENV = require('./../env');
const util = require('../modules/util');

/* GET authenticate a user/redirect to steemconnect. */
router.get('/', (req, res, next) => {
    try {
        if (!req.query.access_token) {
            let uri = steem.getLoginURL(true);
            return res.json({ data: uri, status: 200 });
        } else {
            let token = req.query.access_token;
            steem.setAccessToken(token);
            steem.me((err, steemResponse) => {
                if (err == null) {
                    req.session.steemconnect = steemResponse.account;
                    req.session.access_token = token;
                    let username = steemResponse.account.name;
                    steemResponse.account.access_token = token;
                    repository().saveUserAccessToken(username,token);
                    repository().prepare_new_user_data(steemResponse.account,(user_data) =>{
                        let data = {
                            steemconnect: user_data,
                            access_token: token
                        };
                        return res.json({ data: data, status: 200 });
                    });
                } else {
                    return res.json({ data: err, status: 400 });
                }
            });
        }
    } catch (error) {
        return res.json({ data: error, status: 400 });
    }
});

/* GET authenticate a user/redirect to steemconnect. */
router.post('/logout', (req, res) => {
    req.session.destroy();
    steem.revokeToken(function (err, result) {
        console.log(err,result);
    });
    return res.json({ data: 'Logged out successfully', status: 200 });
});

router.get('/check',util.isAuthenticatedJSON, (req, res) => {
    return res.json({ data: 'Authenticated', status: 200 });
});

module.exports = router;
