let hs = require('hivesigner');
let config = require('../config');

var client = new hs.Client({
    app: config.auth.client_id,
    callbackURL: config.auth.redirect_uri ,
    scope: ['vote','comment','login','posting']
  });

module.exports = client;