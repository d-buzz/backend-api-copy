const _socket = require('../utility/socket');
const steemapi = require('./steemapi');
const client = require('./redisconnect');
const ENV = require('../env');
const ModelModule = require('../models/module');
const UsersModel = ModelModule.Users();
const FeedsModel = ModelModule.Feeds();
const WitnessModel = ModelModule.Witness();
const api_err_msg = "No data fetched from HIVE API";
const moment = require('moment');
const utf8 = require('utf8');
const repository = require('../modules/repository');
const util = require('./util');
const fs = require('fs');

var _this = {
    latest_feed: null,
    trending_feed: null,
    blog_feed: null,
    latest_feed_count: 0,
    trending_feed_count: 0,
    blog_feed_count: 0,
    latest_authors: [],
    trending_authors: [],
    all_authors: [],
    contents: [],
    unique_profile: {},
    feed_types: ['latest', 'trending'],
    all_feeds_saved: false,
    Socket: () => {
        return new _socket().buildSignal('steemfeedfetcher');
    },

    start: () => {
        console.info('Steem Feed Fetcher Initiated');
        _this.getLatestFeeds();
        _this.Socket().listen('wake-signal', (packet) => {
            if (packet.data.module === 'steemfeedfetcher') {
                console.info(packet.data.function, 'is awaken');
                _this[packet.data.function]();
            }
        });

        _this.Socket().hear_signal('getWitnesses', (data) => {
            _this.getLatestFeeds();
        });
    },

    waker: ($func, $default_sec = 60) => {
        _this.Socket().waker('steemfeedfetcher', $func, $default_sec);
    },

    getLatestFeeds: () => {
        _this.all_authors = [];
        _this.latest_feed = [];
        _this.latest_feed_count = 0;
        _this.waker('getLatestFeeds');
        let params = { tag: ENV.primary_tag, limit: 100 };
        steemapi.get_latest_posts(params, (result) => {
            if (result.status !== 200) {
                console.log('getLatestFeeds error: ', result);
                return false;
            }
           
            let feeds = result.data;
            _this.latest_feed = feeds;
            _this.latest_feed_count = feeds.length;
            _this.getUniqueUsers(feeds);
            _this.getTrendingFeeds();
        });
    },

    getTrendingFeeds: () => {
        _this.trending_feed = [];
        _this.trending_feed_count = 0;
        let params = { tag: ENV.primary_tag, limit: 100 };
        steemapi.get_trending_posts(params, (result) => {
            if (result.status !== 200) {
                console.log('getTrendingFeeds error: ', result.data);
                _this.Socket().signal('getTrendingFeeds', false);
                return false;
            }
            let feeds = result.data;
            _this.trending_feed = feeds;
            _this.trending_feed_count = feeds.length;
            _this.getUniqueUsers(feeds);
            _this.mapUserData();
            _this.getTrendingTags();
        });
    },

    getUniqueUsers: (feeds) => {
        if (feeds.length <= 0) {
            console.log('getUniqueUsers error: ', 'No feed data found');
            _this.Socket().signal('getUniqueUsers', false);
            return false;
        }
        feeds.forEach((feed, i) => {
            _this.all_authors.push(feed.author);
        });
        const distinct = (value, index, self) => {
            return self.indexOf(value) === index;
        }
        _this.all_authors = _this.all_authors.filter(distinct);
    },

    mapUserData: () => {
        if (_this.all_authors.length > 0) {
            let ind = 0;
            _this.all_authors.forEach(user => {
                _this.mapAuthorData(user);
                ind++;
                if (ind === _this.all_authors.length) {
                    _this.feed_types.forEach(type => {
                        let feeds = [];
                        if (type === 'latest') {
                            feeds = _this.latest_feed;
                            _this.mapFeedData(feeds, type);
                        } else if (type === 'trending') {
                            feeds = _this.trending_feed;
                            _this.mapFeedData(feeds, type);
                        }
                    });
                }
            });
        }
    },

    mapAuthorData: (author) => {
        let username = author;
        repository().get_user_info(username,(account) => {
            if(!account){
                console.log('mapAuthorData error: ', 'No account info fetched for ' + username);
                return false;
            }
            _this.unique_profile[username] = account;
            _this.saveAccountInfo(account);
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
            if (!exists && account.is_member === 1) {
                UsersModel.insert(mbdata, (result) => {
                    if (result) {
                        console.log('Saved account info of ', username);
                    } else {
                        console.log('Failed to save account info of ', username);
                    }
                });
            }
        });
    },

    mapFeedData: (feeds, type) => {
        if (feeds.length <= 0) {
            console.log('mapFeedData error: ', 'No feed data found');
            return false;
        }

        let ind = 1;
        _this.contents = [];
        feeds.forEach((feed, i) => {
            let username = feed.author;
            let link = feed.author + '/' + feed.permlink;
            if(type === 'trending'){
                _this.contents.push(link);
            }
            let dt = moment(feed.created).format('ddd MMM DD YYYY HH:mm A');
            feed.created_dt = dt;
            feed.body = utf8.encode(feed.body);
            feed.title = utf8.encode(feed.title);
            feed.root_title = utf8.encode(feed.root_title);
            // map valid tags start
            feed.tags = [];
            if (feed.json_metadata) {
                let metadata = JSON.parse(feed.json_metadata);
                if (metadata.tags && metadata.tags.length > 0) {
                    let valid_tags = [];
                    metadata.tags.forEach(tag => {
                        if (tag !== "") {
                            valid_tags.push(tag.replace('#',''));
                        }
                    });
                    feed.tags = valid_tags;
                }
            } // map valid tags end

            steemapi.get_active_votes(feed.author, feed.permlink, (result) => {
                if (result.status !== 200) {
                    console.log('mapFeedData error: get_active_votes', api_err_msg);
                }

                if (result.count > 0) {
                    feed.active_votes = result.data;
                }

                // map voter count start
                feed.voter_counter = 0;
                if (feed.active_votes.length > 0) {
                    let votes = [];
                    feed.active_votes.forEach(vote => {
                        if (parseInt(vote.rshares) > 0) {
                            votes.push(vote);
                        }
                        feed.voter_counter = votes.length;
                    });
                } // map voter count end

                feed.replies = [];
                feed.replies_permlinks = [];
                feed.rebloggers = [];
                steemapi.get_content_replies(feed.author, feed.permlink, (result) => {
                    if (result.status !== 200) {
                        console.log('mapFeedData error: get_content_replies', result);
                    }

                    if (result.count > 0) {
                        result.data.forEach((reply) => {
                            let reply_author = reply.author;
                            reply.author_accounts = [];
                            if (_this.unique_profile[reply_author] !== undefined) {
                                reply.author_accounts = _this.unique_profile[reply_author];
                            } else {
                                UsersModel.get_user(reply_author, (result) => {
                                    if (result) {
                                        _this.unique_profile[reply_author] = JSON.parse(result.metadata);
                                        reply.author_accounts = _this.unique_profile[reply_author];
                                    } else {
                                        repository().get_user_info(reply_author,(result) => {
                                            if(result){
                                                _this.unique_profile[reply_author] = result;
                                                reply.author_accounts = _this.unique_profile[reply_author];
                                            }
                                        });
                                    }
                                });
                            }
                            let rurl = reply_author +'/'+reply.permlink;
                            feed.replies_permlinks.push(rurl);
                        });
                        feed.replies = result.data;
                    }

                    feed.replies_count = result.count;
                    steemapi.get_rebloggers(feed.author, feed.permlink, (result1) => {
                        if (result1.status !== 200) {
                            console.log('mapFeedData error: get_rebloggers ', result1.data);
                        }

                        feed.reblog_count = result1.count;
                        if (result1.count > 0) {
                            feed.rebloggers = result1.data;
                        }
                        if (_this.unique_profile[username] !== undefined) {
                            feed.author_accounts = _this.unique_profile[username];
                            _this.saveAllFeeds(feeds, type, ind); 
                        }else{
                            repository().get_user_info(username,(account) => {
                                if(account){
                                    _this.unique_profile[username] = account;
                                    feed.author_accounts = account;
                                    _this.saveAllFeeds(feeds, type, ind); 
                                }else{
                                    console.log(username, ' is undefined');
                                }
                            });
                        }
                        ind++;
                    });
                });
            });
        });
    },

    saveAllFeeds: (feeds, type,index) => {
        if (type === 'latest') {
            if (index === _this.latest_feed_count) {
                let ind = 0;
                feeds.forEach(feed => {
                    if(feed.author_accounts !== undefined){
                        _this.saveFeed(feed,feed.replies);
                    }
                    ind++;
                    if(ind === feeds.length){
                        console.log('Saved latest feeds');
                        if(_this.trending_feed_count > 0){
                            _this.setFeedRank()
                        }
                    }
                });
            }
        } 
    },


    saveFeed: (feed,replies) => {
        let link = feed.author + '/' + feed.permlink;
        let content = feed;
        content.replies = [];
        let params = {
            url: link,
            username: feed.author,
            content: JSON.stringify(content),
            replies: JSON.stringify(feed.replies_permlinks),
            voters: JSON.stringify(feed.active_votes),
            rebloggers: JSON.stringify(feed.rebloggers),
            post_created: feed.created,
            replies_count: feed.replies_count,
            reblog_count: feed.reblog_count,
            voter_count: feed.voter_counter,
            parent_url: null,
            parent_author: null,
            parent_permlink: null,
            is_comment: 0
        };

        FeedsModel.check_if_exist(link, (result) => {
            if(!result){
                FeedsModel.insert(params, (inserted) => {
                    if (!inserted) {
                        console.log('Content ' + link + ' failed to save');
                    }else{
                        console.log('Content ' + link + ' successfully saved');
                        _this.saveComments(replies);
                    }
                });
            }else{
                FeedsModel.get_feed(link, (result2) => {
                    if (result2) {
                        if(feed.voter_counter === 0){
                            params.voter_count = result2.voter_counter;
                            params.voters = JSON.stringify(result2.voters);
                        }

                        if(feed.replies_count === 0){
                            params.replies_count = result2.replies_count;
                            params.replies = JSON.stringify(result2.replies);
                        }

                        if(feed.reblog_count === 0){
                            params.reblog_count = result2.reblog_count;
                            params.rebloggers = JSON.stringify(result2.rebloggers);
                        }
                        FeedsModel.update(result2.id, params, (updated) => {
                            if (!updated) {
                                console.log('Content ' + link + ' failed to update');
                            }else{
                                console.log('Content ' + link + ' successfully updated');
                                _this.saveComments(replies);
                            }
                        });
                    }
                });
            }
        });
    },

    saveComments: (all_replies) => {
        if(all_replies.length > 0){
            all_replies.forEach(replies => {
                let rcontent = replies;
                rcontent.body = utf8.encode(rcontent.body);
                rcontent.title = utf8.encode(rcontent.title);
                rcontent.root_title = utf8.encode(rcontent.root_title);
                let rurl = replies.author +'/'+ replies.permlink;
                let params = {
                    url: rurl,
                    username: replies.author,
                    content: JSON.stringify(rcontent),
                    replies: JSON.stringify(replies.replies),
                    voters: JSON.stringify(replies.active_votes),
                    rebloggers: JSON.stringify(replies.reblogged_by),
                    post_created: replies.created,
                    replies_count: replies.replies.length,
                    reblog_count: replies.reblogged_by.length,
                    voter_count: replies.active_votes.length,
                    is_comment: 1,
                    parent_url: replies.parent_author +'/'+ replies.parent_permlink,
                    parent_author: replies.parent_author,
                    parent_permlink: replies.parent_permlink,
                };

                steemapi.get_active_votes(replies.author, replies.permlink, (result) => {
                    if (result.status === 200 && result.count > 0) {
                        replies.active_votes = result.data;
                    }
    
                    replies.voter_counter = 0;
                    if (replies.active_votes.length > 0) {
                        let votes = [];
                        replies.active_votes.forEach(vote => {
                            if (parseInt(vote.rshares) > 0) {
                                votes.push(vote);
                            }
                            replies.voter_counter = votes.length;
                        });
                    }
                    params.voters = JSON.stringify(replies.active_votes);
                    params.voter_count = replies.voter_counter;
                    steemapi.get_rebloggers(replies.author, replies.permlink, (result1) => {
                        let rebloggers = [];
                        if(result1.status === 200 && result1.count > 0){
                            rebloggers = result1.data;
                        }
                        params.rebloggers = JSON.stringify(rebloggers);
                        params.reblog_count = rebloggers.length;
                        FeedsModel.get_feed(rurl, (res2) => {
                            if(res2){
                                if(replies.voter_counter === 0){
                                    params.voter_count = res2.voter_counter;
                                    params.voters = JSON.stringify(res2.voters);
                                }
                                FeedsModel.update(res2.id, params, (updated) => {
                                    if (!updated) {
                                        console.log('Content comment ' + rurl + ' failed to update');
                                    }else{
                                        console.log('Content comment ' + rurl + ' successfully updated');
                                        _this.saveSubreplies(replies.author, replies.permlink);
                                    }
                                });
                            }else{
                                FeedsModel.insert(params, (updated) => {
                                    if (!updated) {
                                        console.log('Content comment ' + rurl + ' failed to save');
                                    }else{
                                        console.log('Content comment ' + rurl + ' successfully saved');
                                        _this.saveSubreplies(replies.author, replies.permlink);
                                    }
                                });
                            }
                        });
                    });

                });
            });
        }
    },

    saveSubreplies: (parent_author,parent_permlink) => {
        let link = parent_author +'/'+ parent_permlink
        steemapi.get_content_replies(parent_author, parent_permlink, (result) => {
            if (result.status !== 200) {
                console.log('saveSubreplies error: get_content_replies', result);
            }
            let subreplies = [];
            if (result.count > 0) {
                result.data.forEach((reply) => {
                    let reply_author = reply.author;
                    reply.author_accounts = [];
                    if (_this.unique_profile[reply_author] !== undefined) {
                        reply.author_accounts = _this.unique_profile[reply_author];
                    } else {
                        UsersModel.get_user(reply_author, (result) => {
                            if (result) {
                                _this.unique_profile[reply_author] = JSON.parse(result.metadata);
                                reply.author_accounts = _this.unique_profile[reply_author];
                            } else {
                                repository().get_user_info(reply_author,(result) => {
                                    if(result){
                                        _this.unique_profile[reply_author] = result;
                                        reply.author_accounts = _this.unique_profile[reply_author];
                                    }
                                });
                            }
                        });
                    }
                });
                subreplies = result.data;
                FeedsModel.update_replies_counter(link,result.count,(updated) => {
                    if(updated){
                        _this.saveComments(subreplies);
                    }
                });
            }
        });
    },

    setFeedRank: () => {
        if(_this.contents && _this.contents.length > 0){
            _this.contents.forEach((content,i) => {
                let rank = parseInt(i)+1;
                FeedsModel.check_if_exist(content,(exists) => {
                    if(exists){
                        FeedsModel.set_feed_rank(content,rank,(res) => {
                            if(!res){
                                console.log('Failed to set feed rank of ',content);
                            }
                        });
                    }else{
                        _this.getContent(content);
                    }
                });
                
            });
        }
    },

    getContent:($url) => {
        let links = $url.split('/');
        steemapi.get_content(links[0],links[1],(result) => {
            if(result.status === 200 && result.data){
                let feed = result.data;
                let username = feed.author;
                let link = feed.author + '/' + feed.permlink;
                console.log(link,'saving content');
                let dt = moment(feed.created).format('ddd MMM DD YYYY HH:mm A');
                feed.created_dt = dt;
                feed.body = utf8.encode(feed.body);
                feed.title = utf8.encode(feed.title);
                feed.root_title = utf8.encode(feed.root_title);
                // map valid tags start
                feed.tags = [];
                if (feed.json_metadata) {
                    let metadata = JSON.parse(feed.json_metadata);
                    if (metadata.tags && metadata.tags.length > 0) {
                        let valid_tags = [];
                        metadata.tags.forEach(tag => {
                            if (tag !== "") {
                                valid_tags.push(tag.replace('#',''));
                            }
                        });
                        feed.tags = valid_tags;
                    }
                } // map valid tags end
    
                steemapi.get_active_votes(feed.author, feed.permlink, (result) => {
                    if (result.status !== 200) {
                        console.log('mapFeedData error: get_active_votes', api_err_msg);
                    }
    
                    if (result.count > 0) {
                        feed.active_votes = result.data;
                    }
    
                    // map voter count start
                    feed.voter_counter = 0;
                    if (feed.active_votes.length > 0) {
                        let votes = [];
                        feed.active_votes.forEach(vote => {
                            if (parseInt(vote.rshares) > 0) {
                                votes.push(vote);
                            }
                            feed.voter_counter = votes.length;
                        });
                    } // map voter count end
    
                    feed.replies = [];
                    feed.replies_permlinks = [];
                    feed.rebloggers = [];
                    steemapi.get_content_replies(feed.author, feed.permlink, (result) => {
                        if (result.status !== 200) {
                            console.log('mapFeedData error: get_content_replies', result);
                        }
    
                        if (result.count > 0) {
                            result.data.forEach((reply) => {
                                let reply_author = reply.author;
                                reply.author_accounts = [];
                                if (_this.unique_profile[reply_author] !== undefined) {
                                    reply.author_accounts = _this.unique_profile[reply_author];
                                } else {
                                    UsersModel.get_user(reply_author, (result) => {
                                        if (result) {
                                            _this.unique_profile[reply_author] = JSON.parse(result.metadata);
                                            reply.author_accounts = _this.unique_profile[reply_author];
                                        } else {
                                            repository().get_user_info(reply_author,(result) => {
                                                if(result){
                                                    _this.unique_profile[reply_author] = result;
                                                    reply.author_accounts = _this.unique_profile[reply_author];
                                                }
                                            });
                                        }
                                    });
                                }
                                let rurl = reply_author +'/'+reply.permlink;
                                feed.replies_permlinks.push(rurl);
                            });
                            feed.replies = result.data;
                        }
    
                        feed.replies_count = result.count;
                        steemapi.get_rebloggers(feed.author, feed.permlink, (result1) => {
                            if (result1.status !== 200) {
                                console.log('mapFeedData error: get_rebloggers ', result1.data);
                            }
    
                            feed.reblog_count = result1.count;
                            if (result1.count > 0) {
                                feed.rebloggers = result1.data;
                            }
                            if (_this.unique_profile[username] !== undefined) {
                                feed.author_accounts = _this.unique_profile[username];
                                _this.saveFeed(feed,feed.replies);
                            }else{
                                repository().get_user_info(username,(account) => {
                                    if(account){
                                        _this.unique_profile[username] = account;
                                        feed.author_accounts = account;
                                        _this.saveFeed(feed,feed.replies);
                                    }else{
                                        console.log(username, ' is undefined');
                                    }
                                });
                            }
                        });
                    });
                });
            }
        });
    },

    getTrendingTags: () => {
        steemapi.get_trending_tags(null, 100, (result) => {
            if (result.status !== 200) {
                console.log('getTrendingTags error:', api_err_msg);
                return false;
            }
            
            let tags = [];
            if (result.count > 0) {
                let trending_tags = result.data;
                trending_tags.forEach(row => {
                    let tag = row.name;
                    if (!tag.includes('hive-')) {
                        tags.push(row);
                    }
                });
                client.set('trending_tags', JSON.stringify(tags));
                console.log('Saved trending tags');
                _this.getWitnesses();
            }
        });
    },

    getWitnesses: () => {
        let dir = 'cache/witnesses.json';
        if (util.checkFileExists(dir) && fs.readFileSync(dir, 'utf8')) {
            if (util.isValidJson(fs.readFileSync(dir, 'utf8'))) {
                const userJson = JSON.parse(fs.readFileSync(dir, 'utf8'));
                if (userJson && userJson.users) {
                    let usernames = userJson.users;
                    if (usernames.length > 0) {
                        steemapi.get_multiple_account_info(usernames, (result) => {
                            if (result.count > 0) {
                                let accounts = result.data;
                                accounts.forEach(account => {
                                    let username = account.name;
                                    repository().user_account_mapper(account,(mapped) => {
                                        let params = {};
                                        mapped.vests = account.vesting_shares;
                                        params.username = username;
                                        params.metadata = JSON.stringify(mapped);
                                        steemapi.get_witness_by_account(username, (res) => {
                                            if (res.status === 200) {
                                                params.witness_info = JSON.stringify(res.data);
                                                WitnessModel.check_if_exist(username, (exists) => {
                                                    if (!exists) {
                                                        params.is_supported = 1;
                                                        WitnessModel.insert(params, (inserted) => {
                                                            if (!inserted) {
                                                                console.log('Failed to save witness: ',username);
                                                            }else{
                                                                console.log('Successfully saved witness: ',username);
                                                            }
                                                        });
                                                    } 
                                                    else {
                                                        WitnessModel.get_witness(username, (wit) => {
                                                            if (wit) {
                                                                WitnessModel.update(wit.id,params,(updated) => {
                                                                    if(!updated){
                                                                        console.log('Failed to update witness: ',username);
                                                                    }else{
                                                                        console.log('Successfully updated witness: ',username);
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    });
                                });
                            }
                        });
                    }
                }
            }
        }
    },
};

function steemfeedfetcher() {
    return _this;
}

module.exports = steemfeedfetcher;