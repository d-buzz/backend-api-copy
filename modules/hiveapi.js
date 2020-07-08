const fetch = require('node-fetch');
const Bluebird = require('bluebird');
const ENV = require('../env');
const util = require('./util');
fetch.Promise = Bluebird;
const alternate_endpoint = 'https://api.hive.blog';

module.exports = {
     get_account_info: (author,cb) => {
        let method = 'condenser_api.get_accounts';
        let params = `[["${author}"]]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_multiple_account_info: (authors,cb) => {
        let authorparse = JSON.stringify(authors);
        let method = 'condenser_api.get_accounts';
        let params = `[${authorparse}]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_account_history: (username, start, limit,cb) => {
        let method = 'condenser_api.get_account_history';
        let params = `["${username}", ${start}, ${limit}]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_feeds: (type,cb) => {
        let method = 'bridge.get_ranked_posts';
        let params = `{"sort":"${type}","tag":"${ENV.primary_tag}","observer":""}`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_content: (author,permlink,cb) => {
        let method = 'condenser_api.get_content';
        let params = `["${author}", "${permlink}"]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_feeds_by_created: (query,cb) => {
        let method = 'condenser_api.get_discussions_by_created';
        let params = `[{"tag":"${query.tag}","limit":${query.limit}}]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_feeds_by_trending: (query,cb) => {
        let method = 'condenser_api.get_discussions_by_trending';
        let params = `[{"tag":"${query.tag}","limit":${query.limit}}]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_feeds_by_blog: (query,cb) => {
        let method = 'condenser_api.get_discussions_by_blog';
        let params = `[{"tag":"${query.tag}","limit":${query.limit}}]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_user_feed: (query,cb) => {
        let method = 'condenser_api.get_discussions_by_feed';
        let params = `[{"tag":"${query.tag}","limit":${query.limit}}]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_trending_tags: (tag,limit,cb) => {
        let method = 'condenser_api.get_trending_tags';
        let params = `[null,${limit}]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_content_replies: (author,permlink,cb) => {
        let method = 'condenser_api.get_content_replies';
        let params = `["${author}", "${permlink}"]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    count_followers: (author,cb) => {
        let method = 'condenser_api.get_follow_count';
        let params = `["${author}"]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_subscriptions: (author,cb) => {
        let method = 'bridge.list_all_subscriptions';
        let params = `{"account":"${author}"}`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_rebloggers: (author,permlink,cb) => {
        let method = 'follow_api.get_reblogged_by';
        let params = `{"author":"${author}","permlink":"${permlink}"}`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_active_votes : (author,permlink,cb) => {
        let method = 'condenser_api.get_active_votes';
        let params = `["${author}", "${permlink}"]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_followers : (author,limit,cb) => {
        let method = 'condenser_api.get_followers';
        let params = `["${author}",null,"blog",${limit}]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_following : (author,limit,cb) => {
        let method = 'condenser_api.get_following';
        let params = `["${author}",null,"blog",${limit}]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_notifications : (author,limit,cb) => {
        let method = 'bridge.account_notifications';
        let params = `{"account":"${author}","limit":${limit}}`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    lookup_accounts : (q,limit, cb) => {
        let method = 'condenser_api.lookup_accounts';
        let params = `["${q}",${limit}]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    lookup_witnesses : (q,limit, cb) => {
        let method = 'condenser_api.lookup_witness_accounts';
        let params = `["${q}",${limit}]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_witness_by_account : (account, cb) => {
        let method = 'condenser_api.get_witness_by_account';
        let params = `["${account}"]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },

    get_active_witnesses : (cb) => {
        let method = 'condenser_api.get_active_witnesses';
        let params = `[]`;
        module.exports.jsonrpcFetch(method,params,(result) => {
            cb(result);
        });
    },
    
    jsonrpcFetch : async (method,params,cb,target_api='') => {
        try {
            let targetApi = ENV.target_api;
            if(target_api!==''){
                targetApi = target_api;
            }
            await fetch(targetApi, {
                body: `{"jsonrpc":"2.0", "method":"${method}", "params":${params},"id":1}`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                method: 'POST',
            })
                .then(res => res.text())
                .then((res) => {
                    if(util.isValidJson(res)){
                        cb(JSON.parse(res));
                    }else{
                        cb('503 Service Temporarily Unavailable');
                    }
                });
        }catch(error){
            cb(error);
        }
    }
};