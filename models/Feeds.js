const _Model = require('./model')();
const moment = require('moment');
const util = require('../modules/util');
const client = require('../modules/redisconnect');
const UserModel = require('./Users'); 
const utf8 = require('utf8');

var _this = {
    Users: () => {
        return UserModel();
    },

    build: () =>
    {
        _Model.table = 'feeds';
        return _Model;
    },

    insert : ($data, cb) => {
        _this.build().set('username',$data.username)
                     .set('url',$data.url)
                     .set('content', $data.content)
                     .set('replies', $data.replies)
                     .set('voters', $data.voters)
                     .set('post_created', $data.post_created)
                     .set('replies_count', $data.replies_count)
                     .set('voter_count', $data.voter_count)
                     .set('reblog_count', $data.reblog_count)
                     .set('is_comment', $data.is_comment)
                     .set('parent_url', $data.parent_url)
                     .set('parent_author', $data.parent_author)
                     .set('parent_permlink', $data.parent_permlink)
                     .set('rebloggers', $data.rebloggers).insert((insertedUsers) => 
        {   
            if(insertedUsers){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    update : ($id,$data, cb) => {
        _this.build().set('content', $data.content)
                     .set('replies', $data.replies)
                     .set('voters', $data.voters)
                     .set('post_created', $data.post_created)
                     .set('replies_count', $data.replies_count)
                     .set('voter_count', $data.voter_count)
                     .set('reblog_count', $data.reblog_count)
                     .set('is_comment', $data.is_comment)
                     .set('parent_url', $data.parent_url)
                     .set('parent_author', $data.parent_author)
                     .set('parent_permlink', $data.parent_permlink)
                     .set('rebloggers', $data.rebloggers).update($id,(result) => 
        {   
            if(result){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    set_feed_rank: ($permlink,$rank,cb) => {
        _this.reset_ranking($rank, (reset) => {
            if(reset){
                _this.get_feed($permlink,(feed) => {
                    if(feed){
                        _this.build().set('rank', $rank).update(feed.id,(result) => 
                        {   
                            if(result){
                                cb(true);
                            }else{
                                cb(false);
                            }
                        });
                    }else{
                        cb(false);
                    }
                });
            }else{
                cb(false);
            }
        });
    },

    reset_ranking: ($rank,cb) => {
        _this.build().where('rank', $rank).first((feed) => 
        {   
            if(feed){
                _this.build().set('rank', 0).update(feed.id,(result) => 
                {   
                    if(result){
                        cb(true);
                    }else{
                        cb(false);
                    }
                });
            }else{
                cb(true);
            }
        });
    },

    update_vote_counter: ($url,$active_votes,$is_upvote=1,cb) => {
        _this.get_feed($url,(feed) => {
            if(feed){
                let counter = 0;
                if($is_upvote==1){
                    counter = parseInt(feed.voter_count) + 1;
                }else{
                    if(parseInt(feed.voter_count) > 0){
                        counter = parseInt(feed.voter_count) - 1;
                    }else{
                        counter = 0;
                    }
                }
                _this.build().set('voter_count', counter).set('voters',$active_votes).update(feed.id,(result) => 
                {   
                    if(result){
                        cb(true);
                    }else{
                        cb(false);
                    }
                });
            }else{
                cb(false);
            }
        });
    },

    update_reblog_counter: ($url,$reblogs,cb) => {
        _this.get_feed($url,(feed) => {
            if(feed){
                let counter = parseInt(feed.reblog_count) + 1;
                _this.build().set('reblog_count', counter).set('rebloggers',$reblogs).update(feed.id,(result) => 
                {   
                    if(result){
                        cb(true);
                    }else{
                        cb(false);
                    }
                });
            }else{
                cb(false);
            }
        });
    },

    addup_replies_counter: ($url,cb) => {
        _this.get_feed($url,(feed) => {
            if(feed){
                let counter = parseInt(feed.replies_count) + 1;
                _this.build().set('replies_count', counter).update(feed.id,(result) => 
                {   
                    if(result){
                        cb(true);
                    }else{
                        cb(false);
                    }
                });
            }else{
                cb(false);
            }
        });
    },

    update_replies_counter: ($url,$counter,cb) => {
        _this.get_feed($url,(feed) => {
            if(feed){
                _this.build().set('replies_count', $counter).update(feed.id,(result) => 
                {   
                    if(result){
                        cb(true);
                    }else{
                        cb(false);
                    }
                });
            }else{
                cb(false);
            }
        });
    },

    update_delete_status: ($url,$status,cb) => {
        _this.get_feed($url,(feed) => {
            if(feed){
                _this.build().set('is_deleted', $status).update(feed.id,(result) => 
                {   
                    if(result){
                        cb(true);
                    }else{
                        cb(false);
                    }
                });
            }else{
                cb(false);
            }
        });
    },
    
    check_if_exist : ($url,cb) => {
        _this.build().where('url',$url).where('is_deleted',0).first((exists) => 
        {
            if(exists){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    get_feed : ($url, cb) => {
        _this.build().where('url', $url).where('is_deleted',0).first((feed) => 
        {
            if(feed){
                _this.mapper(feed,(result) => {
                    cb(result);
                });
            }else{
                cb(null);
            }
        });
    },

    get_mapped_feed : ($url, cb) => {
        _this.build().where('url', $url).where('is_deleted',0).first((feed) => 
        {
            if(feed){
                _this.mapper(feed,(result) => {
                    _this.Users().get_user(result.author,(user) => {
                        if(user && user.metadata){
                            let metadata = JSON.parse(user.metadata);
                            result.author_accounts = metadata;
                        }
                        cb(result);
                    });
                },true);
            }else{
                cb(null);
            }
        });
    },

    get_all : (cb) => {
        _this.build().where('is_comment', 0).where('is_deleted',0).groupBy('url').orderBy('post_created','DESC').get((feeds) => 
        {
            _this.mapped_feeds(feeds,(result) => {
                cb(result);
            })
        });
    },

    get_all_feeds_by_following : (username,cb) => {
        _this.build().where('is_comment', 0).where('is_deleted',0).groupBy('url').orderBy('post_created','DESC').get((feeds) => 
        {
            let all_feeds = [];
            _this.mapped_feeds(feeds,(result) => {
                if(result && result.length > 0){
                    let ind = 0;
                    result.forEach(feed => {
                        _this.check_following(username,feed.author,(is_following) => {
                            if(username === feed.author){
                                all_feeds.push(feed);
                            }else{
                                if(is_following){
                                    all_feeds.push(feed);
                                }
                            }
                            ind++;
                            if(ind === result.length){
                                cb(all_feeds);
                            }
                        });
                    });
                }else{
                    cb(all_feeds);
                }
            })
        });
    },

    get_all_limit : ($limit, $offset, cb) => {
        _this.build().where('is_comment', 0).where('is_deleted',0).groupBy('url').orderBy('post_created','DESC').get((feeds) => 
        {
            _this.mapped_feeds(feeds,(result) => {
                cb(result);
            })
        },$limit,$offset);
    },

    count_by_latest: (cb) => {
        _this.build().where('is_comment', 0).where('is_deleted',0).groupBy('url').get((feeds) => 
        {
            let count = 0;
            if(feeds && feeds.length > 0){
                count = feeds.length;
            }
            cb(count);
        });
    },

    get_all_by_rank : ($limit, $offset, cb) => {
        _this.build().where('is_comment', 0).where('is_deleted',0).where('rank','!=',0).groupBy('url').orderBy('rank','ASC').get((feeds) => 
        {
            _this.mapped_feeds(feeds,(result) => {
                cb(result);
            })
        },$limit,$offset);
    },

    count_by_trending: (cb) => {
        _this.build().where('is_comment', 0).where('is_deleted',0).where('rank','!=',0).groupBy('url').get((feeds) => 
        {
            let count = 0;
            if(feeds && feeds.length > 0){
                count = feeds.length;
            }
            cb(count);
        });
    },

    get_replies : ($username, cb) => {
        _this.build().where('username',$username).where('is_deleted',0).where('is_comment',1).groupBy('url').orderBy('post_created','DESC').get((feeds) => 
        {
            _this.mapped_feeds(feeds,(result) => {
                cb(result);
            })
        });
    },

    get_replies_by_parent_url : ($parent_url, cb) => {
        _this.build().where('parent_url',$parent_url).where('is_deleted',0).where('is_comment',1).groupBy('url').orderBy('post_created','DESC').get((feeds) => 
        {
            _this.mapped_feeds(feeds,(result) => {
                cb(result);
            })
        });
    },

    get_mentions : ($username,$limit,$offset,cb) => {
        _this.build().where('parent_author',$username).where('is_deleted',0).where('is_comment',1).groupBy('url').orderBy('post_created','DESC').get((feeds) => 
        {
            _this.mapped_feeds(feeds,(result) => {
                cb(result);
            })
        },$limit,$offset);
    },

    get_user_blogs: ($username,cb) => {
        _this.build().where('username',$username).where('is_comment',0).where('is_deleted',0).groupBy('url').orderBy('post_created','DESC').get((feeds) => 
        {
            _this.mapped_feeds(feeds,(result) => {
                if(result.length > 0){
                    _this.get_user_reblogs($username,(reblogs) => {
                        if(reblogs.length > 0){
                            reblogs.forEach(reblog =>{
                                result.push(reblog);
                            });
                        }
                        result = result.sort(function (a, b) {
                            return b.post_created - a.post_created
                        });

                        cb(result);
                    });
                }else{
                    cb(result);
                }
               
            })
        });
    },

    count_user_mentions: ($username,cb) => {
        _this.build().where('parent_author',$username).where('is_comment',1).where('is_deleted',0).count((count) => 
        {   
            cb(count);
        });
    },

    count_user_comments: ($username,cb) => {
        _this.build().where('username',$username).where('is_comment',1).where('is_deleted',0).count((count) => 
        {   
            cb(count);
        });
    },

    count_user_blogs: ($username,cb) => {
        _this.build().where('username',$username).where('is_comment',0).where('is_deleted',0).count((count) => 
        {   
            _this.count_user_reblogs($username,(count1) => {
                let counter = count + count1;
                cb(counter);
            });
        });
    },

    count_user_reblogs: ($username,cb) =>{
        _this.build().where('username',$username).where('rebloggers','!=','[]').where('is_comment',0).where('is_deleted',0).groupBy('url').get((feeds) => 
        {
            
            let reblogs = [];
            if(feeds.length > 0){
                feeds.forEach(feed => {
                    let rebloggers = JSON.parse(feed.rebloggers);
                    rebloggers.forEach(reblog => {
                        if(reblog === $username){
                            reblogs.push(feed);
                        }
                    });
                });
            }
            cb(reblogs.length);
        });
    },


    get_user_reblogs: ($username,cb) =>{
        _this.build().where('rebloggers','!=','[]').where('is_comment',0).where('is_deleted',0).groupBy('url').get((feeds) => 
        {
            let reblogs = [];
            if(feeds.length > 0){
                feeds.forEach(feed => {
                    let rebloggers = JSON.parse(feed.rebloggers);
                    if(rebloggers && rebloggers.length > 0){
                        rebloggers.forEach(reblog => {
                            if(reblog === $username){
                                reblogs.push(feed);
                            }
                        });
                    }
                });
            }

            _this.mapped_feeds(reblogs,(result) => {
                cb(result);
            })

        });
    },

    get_voting_weight: ($username,$url,cb) =>{
        _this.build().where('url',$url).where('is_deleted',0).first((feed) => 
        {
            let voting_weight = 0;
            if(feed){
                let voters = JSON.parse(feed.voters);
                if(voters.length > 0){
                    voters.forEach(vote => {
                        if(vote.voter === $username){
                          voting_weight = vote.percent;
                        }
                    });
                }
            }
            cb(voting_weight);
        });
    },

    search_feed_by_user: ($q,$limit,$offset, cb) => {
        _this.build().where('username', 'LIKE', '%'+$q+'%').where('is_comment',0).where('is_deleted',0).groupBy('url').orderBy('post_created','DESC').get((feeds) => 
        {
            _this.mapped_feeds(feeds,(result) => {
                cb(result);
            })
           
        },$limit,$offset);
    },

    count_post_per_day: ($username, cb) => {
        let total_post = 0;
        let date_now = moment().format('YYYY-MM-DD');
        _this.build().raw(`SELECT COUNT(*) AS total_post FROM feeds WHERE username=? AND DATE(post_created) = ? AND is_comment=? AND is_deleted=?`,[$username,date_now,0,0],(result) => {
            if(result && result.length > 0 ){
                total_post = result[0].total_post;
            }
            cb(total_post);
        });
    },

    mapped_feeds: (feeds,cb) => {
        let all_feeds = [];
        if(feeds && feeds.length > 0){
            let ind = 0;
            feeds.forEach(feed => {
                _this.mapper(feed,(result) => {
                    _this.Users().get_user(result.author,(user) => {
                        if(user && user.metadata){
                            let metadata = JSON.parse(user.metadata);
                            result.author_accounts = metadata;
                        }
                        all_feeds.push(result);
                        ind++;
                        if(ind === feeds.length){
                            let filtered = util.filterToCharLimitUtf8Decode(all_feeds);
                            cb(filtered);
                        }
                    });
                },true);
            });
        }else{
            cb(all_feeds);
        }
    },

    mapper: (feed, cb, is_fe=false) => {
        let content = JSON.parse(feed.content);
        let post_created = moment.utc(content.created).local();
        let cashout_time = content.cashout_time ? moment.utc(content.cashout_time) : '';
        let datenow = moment().utc();
        feed.post_created = post_created;
        feed.author = feed.username;
        feed.replies = feed.replies ? JSON.parse(feed.replies) : [];
        feed.voters = feed.voters ? JSON.parse(feed.voters) : [];
        feed.rebloggers = feed.rebloggers ? JSON.parse(feed.rebloggers) : [];
        feed.post_id = content.post_id ? content.post_id : '';
        feed.permlink = content.permlink ? content.permlink : '';
        feed.category = content.category ? content.category: '';
        feed.title = content.title ? content.title : '';
        feed.body = content.body ? content.body : '';
        feed.created = post_created;
        feed.active_votes = feed.voters;
        feed.url = content.url ? content.url : '';
        feed.author_accounts = content.author_accounts ? content.author_accounts : {};
        feed.voter_counter = feed.voter_count;
        feed.root_author = content.root_author ? content.root_author : '';
        feed.root_permlink = content.root_permlink ? content.root_permlink : '';
        feed.created_dt = post_created.format('ddd MMM DD YYYY hh:mm A');
        feed.pending_payout_value = content.pending_payout_value ? parseFloat(content.pending_payout_value) : 0;
        feed.payout_in_days = cashout_time ? Math.round(cashout_time.diff(datenow,'days',true)) : 0;
        feed.tags = [];
        if(content.tags && content.tags.length > 0){
            feed.tags = util.removeSpecificTagFromArray(content.tags,'hlix');
        }
        feed.percent_steem_dollars = content.percent_steem_dollars ? parseFloat(content.percent_steem_dollars) : 0;
        feed.max_accepted_payout = content.max_accepted_payout ? parseFloat(content.max_accepted_payout) : 0;
        feed.post_has_rewards = (parseFloat(content.max_accepted_payout) > 0);
        if(is_fe){
            let preview_link =  util.getContentLinkToPreview(utf8.decode(content.body));
            if(preview_link){
                feed.preview_link = preview_link;
            }
        }
        
        cb(feed);
       
    },  

    check_following: (follower, following, cb) => {
        let is_follower = false;
        client.get('following_' + follower, (err, data) => {
            if (!err) {
                let followingjson = JSON.parse(data);
                if (followingjson && followingjson.length > 0) {
                    followingjson.forEach(val => {
                        if (val.username === following) {
                            is_follower = true;
                        }
                    });
                }
            }
            cb(is_follower);
        });
    }
};

function Feeds()
{
    return _this;
}

module.exports = Feeds;