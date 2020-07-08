let twitter = require('twitter-lite');
let config = require('../config');

const client = new twitter({
    consumer_key : config.twitter.consumer_key,
    consumer_secret: config.twitter.consumer_secret,
    access_token_key: config.twitter.access_token,
    access_token_secret: config.twitter.access_secret
});

module.exports = client;