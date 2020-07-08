const _socket = require('../utility/socket');
const steemapi = require('./steemapi');
const client = require('./redisconnect');
const fs = require('fs');
const util = require('./util');
const ModelModule = require('../models/module');
const UsersModel = ModelModule.Users();
const TwitterModel = ModelModule.UserTwitterVerify();
const NotifsModel = ModelModule.Notifs();
const FeedsModel = ModelModule.Feeds();
const repository = require('../modules/repository');
const ENV = require('../env');

var _this = {
    following: null,
    users: null,
    user_count: 0,
    user_profile: {},
    Socket: () => {
        return new _socket().buildSignal('steemaccountfetcher');
    },

    start: () => {
        console.info('Steem Account Fetcher Initiated');
        _this.getSteemUsers();
        _this.Socket().listen('wake-signal', (packet) => {
            if (packet.data.module === 'steemaccountfetcher') {
                console.info(packet.data.function, 'is awaken');
                _this[packet.data.function]();
            }
        });

        _this.Socket().hear_signal('mapWhotofollowMetadata', (data) => {
            _this.getSteemUsers();
        });
    },

    waker: ($func, $default_sec = 60) => {
        _this.Socket().waker('steemaccountfetcher', $func, $default_sec);
    },

    getSteemUsers: () => {
        _this.waker('getSteemUsers');
        _this.user_count = 0;
        _this.users = [];
        UsersModel.get_all((result) => {
            if (result && result.length > 0) {
                _this.user_count = result.length;
                let ind = 0;
                result.forEach((user) => {
                    let username = user.username;
                    _this.users.push(username);
                    _this.getAccountInfo(username);
                    ind++;
                    if (ind === _this.user_count) {
                        _this.mapWhotofollowMetadata();
                    }
                });
            } else {
                console.log('getSteemUsers error', 'No users found');
                _this.Socket().signal('getSteemUsers', false);
                return false;
            }
        });
    },

    getAccountInfo: (username) => {
        repository().get_user_info(username, (account) => {
            if (account) {
                _this.user_profile[username] = account;
                _this.saveAccountInfo(account);
            } else {
                console.log('No data fetched for ', username);
            }
        });
    },

    saveAccountInfo: (account) => {
        let username = account.author;
        let mbdata = {
            username: username,
            steem_id: account.user_id,
            metadata: JSON.stringify(account),
            follower_count: account.follower_count,
            following_count: account.following_count,
            is_member: account.is_member
        };
        UsersModel.check_if_exist(username, (exists) => {
            if (!exists) {
                if (account.is_member === 1) {
                    UsersModel.insert(mbdata, (result) => {
                        if (result) {
                            console.log('Saved account info of ', username);
                            // util.saveAuthorPhotos(account);
                            _this.getAcountNotifications(username);
                            _this.getFollowing(username);
                        } else {
                            console.log('Failed to save account info of ', username);
                        }
                    });
                }
            } else {
                let udata = {
                    metadata: JSON.stringify(account),
                    follower_count: account.follower_count,
                    following_count: account.following_count,
                    is_member: account.is_member
                };
                UsersModel.get_user(username, (result) => {
                    if (result) {
                        UsersModel.update(result.id, udata, (result) => {
                            if (result) {
                                console.log('Updated account info of ', username);
                                if(account.is_member === 1){
                                    // util.saveAuthorPhotos(account);
                                    _this.getAcountNotifications(username);
                                    _this.getFollowing(username);
                                }
                            } else {
                                console.log('Failed to update account info of ', username);
                            }
                        });
                    }
                });
            }
        });
    },
    
    getFollowing: (username) => {
        if (_this.user_profile[username] !== undefined) {
            let profile = _this.user_profile[username];
            let follow_count = profile.following_count;
            if (follow_count > 1000) {
                follow_count = 1000;
            }
            steemapi.get_following(username, follow_count, (result) => {
                if (result.count > 0) {
                    const following = [];
                    result.data.forEach((item) => {
                        following.push(item.following);
                    });
                    _this.getFollowingAccountInfo(username, following);
                }
                _this.getFollowers(username);
            });
        }
    },

    getFollowingAccountInfo: (username, following_arr) => {
        steemapi.get_multiple_account_info(following_arr, (result) => {
            if (result.count > 0) {
                let accounts = result.data;
                let map_accnts = [];
                let ind = 0;
                accounts.forEach(account => {
                    let profile = {};
                    if (account.json_metadata) {
                        let metadata = JSON.parse(account.json_metadata);
                        if (metadata.profile) {
                            profile = metadata.profile;
                        }
                    }
                    let mapped = {
                        user_id: account.id,
                        username: account.name,
                        created: account.created,
                        post_count: account.post_count,
                        metadata: profile
                    };

                    TwitterModel.get_user(account.name, (result1) => {
                        let is_verified = 0;
                        if (result1) {
                            is_verified = result1.is_verified;
                        }

                        mapped.is_verified = is_verified;
                        map_accnts.push(mapped);
                        ind++;
                        if (ind == accounts.length) {
                            client.set('following_' + username, JSON.stringify(map_accnts));
                            console.log('Saved followings of ',username);
                        }
                    });
                });
            }
        });
    },

    getFollowers: (username) => {
        if (_this.user_profile[username] !== undefined) {
            let profile = _this.user_profile[username];
            let follow_count = profile.follower_count;
            if (follow_count > 1000) {
                follow_count = 1000;
            }
            steemapi.get_followers(username, follow_count, (result) => {
                if (result.count > 0) {
                    const followers = [];
                    result.data.forEach((item) => {
                        followers.push(item.follower);
                    });
                    _this.getFollowerAccountInfo(username, followers);
                }
            });
        }
    },

    getFollowerAccountInfo: (username, follower_arr) => {
        steemapi.get_multiple_account_info(follower_arr, (result) => {
            if (result.count > 0) {
                let accounts = result.data;
                let map_accnts = [];
                let ind = 0;
                accounts.forEach(account => {
                    let profile = {};
                    if (account.json_metadata) {
                        let metadata = JSON.parse(account.json_metadata);
                        if (metadata.profile) {
                            profile = metadata.profile;
                        }
                    }
                    let mapped = {
                        user_id: account.id,
                        username: account.name,
                        created: account.created,
                        post_count: account.post_count,
                        metadata: profile
                    };

                    TwitterModel.get_user(account.name, (result1) => {
                        let is_verified = 0;
                        if (result1) {
                            is_verified = result1.is_verified;
                        }
                        mapped.is_verified = is_verified;
                        map_accnts.push(mapped);
                        ind++;
                        if (ind == accounts.length) {
                            client.set('follower_' + username, JSON.stringify(map_accnts));
                            console.log('Saved followers of ',username);
                        }
                    });
                });
            }
        });
    },

    mapWhotofollowMetadata: () => {
        let dir = 'cache/who_to_follow.json';
        if (util.checkFileExists(dir) && fs.readFileSync(dir, 'utf8')) {
            if (util.isValidJson(fs.readFileSync(dir, 'utf8'))) {
                const userJson = JSON.parse(fs.readFileSync(dir, 'utf8'));
                if (userJson && userJson.users) {
                    let usernames = userJson.users;
                    if (usernames.length > 0) {
                        steemapi.get_multiple_account_info(usernames, (result) => {
                            if (result.count > 0) {
                                let accounts = result.data;
                                let whotofollow = [];
                                let ind = 0;
                                accounts.forEach(user => {
                                    repository().user_account_mapper(user, (mapped) => {
                                        whotofollow.push(mapped);
                                        ind++;
                                        if (ind == accounts.length) {
                                            client.set('who_to_follow', JSON.stringify(whotofollow));
                                            console.log('Saved who to follow users');
                                        }
                                    });
                                });
                            }
                        });
                    }
                }
            }
        }
    },

    getAcountNotifications: (username) => {
        steemapi.get_notifications(username, 100, (result) => {
            if(result.count === 0){
                return false;
            }
            if (result.count > 0) {
                let notifs = result.data;
                notifs.forEach(notif => {
                    let sender = '';
                    if (notif.type !== 'error') {
                        let msg = notif.msg.split(' ');
                        sender = msg[0] ? msg[0].replace('@', '') : '';
                    }
                    let url = notif.url.replace('@', '');
                    if (sender) {
                        let param = {
                            username: username,
                            sender: sender,
                            type: notif.type,
                            date: notif.date,
                            notif_id: notif.id,
                            url: url,
                            msg: notif.msg,
                        };

                        let author = url.split('/')[0];
                        let permlink = url.split('/')[1];
                        steemapi.get_content(author, permlink, (result1) => {
                            let save_it = true;
                            if (notif.type !== 'follow') {
                                save_it = false;
                                if (result1.status === 200 && result1.data) {
                                    let content = result1.data;
                                    let body_limit_check = util.passCharacterLimit(content.body);
                                    if (body_limit_check) {
                                        save_it = content.category === ENV.primary_tag;
                                    }
                                }
                            }
                            FeedsModel.get_feed(url, (feed) => {
                                let parent_url = '';
                                if (feed) {
                                    parent_url = feed.parent_url;
                                }
                                param.parent_url = parent_url;
                                NotifsModel.check_if_exist(username,url, (exists) => {
                                    if (!exists) {
                                        if (notif.type == 'reblog') {
                                            param.msg = '@' + sender + ' resaid your post';
                                        }
                                        if (_this.user_profile[sender] !== undefined) {
                                            param.sender_metadata = JSON.stringify(_this.user_profile[sender]);
                                            if (save_it) {
                                                NotifsModel.insert(param, (inserted) => {
                                                    if (inserted) {
                                                        console.log('Notif ID ' + notif.id + ' of ' + username + ' was inserted');
                                                    } else {
                                                        console.log('Notif ID ' + notif.id + ' of ' + username + ' failed to insert');
                                                    }
                                                });
                                            }
                                        } else {
                                            repository().get_user_info(sender, (result) => {
                                                if (result) {
                                                    _this.user_profile[sender] = result;
                                                    param.sender_metadata = JSON.stringify(result);
                                                    if (save_it) {
                                                        NotifsModel.insert(param, (inserted) => {
                                                            if (inserted) {
                                                                console.log('Notif ID ' + notif.id + ' of ' + username + ' was inserted');
                                                            } else {
                                                                console.log('Notif ID ' + notif.id + ' of ' + username + ' failed to insert');
                                                            }
                                                        });
                                                    }

                                                }
                                            });
                                        }
                                    } 
                                });
                            });
                        });
                    }
                });
            }
        });
    }
};

function steemaccountfetcher() {
    return _this;
}

module.exports = steemaccountfetcher;
