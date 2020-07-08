const _socket = require('../utility/socket');
const tweet = require('./twitterconnect');
const ModelModule = require('../models/module');
const ENV = require('../env');
const utf8 = require('utf8');
const util = require('../modules/util');
const twitter_link = 'https://twitter.com/';
const steem = require('../modules/hivesignerconnect');
const repository = require('../modules/repository');

var _this = {
    User: () => {
        return ModelModule.Users();
    },
    UserTwitter: () => {
        return ModelModule.UserTwitterVerify();
    },
    Post: () => {
        return ModelModule.UserTwitterPost();
    },
    Socket: () => {
        return new _socket().buildSignal('twitterfetcher');
    },
    start: () => {
        console.info('Twitter Fetcher Initiated');
        _this.Socket().listen('wake-signal', (packet) => {
            if (packet.data.module === 'twitterfetcher') {
                console.info(packet.data.function, 'is awaken');
                _this[packet.data.function]();
            }
        });
        _this.getVerifiedUsers();
    },
    waker: ($func, $default_sec = 60) => {
        _this.Socket().waker('twitterfetcher', $func, $default_sec);
    },

    getVerifiedUsers: () => {
        _this.waker('getVerifiedUsers');
        _this.UserTwitter().get_all_verified(result => {
            console.log('Found ',result.length, ' users');
            if (result && result.length > 0) {
                result.forEach(user => {
                    _this.searchHiveRelatedPosts(user);
                    if(ENV.enable_tweet_post_to_hive){
                        _this.checkPendingTweets(user);
                    }
                });
            }else{
                console.log('getVerifiedUsers error:','No user found');
                _this.Socket().signal('getVerifiedUsers', false);
                return false;
            }
        });
    },

    searchHiveRelatedPosts: (user) => {
        if (!user) {
            return false;
        }
        let hashtags = ENV.twitter_hashtags;
        let screenname = user.screenname;
        let username = user.username;
        let since_id = '';
        _this.Post().get_last_str_id(screenname, async (str_id) => {
            if (str_id) {
                since_id = str_id;
            }
            try {
                let response = await tweet.get("statuses/user_timeline", {
                    screen_name: screenname,
                    count: 100,
                    exclude_replies: true, // default
                    include_rts: false // default
                });
                if (since_id) {
                    response.since_id = since_id;
                }
                if (response && response.length > 0) {
                    response.forEach(tweet => {
                        let post_tags = tweet.entities.hashtags;
                        if (post_tags.length > 0) {
                            let user_tweet_tags = [];
                            let exists = false;
                            post_tags.forEach(tags => {
                                user_tweet_tags.push(tags.text);
                                if (hashtags && hashtags.length > 0) {
                                    hashtags.forEach(dbuzz_tag => {
                                        if (dbuzz_tag.toLowerCase() === tags.text.toLowerCase()) {
                                            exists = true;
                                        }
                                    });
                                }
                            });

                            let all_images = [];
                            let images = tweet.entities.media;
                            if(images && images.length > 0){
                                images.forEach(image => {
                                    all_images.push(image.media_url_https);
                                });
                            }

                            if (exists) {
                                let created_at = new Date(Date.parse(tweet.created_at))
                                let params = {
                                    username: username,
                                    screenname: screenname,
                                    hashtags: JSON.stringify(user_tweet_tags),
                                    post: utf8.encode(tweet.text),
                                    post_date: created_at,
                                    id_str: tweet.id_str,
                                    source: tweet.source,
                                    images: JSON.stringify(all_images)
                                };
                                if(created_at >= new Date(user.verified_dt)){
                                     _this.savePosts(params);
                                }
                            }
                        }

                    });
                }
            } catch (error) {
                console.log('searchHiveRelatedPosts error:', error);
                _this.Socket().signal('searchHiveRelatedPosts', false);
            }
        });
    },

    savePosts: (twitter) => {
        _this.Post().check_if_exist(twitter.id_str, (exists) => {
            if (!exists) {
                _this.Post().insert(twitter, (inserted) => {
                    if (inserted) {
                        console.log('Twitter post ', twitter.id_str, 'of ', twitter.username, ' was sucessfully saved');
                    } else {
                        console.log('Twitter post ', twitter.id_str, 'of ', twitter.username, ' failed to save');
                    }
                });
            }else{
                if(JSON.parse(twitter.images).length > 0){
                    _this.Post().get_post(twitter.id_str,(post) => {
                        if(post.images === null){
                            _this.Post().update(post.id,twitter,(updated) => {
                                if(updated){
                                    console.log('Twitter image/s of post', twitter.id_str, ' was sucessfully saved');
                                }
                            });
                        }
                    });
                }
            }
        });
    },

    checkPendingTweets: (user_info) => {
        let username = user_info.username;
        _this.Post().get_all_unposted(username, (posts) => {
            if (posts && posts.length > 0) {
                _this.User().get_user(username, (user) => {
                    if (user && user.access_token) {
                        let access_token = user.access_token;
                        posts.forEach(post => {
                            let permlink = util.urlString();
                            let content = util.trimLineBreak(utf8.decode(post.post));
                            let customData = {
                                tags: JSON.parse(post.hashtags),
                                app: 'dBuzz/v1.0.0'
                            }
                            let title = content.substr(0,ENV.title_limit) + ' ...';
                            let images = '';
                            if(post.images !== null){
                                let post_images = JSON.parse(post.images);
                                if(post_images.length > 0){
                                    post_images.forEach(image => {
                                        images += image + ' ';
                                    });
                                }
                            }
                           
                            let params = {
                                id_str: post.id_str,
                                access_token: access_token,
                                author: username,
                                screenname: user_info.screenname,
                                permlink: permlink,
                                title: title,
                                body: content + ' ' + images +'<br/><br/><small>Posted via Twitter. Click here to view the original post<br/>' + twitter_link + post.screenname + '/status/' + post.id_str + '</small>',
                                primaryTag: ENV.primary_tag,
                                customData: customData,
                                post_date: new Date(post.post_date),
                                verified_dt: new Date(user_info.verified_dt)
                            };
                            if((new Date(post.post_date)) >= (new Date(user_info.verified_dt))){
                                console.log(params);
                                _this.postToHive(params);
                            }
                        });
                    }else{
                        console.log('No token found for user',username);
                    }
                });
            }
        });
    },

    postToHive: (params) => {
        if (params.access_token) {
            _this.setIsPostingStatus(params.id_str, 1);
            let comment_options = '';
            if(ENV.enable_comment_options){
                comment_options = {
                    author: params.author,
                    permlink: params.permlink,
                    max_accepted_payout: ENV.max_accepted_payout,
                    percent_steem_dollars: ENV.percent_steem_dollars,
                    allow_votes: true,
                    allow_curation_rewards: true,
                    extensions: []
                };
            }
            steem.setAccessToken(params.access_token);
            steem.comment('', params.primaryTag, params.author, params.permlink, params.title, params.body, params.customData,comment_options,(err, steemResponse) => {
                if (err === null) {
                    let url = params.author + '/' + params.permlink;
                    _this.Post().change_isposted_status(params.id_str, url, (result) => {
                        if (result) {
                            repository().save_new_post(params.author, params.permlink, (cb) => {
                                if (cb) {
                                    console.log('Tweet post:', params.id_str, ' sucessfully posted to HIVE');
                                } else {
                                    console.log('Tweet post:', params.id_str, ' sucessfully posted but failed to save to database');
                                    _this.saveLastError(params.id_str,'Posted to hive but failed to save post to database.');
                                }
                            });
                        } else {
                            console.log('Tweet post:', params.id_str, ' sucessfully posted but failed to change post status');
                            _this.saveLastError(params.id_str,'Posted to hive but failed to change post status.');
                        }
                    });
                } else {
                    _this.setIsPostingStatus(params.id_str, 0);
                    if (err.error === 'invalid_grant') {
                        console.log('postToHive error: The token has invalid role');
                        _this.saveLastError(params.id_str,'The token has invalid role.');
                    } else {
                        console.log('postToHive error:', err.error_description);
                        _this.saveLastError(params.id_str,err.error_description);
                    }
                }
            });
        }else{
            console.log('postToHive error: No token provided for user',params.author);
            _this.saveLastError(params.id_str,'No token provided for user',params.author);
        }
    },

    saveLastError : ($id_str,$error) => {
        let error = new Date() +':'+ $error;
        _this.Post().save_last_error($id_str,error,(saved_error) => {
            if(saved_error){
                console.log('Saved error for ',$id_str);
            }else{
                console.log('Failed to saved error for ',$id_str);
            }
        })
    },

    setIsPostingStatus : ($id_str,$is_posting) => {
        _this.Post().set_is_posting($id_str, $is_posting, (posted) => {
            if(posted){
                console.log('Set is posting status of ',$id_str,' to ',$is_posting);
            }else{
                console.log('Failed to set is posting status of ',$id_str,' to ',$is_posting);
            }
        });
    }
};

function twitterfetcher() {
    return _this;
}

module.exports = twitterfetcher;