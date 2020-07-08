let sc2 = require('steemconnect');
let config = require('../config')

let steem = new sc2.Client({
    app: config.auth.client_id,
    callbackURL: config.auth.redirect_uri ,
    scope: ['login','posting']
});

module.exports = steem;

// comment is a scope that is explained in https://developers.steem.io/apidefinitions/#broadcast_ops_comment