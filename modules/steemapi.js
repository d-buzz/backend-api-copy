const steem = require('./hiveapiconnect');
const util = require('../modules/util');
const ENV = require('./../env');
const hiveapi = require('./hiveapi');
const interval = ENV.timeout_interval;

module.exports = {
    // Gets a set of latest posts from specific authors feed (who they follow)
    // Parameters: tag: string; limit: int
    get_user_feed: (query, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_user_feed(query,(result) => {
                    if (result.result) {
                        let res = util.filterToSpecificTag(result.result);
                        callback({ data: res, status: 200 });
                    } else {
                        callback({ data: result, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    // Gets a set of latest posts from specific author
    get_user_blog: (query, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_feeds_by_blog(query, (result) => {
                    if (result.result) {
                        let filtered = util.filterToCharLimit(result.result);
                        callback({ data: filtered, count: filtered.length, status: 200 });
                    } else {
                        callback({ data: result, count:0, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    // Returns a history of all operations for a given account. 
    // Parameters: account:string; start:int; limit:int up to 10000
    get_account_transactions: (username, start, limit, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_account_history(username, start, limit, (result) => {
                    if (result.result) {
                        callback({ data: result.result, status: 200 });
                    } else {
                        callback({ data: result, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    // Returns the specific content (post and comment/s). 
    // Parameters: url:string
    get_content: (author,permlink, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_content(author,permlink, (result) => {
                    if (result.result) {
                        callback({ data: result.result, status: 200 });
                    } else {
                        callback({ data: result, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    get_content_replies: (author,permlink, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_content_replies(author,permlink, (result) => {
                    if (result.result) {
                        let filtered = util.filterToCharLimit(result.result);
                        callback({ data: filtered, count: filtered.length,status: 200 });
                    } else {
                        callback({ data: result, count:0, status: 200 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, count:0, status: 400 });
        }
    },


    // Returns the list of trending tags. 
    // Parameter: start_tag:string; limit:int up to 100
    get_trending_tags: (tag, limit, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_trending_tags(tag,limit, (result) => {
                    if (result.result) {
                        callback({ data: result.result, count: result.result.length, status: 200 });
                    } else {
                        callback({ data: result, count:0, status: 200 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    // Returns a list of discussions by trending.
    get_trending_posts: (query, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_feeds_by_trending(query, (result) => {
                    if (result.result) {
                        let filtered = util.filterToCharLimit(result.result);
                        callback({ data: filtered, count: filtered.length,status: 200 });
                    } else {
                        callback({ data: result, count:0, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    // Returns a list of discussions by created.
    get_latest_posts: (query, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_feeds_by_created(query, (result) => {
                    if (result.result) {
                        let filtered = util.filterToCharLimit(result.result);
                        callback({ data: filtered, count: filtered.length,status: 200 });
                    } else {
                        callback({ data: result, count:0, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }

    },

    // Returns accounts, queried by name. 
    // Parameters: account:string array
    get_account_info: (account, callback) => {
        try {
            setTimeout(() => {
               hiveapi.get_account_info(account, (result) => {
                    if (result.result) {
                        callback({ data: result.result, status: 200 });
                    } else {
                        callback({ data: result, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    get_multiple_account_info: (accounts, callback) => {
        try {
            setTimeout(() => {
               hiveapi.get_multiple_account_info(accounts, (result) => {
                    if (result.result) {
                        callback({ data: result.result, count: result.result.length, status: 200 });
                    } else {
                        callback({ data: result, count:0, status: 400 });
                    }
                });
            }, 5000);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    // Returns the count of followers/following for an account. 
    // Parameters: account:string
    count_followers: (account, callback) => {
        try {
            setTimeout(() => {
                hiveapi.count_followers(account, (result) => {
                    if (result.result) {
                        callback({ data: result.result, status: 200 });
                    } else {
                        callback({ data: result, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    // Returns the list of followers for an account. 
    // Parameters: account:string; start:string (account to start from); type:string e.g.: blog; 
    // limit:int up to 1000
    get_followers: (account, limit, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_followers(account, limit, (result) => {
                    if (result.result) {
                        callback({ data: result.result, count: result.result.length, status: 200 });
                    } else {
                        callback({ data: result, count:0, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    // Returns the list of accounts that are following an account. 
    // Parameters: account:string; start:string (account to start from); type:string e.g.: blog; 
    // limit:int up to 1000
    get_following: (account, limit, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_following(account, limit, (result) => {
                    if (result.result) {
                        callback({ data: result.result, count: result.result.length, status: 200 });
                    } else {
                        callback({ data: result, count:0, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, count:0, status: 400 });
        }
    },

    // Returns a list of authors that have reblogged a post. 
    // Parameters: author:string; permlink:string
    get_rebloggers: (author, permlink, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_rebloggers(author, permlink, (result) => {
                    if (result.result) {
                        callback({ data: result.result, count: result.result.length, status: 200 });
                    } else {
                        callback({ data: result, count:0, status: 200 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, count:0, status: 400 });
        }
    },

    get_community_feeds: (type, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_feeds(type, (result) => {
                    if (result.result) {
                        callback({ data: result.result, count: result.result.length, status: 200 });
                    }else{
                        callback({ data: result, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    is_community_subscribed: (author, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_subscriptions(author, (result) => {
                    if (result.result) {
                        let subsribed = false;
                        result.result.forEach(hive => {
                            if(hive[0] === ENV.primary_tag){
                                subsribed = true;
                            }   
                        });
                        callback({ data: subsribed, status: 200 });
                    }else{
                        callback({ data: result, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    is_voter: (voter,author,permlink, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_active_votes(author,permlink, (result) => {
                    if (result.result) {
                        let is_voter = false;
                        result.result.forEach(votes => {
                            if(parseInt(votes.rshares) > 0){
                                if(votes.voter === voter){
                                    is_voter = true;
                                }   
                            }
                        });
                        callback({ data: is_voter, status: 200 });
                    }else{
                        callback({ data: result, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    get_active_votes: (author,permlink, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_active_votes(author,permlink, (result) => {
                    if (result.result) {
                        callback({ data: result.result, count: result.result.length, status: 200 });
                    }else{
                        callback({ data: result, count:0, status: 200 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, count:0, status: 400 });
        }
    },

    get_notifications: (author,limit, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_notifications(author,limit, (result) => {
                    if (result.result) {
                        callback({ data: result.result, count: result.result.length, status: 200 });
                    }else{
                        callback({ data: result, count:0, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    lookup_witnesses: (author,limit, callback) => {
        try {
            setTimeout(() => {
                hiveapi.lookup_witnesses(author,limit, (result) => {
                    if (result.result) {
                        callback({ data: result.result, count: result.result.length, status: 200 });
                    }else{
                        callback({ data: result, count:0, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    get_witness_by_account: (author, callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_witness_by_account(author, (result) => {
                    if (result.result) {
                        callback({ data: result.result, status: 200 });
                    }else{
                        callback({ data: result, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },

    get_active_witnesses: (callback) => {
        try {
            setTimeout(() => {
                hiveapi.get_active_witnesses((result) => {
                    if (result.result) {
                        callback({ data: result.result, count: result.result.length, status: 200 });
                    }else{
                        callback({ data: result, count:0, status: 400 });
                    }
                });
            }, interval);
        } catch (error) {
            callback({ data: error, status: 400 });
        }
    },
};