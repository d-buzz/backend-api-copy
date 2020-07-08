const ModelModule = require('../models/module');
const FeedsModel = ModelModule.Feeds();
const UsersModel = ModelModule.Users();
const TwitterModel = ModelModule.UserTwitterVerify();
const util = require('../modules/util');
const ENV = require('../env');
const utf8 = require('utf8');
const hive = require('../modules/hiveapiconnect');
const steem = require('../modules/hivesignerconnect');
const wait = require('wait.for');
const steemapi = require('./steemapi');
const client = require('./redisconnect');
const metaget = require('metaget');
const moment = require('moment');

var _this = {
    save_new_post: (author, permlink, cb) => {
        steemapi.get_content(author, permlink, (result) => {
            if (result.status === 200 && result.data) {
                let feed = result.data;
                feed.body = utf8.encode(feed.body);
                feed.title = utf8.encode(feed.title);
                feed.root_title = utf8.encode(feed.root_title);
                if (feed.json_metadata) {
                    let metadata = JSON.parse(feed.json_metadata)
                    if (metadata.tags && metadata.tags.length > 0) {
                        let valid_tags = [];
                        metadata.tags.forEach(tag => {
                            if (tag !== "") {
                                valid_tags.push(tag);
                            }
                        });
                        feed.tags = valid_tags;
                    }
                }
                _this.get_user_info(author, (result) => {
                    if (result) {
                        feed.author_accounts = result;
                        let link = author + '/' + permlink;
                        let params = {
                            url: link,
                            username: author,
                            content: JSON.stringify(feed),
                            replies: "[]",
                            voters: "[]",
                            rebloggers: "[]",
                            post_created: feed.created,
                            replies_count: 0,
                            reblog_count: 0,
                            voter_count: 0,
                            is_comment: 0
                        };
                        FeedsModel.check_if_exist(link, (exists) => {
                            if (!exists) {
                                FeedsModel.insert(params, (inserted) => {
                                    if (inserted) {
                                        cb(true);
                                    } else {
                                        cb(false);
                                    }
                                });
                            } else {
                                cb(true);
                            }
                        });

                    } else {
                        cb(false);
                    }
                });
            } else {
                cb(false);
            }
        });
    },

    save_new_post2: (feed, cb) => {
        let author = feed.author;
        let permlink = feed.permlink;
        feed.body = utf8.encode(feed.body);
        feed.title = utf8.encode(feed.title);
        UsersModel.get_user(author,(result)  => {
            if(result && result.metadata){
                feed.author_accounts = JSON.parse(result.metadata);
                let link = author + '/' + permlink;
                let params = {
                    url: link,
                    username: author,
                    content: JSON.stringify(feed),
                    replies: "[]",
                    voters: "[]",
                    rebloggers: "[]",
                    post_created: feed.created,
                    replies_count: 0,
                    reblog_count: 0,
                    voter_count: 0,
                    is_comment: 0
                };
                FeedsModel.check_if_exist(link, (exists) => {
                    if (!exists) {
                        FeedsModel.insert(params, (inserted) => {
                            if (inserted) {
                                cb(true);
                            } else {
                                cb(false);
                            }
                        });
                    } else {
                        cb(true);
                    }
                });
            }else{
                _this.get_user_info(author, (result) => {
                    if (result) {
                        feed.author_accounts = result;
                        let link = author + '/' + permlink;
                        let params = {
                            url: link,
                            username: author,
                            content: JSON.stringify(feed),
                            replies: "[]",
                            voters: "[]",
                            rebloggers: "[]",
                            post_created: feed.created,
                            replies_count: 0,
                            reblog_count: 0,
                            voter_count: 0,
                            is_comment: 0
                        };
                        FeedsModel.check_if_exist(link, (exists) => {
                            if (!exists) {
                                FeedsModel.insert(params, (inserted) => {
                                    if (inserted) {
                                        cb(true);
                                    } else {
                                        cb(false);
                                    }
                                });
                            } else {
                                cb(true);
                            }
                        });
        
                    } else {
                        cb(false);
                    }
                });
            }
        });
    },
    
    save_new_comment: (author, permlink, cb) => {
        steemapi.get_content(author, permlink, (result) => {
            if (result.status === 200 && result.data) {
                let feed = result.data;
                feed.body = utf8.encode(feed.body);
                feed.title = utf8.encode(feed.title);
                feed.root_title = utf8.encode(feed.root_title);
                if (feed.json_metadata) {
                    let metadata = JSON.parse(feed.json_metadata)
                    if (metadata.tags && metadata.tags.length > 0) {
                        let valid_tags = [];
                        metadata.tags.forEach(tag => {
                            if (tag !== "") {
                                valid_tags.push(tag);
                            }
                        });
                        feed.tags = valid_tags;
                    }
                }
                _this.get_user_info(author, (result) => {
                    if (result) {
                        let author_accounts = result;
                        let content = feed;
                        content.author_accounts = author_accounts;
                        let link = author + '/' + permlink;
                        let params = {
                            url: link,
                            username: feed.author,
                            content: JSON.stringify(content),
                            replies: "[]",
                            voters: "[]",
                            rebloggers: "[]",
                            post_created: feed.created,
                            replies_count: 0,
                            reblog_count: 0,
                            voter_count: 0,
                            is_comment: 1,
                            parent_url: feed.parent_author + '/' + feed.parent_permlink,
                            parent_author: feed.parent_author,
                            parent_permlink: feed.parent_permlink
                        };
                        FeedsModel.check_if_exist(link, (exists) => {
                            if (!exists) {
                                FeedsModel.insert(params, (inserted) => {
                                    if (inserted) {
                                        FeedsModel.addup_replies_counter(params.parent_url, (updated) => {
                                            cb(updated)
                                        });
                                    } else {
                                        cb(false)
                                    }
                                });
                            } else {
                                cb(true)
                            }
                        });
                    } else {
                        cb(false)
                    }
                });
            } else {
                cb(false)
            }
        });
    },

    save_new_comment2: (feed, cb) => {
        let author = feed.author;
        let permlink = feed.permlink;
        feed.body = utf8.encode(feed.body);
        feed.title = utf8.encode(feed.title);
        UsersModel.get_user(author,(result)  => {
            if(result && result.metadata){
                let author_accounts = JSON.parse(result.metadata);
                let content = feed;
                content.author_accounts = author_accounts;
                let link = author + '/' + permlink;
                let params = {
                    url: link,
                    username: feed.author,
                    content: JSON.stringify(content),
                    replies: "[]",
                    voters: "[]",
                    rebloggers: "[]",
                    post_created: feed.created,
                    replies_count: 0,
                    reblog_count: 0,
                    voter_count: 0,
                    is_comment: 1,
                    parent_url: feed.parent_author + '/' + feed.parent_permlink,
                    parent_author: feed.parent_author,
                    parent_permlink: feed.parent_permlink
                };
                FeedsModel.check_if_exist(link, (exists) => {
                    if (!exists) {
                        FeedsModel.insert(params, (inserted) => {
                            if (inserted) {
                                FeedsModel.addup_replies_counter(params.parent_url, (updated) => {
                                    console.log('update replies counter', updated);
                                    cb(updated)
                                });
                            } else {
                                cb(false)
                            }
                        });
                    } else {
                        cb(true)
                    }
                });
            }else{
                _this.get_user_info(author, (result) => {
                    if (result) {
                        let author_accounts = result;
                        let content = feed;
                        content.author_accounts = author_accounts;
                        let link = author + '/' + permlink;
                        let params = {
                            url: link,
                            username: feed.author,
                            content: JSON.stringify(content),
                            replies: "[]",
                            voters: "[]",
                            rebloggers: "[]",
                            post_created: feed.created,
                            replies_count: 0,
                            reblog_count: 0,
                            voter_count: 0,
                            is_comment: 1,
                            parent_url: feed.parent_author + '/' + feed.parent_permlink,
                            parent_author: feed.parent_author,
                            parent_permlink: feed.parent_permlink
                        };
                        FeedsModel.check_if_exist(link, (exists) => {
                            if (!exists) {
                                FeedsModel.insert(params, (inserted) => {
                                    if (inserted) {
                                        FeedsModel.addup_replies_counter(params.parent_url, (updated) => {
                                            console.log('update replies counter', updated);
                                            cb(updated)
                                        });
                                    } else {
                                        cb(false)
                                    }
                                });
                            } else {
                                cb(true)
                            }
                        });
                    } else {
                        cb(false)
                    }
                });
            }
        });
    },

    save_new_upvote: (author, permlink, cb) => {
        steemapi.get_active_votes(author, permlink, (result) => {
            if (result.count > 0) {
                let active_votes = result.data;
                let link = author + '/' + permlink;
                FeedsModel.update_vote_counter(link, JSON.stringify(active_votes), 1, (updated) => {
                    cb(updated);
                });
            } else {
                cb(false);
            }
        });
    },

    remove_upvote: (author, permlink, cb) => {
        steemapi.get_active_votes(author, permlink, (result) => {
            if (result.count > 0) {
                let active_votes = result.data;
                let link = author + '/' + permlink;
                FeedsModel.update_vote_counter(link, JSON.stringify(active_votes), 0, (updated) => {
                    cb(updated);
                });
            } else {
                cb(false);
            }
        });
    },

    save_new_reblog: (author, permlink, reblog_by, cb) => {
        let link = author + '/' + permlink;
        steemapi.get_rebloggers(author, permlink, (result) => {
            if (result.status === 200 && result.count > 0) {
                let reblogger = JSON.stringify(result.data);
                FeedsModel.update_reblog_counter(link, reblogger, (updated) => {
                    cb(updated);
                });
            } else {
                FeedsModel.get_feed(link, (result) => {
                    let rebloggers = [];
                    if (result && result.rebloggers) {
                        rebloggers = result.rebloggers;
                    }
                    rebloggers.push(reblog_by);
                    let new_reblogs = JSON.stringify(rebloggers);
                    FeedsModel.update_reblog_counter(link, new_reblogs, (updated) => {
                        cb(updated);
                    });
                });
            }
        });
    },


    get_user_info: (username, cb) => {
        steemapi.get_account_info([username], (result) => {
            if (result.status === 200 && result.data) {
                let account = result.data[0];
                if (account.json_metadata == "") {
                    account.json_metadata = account.posting_json_metadata;
                }
                steemapi.count_followers(username, (result1) => {
                    let follower_count = 0;
                    let following_count = 0;
                    if (result1.status === 200) {
                        let counter = result1.data;
                        follower_count = counter.follower_count;
                        following_count = counter.following_count;
                    }
                    account.following_count = following_count;
                    account.follower_count = follower_count;
                    _this.user_account_mapper(account, result => {
                        cb(result);
                    });
                })
            } else {
                UsersModel.get_user(username,(result1)  => {
                    if(result1 && result1.metadata){
                        cb(JSON.parse(result1.metadata));
                    }else{
                        cb(null);
                    }
                });
            }
        });
    },

    user_account_mapper: (account, cb) => {
        let username = account.name;
        let author_name = username;
        let info = {
            user_id: account.id,
            author: username,
            author_name: author_name,
            author_profile: { profile: {} },
            author_profile_pic: '',
            author_profile_cover: '',
            following_count: account.following_count,
            follower_count: account.follower_count,
            created: account.created,
        }

        let profile = {};
        if (account.posting_json_metadata !== "") {
            if (util.isValidJson(account.posting_json_metadata)) {
                let metadata = JSON.parse(account.posting_json_metadata);
                if (metadata && metadata.profile) {
                    profile = metadata.profile;
                } else {
                    if (account.json_metadata !== "") {
                        if (util.isValidJson(account.json_metadata)) {
                            let metadata = JSON.parse(account.json_metadata);
                            if (metadata && metadata.profile) {
                                profile = metadata.profile;
                            }
                        }
                    }
                }
            }
        } else {
            if (account.json_metadata !== "") {
                if (util.isValidJson(account.json_metadata)) {
                    let metadata = JSON.parse(account.json_metadata);
                    if (metadata && metadata.profile) {
                        profile = metadata.profile;
                    }
                }
            }
        }
        if (profile) {
            if (profile.name !== undefined) {
                profile.name = profile.name ? utf8.encode(profile.name) : '';
                if (profile.name !== '') {
                    author_name = profile.name;
                }
            }
            if (profile.about !== undefined) {
                profile.about = profile.about ? utf8.encode(profile.about) : '';
            }
            if (profile.location !== undefined) {
                profile.location = profile.location ? utf8.encode(profile.location) : '';
            }

            if (profile.signature !== undefined) {
                profile.signature = profile.signature ? utf8.encode(profile.signature) : '';
            }
        }
        info.author_name = author_name;
        info.author_profile = { profile: profile };
        info.author_profile_pic = profile.profile_image!==undefined && profile.profile_image ? ENV.STEEM.IMAGES_URL + profile.profile_image : profile.profile_image;
        info.author_profile_cover = profile.cover_image!== undefined &&  profile.cover_image ? ENV.STEEM.IMAGES_URL + profile.cover_image : profile.cover_image;

        _this.calculate_voting_power(account, (voting_power) => {
            info.voting_power = voting_power;
            steemapi.is_community_subscribed(username, (result1) => {
                let subscribed = 0;
                if (result1.status == 200) {
                    subscribed = (result1.data ? 1 : 0);

                }
                info.is_member = subscribed;
                TwitterModel.check_if_verified(username, result => {
                    let is_verified = result ? 1 : 0;
                    info.is_verified = is_verified;
                    cb(info);
                });
            });

        });
    },

    get_user_followers: (username) => {
        steemapi.count_followers(username, (result) => {
            let follow_count = 1000;
            if (result.status === 200) {
                follow_count = result.data.follower_count;
                if (follow_count > 1000) {
                    follow_count = 1000;
                }
            }
            steemapi.get_followers(username, follow_count, (result2) => {
                if (result2.count > 0) {
                    let following = result2.data;
                    let list = [];
                    following.forEach((item) => {
                        list.push(item.follower);
                    });
                    steemapi.get_multiple_account_info(list, (result3) => {
                        if (result3.status === 200) {
                            let following_infos = result3.data;
                            if (following_infos.length > 0) {
                                let ind = 0;
                                let map_accnts = [];
                                following_infos.forEach(account => {
                                    let profile = {};
                                    if (account.json_metadata) {
                                        let metadata = JSON.parse(account.json_metadata);
                                        if (metadata && metadata.profile) {
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
                                        if (ind == following_infos.length) {
                                            client.set('follower_' + username, JSON.stringify(map_accnts));
                                            console.log('Saved followers of ', username);
                                        }
                                    });
                                });
                            }
                        } else {
                            console.log('No data fetched');
                        }
                    });
                }
            });
        });
    },

    get_user_following: (username) => {
        steemapi.count_followers(username, (result) => {
            let follow_count = 1000;
            if (result.status === 200) {
                follow_count = result.data.following_count;
                if (follow_count > 1000) {
                    follow_count = 1000;
                }
            }
            console.log('Following count', follow_count);
            steemapi.get_following(username, follow_count, (result2) => {
                if (result2.count > 0) {
                    let following = result2.data;
                    let list = [];
                    following.forEach((item) => {
                        list.push(item.following);
                    });

                    steemapi.get_multiple_account_info(list, (result3) => {
                        if (result3.status === 200) {
                            let following_infos = result3.data;
                            if (following_infos.length > 0) {
                                let ind = 0;
                                let map_accnts = [];
                                following_infos.forEach(account => {
                                    let profile = {};
                                    if (account.json_metadata) {
                                        let metadata = JSON.parse(account.json_metadata);
                                        if (metadata && metadata.profile) {
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

                                    TwitterModel.get_user(account.name, (result4) => {
                                        let is_verified = 0;
                                        if (result4) {
                                            is_verified = result4.is_verified;
                                        }
                                        mapped.is_verified = is_verified;
                                        map_accnts.push(mapped);
                                        ind++;
                                        if (ind == following_infos.length) {
                                            client.set('following_' + username, JSON.stringify(map_accnts));
                                            console.log('Saved followings of ', username);
                                        }
                                    });
                                });
                            }
                        }
                    });
                }
            });
        });
    },

    get_wallet_info: (username, cb) => {
        let wallet = {
            balance: 0,
            savings_balance: 0,
            savings_sbd_balance: 0,
            sbd_balance: 0,
            estimate_account_value: "$0",
            hive_power: 0.000 + ' HIVE'
        };
        steemapi.get_account_info(username,(result) => {
            if(result.status === 200 && result.data){
                var account = result.data;
                wait.launchFiber(async function () {
                   try {
                    if (account) {
                        var globalData = wait.for(hive.api.getDynamicGlobalProperties);
                        var ci = new Object();
                        ci.rewardfund_info = wait.for(hive.api.getRewardFund, 'post');
                        ci.price_info = wait.for(hive.api.getCurrentMedianHistoryPrice);
                        ci.reward_balance = ci.rewardfund_info.reward_balance;
                        ci.recent_claims = ci.rewardfund_info.recent_claims;
                        ci.reward_pool = ci.reward_balance.replace(' STEEM', '') / ci.recent_claims;
                        ci.sbd_per_steem = ci.price_info.base.replace(' SBD', '') / ci.price_info.quote.replace(' STEEM', '');
                        ci.steem_per_vest = globalData.total_vesting_fund_steem.replace(' STEEM', '') / globalData.total_vesting_shares.replace(' VESTS', '');
                        var vestingSharesParts = account[0].vesting_shares.split(' ');
                        var receivedSharesParts = account[0].received_vesting_shares.split(' ');
                        var delegatedSharesParts = account[0].delegated_vesting_shares.split(' ');
                        var totalVests =
                            parseFloat(vestingSharesParts[0]) + parseFloat(receivedSharesParts[0]) -
                            parseFloat(delegatedSharesParts[0]);
    
                        var hivepower = hive.formatter.vestToHive(
                            totalVests,
                            parseFloat(globalData.total_vesting_shares),
                            parseFloat(globalData.total_vesting_fund_steem)
                        );
                        let estimateAccountValue = await hive.formatter.estimateAccountValue(account[0]);
                        wallet = {
                            balance: account[0].balance,
                            savings_balance: account[0].savings_balance,
                            savings_sbd_balance: account[0].savings_sbd_balance,
                            sbd_balance: account[0].sbd_balance.split(" ")[0],
                            estimate_account_value: "$" + estimateAccountValue,
                            hive_power: hivepower.toFixed(3) + ' HIVE'
                        };
                    } 
                    cb(wallet);
                   } catch (error) {
                        wallet.balance = account[0].balance;
                        wallet.savings_balance = account[0].savings_balance;
                        wallet.savings_sbd_balance = account[0].savings_sbd_balance;
                        cb(wallet);
                   }
                });
            }
        });
    },

    get_author_payout: (author, permlink, cb) => {
        steemapi.get_content(author,permlink,(result) => {
            if(result.status == 200){
                let payout = 0;
                let post = result.data;
                console.log(post);
                wait.launchFiber(function () {
                    var rewardfund_info = wait.for(hive.api.getRewardFund, 'post');
                    var reward_balance = parseFloat(rewardfund_info.reward_balance);
                    var recent_claims = parseFloat(rewardfund_info.recent_claims);
                    var globalData = wait.for(hive.api.getDynamicGlobalProperties);
                    var price_info = wait.for(hive.api.getCurrentMedianHistoryPrice);
                    const hive_price = parseFloat(price_info.base);
                    console.log('hive_price:', hive_price);
                    const reward = util.getRshareReward(post,recent_claims,reward_balance,hive_price);
                    console.log('reward:', reward);
                    if (reward == 0){
                        cb({ payout_amount: [0, 0, 0] });
                    }else{
                        // const claim = post.net_rshares * post.reward_weight / 10000.0;
                        const curation_tokens = Math.floor(1000.0 * reward * rewardfund_info.percent_curation_rewards / 10000.0) / 1000.0;
                        console.log('curation_tokens:', curation_tokens);
                        let author_tokens = reward - curation_tokens;
                        // re-add unclaimed curation tokens to the author tokens
                        author_tokens += util.payCurators(post, curation_tokens);
                         // pay beneficiaries
                        let total_beneficiary = 0;
                        if(post.beneficiaries.length > 0){
                            post.beneficiaries.forEach(b => {
                                total_beneficiary +=
                                Math.floor(1000.0 * author_tokens * b.weight / 10000.0) / 1000.0;
                            });
                        }
                        author_tokens -= total_beneficiary;
                        console.log('author_tokens:', author_tokens);
                        const create_payout = util.createPayout(author_tokens, post.percent_steem_dollars, globalData.sbd_print_rate, hive_price);
                        cb({payout_amount: create_payout});
                    }
                });
            }else{
                cb({payout_amount: [0, 0, 0]});
            }
        });
    },

    get_post_pending_payout: (author, permlink, cb) => {
        let pending_payout = 0;
        steemapi.get_content(author,permlink,(result) => {
            if(result.status == 200){
                let post = result.data;
                pending_payout = parseFloat(post.pending_payout_value);
                let cashout_time = moment.utc(post.cashout_time);
                let datenow = moment().utc();
                let payout_in_days = cashout_time.diff(datenow,'days',true);
                cb({data: { payout_amount: pending_payout, payout_in_days: Math.round(payout_in_days) }, status: 200});
            }else{
                cb({data: { payout_amount: pending_payout, payout_in_days: '' }, status: 400});
            }
        });
    },

    get_voting_power: (username, cb) => {
        steemapi.get_account_info([username], (result) => {
            if (result.status === 200 && result.data) {
                let account = result.data[0];
                _this.calculate_voting_power(account, (vote_power) => {
                    cb(vote_power);
                });
            } else {
                cb(0);
            }
        });
    },

    calculate_voting_power: (account, cb) => {
        let voting_power = 0;
        if (account) {
            const totalShares = parseFloat(account.vesting_shares) + parseFloat(account.received_vesting_shares)
                - parseFloat(account.delegated_vesting_shares) - parseFloat(account.vesting_withdraw_rate);
            const elapsed = Math.floor(Date.now() / 1000) - account.voting_manabar.last_update_time;
            const maxMana = totalShares * 1000000;
            // 432000 sec = 5 days
            let currentMana = parseFloat(account.voting_manabar.current_mana) + elapsed * maxMana / 432000;
            if (currentMana > maxMana) {
                currentMana = maxMana;
            }
            voting_power = currentMana * 100 / maxMana;
        }
        cb(parseFloat(voting_power));
    },

    refresh_token: async (token, req) => {
        if (token !== undefined) {
            let access_token = token.split('&')[0];
            await steem.setAccessToken(access_token);
        }
    },

    prepare_new_user_data: (account, cb) => {
        if (account) {
            let username = account.name;
            if (account.json_metadata == "") {
                account.json_metadata = account.posting_json_metadata;
            }

            steemapi.count_followers(username, (result) => {
                let following_count = 0;
                let follower_count = 0;
                if (result.status === 200) {
                    following_count = result.data.following_count;
                    follower_count = result.data.follower_count;
                }
                steemapi.is_community_subscribed(username, (result1) => {
                    let is_member = 0;
                    if (result1.status == 200) {
                        is_member = result1.data;
                    }
                    if(account.posting_json_metadata==""){
                        account.profile_image = util.getProfileImageLink(account.json_metadata);
                        account.cover_image = util.getProfileCoverLink(account.json_metadata);
                    }else{
                        account.profile_image = util.getProfileImageLink(account.posting_json_metadata);
                        account.cover_image = util.getProfileCoverLink(account.posting_json_metadata);
                    }
                    account.following_count = following_count;
                    account.follower_count = follower_count;
                    account.is_member = is_member ? 1 : 0;
                    TwitterModel.get_user(username, (user) => {
                        let is_verified = 0;
                        let screenname = '';
                        if (user) {
                            is_verified = user.is_verified;
                            screenname = user.screenname;
                        }
                        account.twitter_account = screenname;
                        account.is_verified = is_verified;
                        UsersModel.check_if_exist(username, (result) => {
                            if (!result) {
                                _this.user_account_mapper(account, (mapped) => {
                                    if (mapped) {
                                        account.voting_power = mapped.voting_power;
                                        account.is_member = mapped.is_member;
                                        _this.get_user_following(username);
                                        _this.save_new_user(mapped, (inserted) => {
                                            console.log('Inserted new user', inserted);
                                            if (inserted) {
                                                util.saveAuthorPhotos(mapped);
                                                _this.saveUserAccessToken(username, account.access_token);
                                            }
                                        });
                                    }
                                    cb(account);
                                });
                            } else {
                                _this.calculate_voting_power(account, (voting_power) => {
                                    account.voting_power = voting_power;
                                    cb(account);
                                });
                            }
                        })
                    });
                });
            });
        } else {
            cb(account);
        }
    },


    save_new_user: (account, cb) => {
        let username = account.author;
        let mbdata = {
            username: username,
            steem_id: account.user_id,
            metadata: JSON.stringify(account),
            follower_count: account.follower_count,
            following_count: account.following_count,
            is_member: account.is_member,
        };
        UsersModel.check_if_exist(username, (exists) => {
            if (!exists) {
                UsersModel.insert(mbdata, (result) => {
                    if (result) {
                        cb(true);
                    } else {
                        cb(false);
                    }
                });
            } else {
                cb(true);
            }
        });
    },

    check_is_following: (username, following, cb) => {
        let is_following = false;
        steemapi.count_followers(username, (result) => {
            let follow_count = 1000;
            if (result.status === 200) {
                let counter = result.data;
                follow_count = counter.following_count;
            }
            steemapi.get_following(username, follow_count, (result) => {
                if (result.count > 0) {
                    result.data.forEach((item) => {
                        if (item.following === following) {
                            is_following = true;
                        }
                    });
                }

                cb(is_following);
            });
        });
    },

    saveUserAccessToken: (username, access_token) => {
        if (access_token) {
            UsersModel.update_access_token(username, access_token, (updated) => {
                console.log('Updated token', updated);
            });
        }
    },

    is_following_checker: (follower, following, cb) => {
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
    },

    get_who_to_follow: (username, cb) => {
        let whotofollow = [];
        client.get('who_to_follow', (err, data) => {
            if (err === null) {
                let result = JSON.parse(data);
                if (result && result.length > 0) {
                    let ind = 0;
                    result.forEach(follow => {
                        _this.is_following_checker(follow.author, username, (is_followed) => {
                            follow.is_followed = is_followed;
                            _this.is_following_checker(username, follow.author, (is_following) => {
                                if (follow.author !== username) {
                                    if (!is_following) {
                                        whotofollow.push(follow);
                                    }
                                }
                                ind++;
                                if (ind === result.length) {
                                    cb(whotofollow);
                                }
                            });
                        });

                    });
                } else {
                    cb(whotofollow);
                }
            } else {
                cb(whotofollow);
            }
        });
    },

    getFeedsUrlMetadata: (feeds, cb) => {
        if(feeds && feeds.length > 0){
            let ind = 0;
            feeds.forEach(feed => {
                feed.preview_link = '';
                feed.link_metadata = '';
                var prev_link = util.getContentLinkToPreview(feed.body);
                setTimeout(() => {
                    _this.getUrlMetadata(prev_link, metadata => {
                        if(metadata.status === 200){
                            feed.preview_link = prev_link;
                            feed.link_metadata = metadata.data;
                        }
                        ind++;
                        if(ind === feeds.length){
                            cb(feeds);
                        }
                    });
                }, 1000);
            });
        }else{
            cb(feeds);
        }
    },
    
    getUrlMetadata: async (url, cb) => {
        try{
            if(url){
                const metaResponse = await metaget.fetch(url);
                if(metaResponse && !util.isEmptyObject(metaResponse)){
                    metaResponse.title = metaResponse['og:title'] ?  metaResponse['og:title'] : metaResponse['og:site_name'];
                    metaResponse.url = url;
                    metaResponse.image =  metaResponse['og:image'];
                    metaResponse.site_name = metaResponse['og:site_name'];
                    cb({ data: metaResponse, status: 200 });
                }else{
                    cb({ data: null, status: 400 });
                }
            }else{
                cb({ data: null, status: 400 });
            }
        }catch(ex){
            cb({ data: null, status: 400 });
        }
    }
};

function repository() {
    return _this;
}

module.exports = repository;
