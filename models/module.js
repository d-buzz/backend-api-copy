const _user_twitter_verify = require('./UserTwitterVerify');
const _user_twitter_Posts = require('./UserTwitterPosts');
const _users = require('./Users');
const _feeds = require('./Feeds');
const _notif = require('./Notifications');
const _witness = require('./Witness');

module.exports = {
    UserTwitterVerify: _user_twitter_verify,
    UserTwitterPost: _user_twitter_Posts,
    Users: _users,
    Feeds: _feeds,
    Notifs: _notif,
    Witness: _witness
};