let client = require('redis');
const ENV = require('../env');

if (ENV.REDIS.require_password) {
    client = require('redis').createClient(
        ENV.REDIS.port,
        ENV.REDIS.host,
    { expire: 60,
      password: ENV.REDIS.password });
} else {
    client = require('redis').createClient(
        ENV.REDIS.port,
        ENV.REDIS.host,
    {expire: 60});
}

client.select(ENV.REDIS.db);

module.exports = client;

