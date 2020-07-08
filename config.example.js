const ENV = require('./env');
const path = require('path');

let config = {
    port: ENV.BE.PORT,
    profile_img_path: path.join(__dirname, 'public',ENV.profile_img_path),
    cover_img_path: path.join(__dirname, 'public',ENV.cover_img_path),
    auth: {
        client_id: ENV.STEEM.CLIENT_ID,
        redirect_uri: ENV.FE.HOST + ((ENV.FE.PORT!='') ? ':' + ENV.FE.PORT : '')
    },
    session: {
        secret: ENV.STEEM.SECRET
    },
    socket: {
        host : ENV.SOCKET.HOST,
        port : ENV.SOCKET.PORT
    },
    twitter: {
        consumer_key: ENV.TWITTER.CONSUMER_KEY,
        consumer_secret: ENV.TWITTER.CONSUMER_SECRET,
        access_token: ENV.TWITTER.ACCESS_TOKEN,
        access_secret: ENV.TWITTER.ACCESS_SECRET
    }
};

module.exports = config;
