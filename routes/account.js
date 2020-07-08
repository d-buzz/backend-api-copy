const express = require('express');
const router = express.Router();
const steemapi = require('./../modules/steemapi');
const util = require('../modules/util');
const ModelModule = require('../models/module');
const TwitterModel = ModelModule.UserTwitterVerify();
const NotifsModel = ModelModule.Notifs();
const UsersModel = ModelModule.Users();
const repository = require('../modules/repository');
const client = require('../modules/redisconnect');

router.get('/@:username', (req, res, next) => {
    let username = req.params.username
    if(username){
        steemapi.get_account_info([username], (result) => {
            if(result.status==200 && result.data.length > 0){
                let mapped = result.data[0];
                if(mapped.posting_json_metadata !== ""){
                    mapped.json_metadata = mapped.posting_json_metadata;
                }
                TwitterModel.get_user(username,(user) => {
                    let is_verified = 0;
                    let screenname = '';
                    if(user!==null){
                        is_verified = user.is_verified;
                        screenname = user.screenname;
                    }
                    mapped.is_verified = is_verified;
                    mapped.twitter_account = screenname;
                    return res.json({ data: [mapped], status: 200 });
                });
            }else{
                return res.json({ data: 'No data fetched from HIVE API', status: 400 });
            }
        });
    }else{
        return res.json({ data: 'Invalid username', status: 400 });
    }
});

router.get('/image-links/@:username', (req, res, next) => {
    let username = req.params.username;
    if(username){
        steemapi.get_account_info([username], (result) => {
            let images = {
                profile_image : '',
                cover_image: ''
            };
            if(result.status==200){
                let account = result.data[0];
                let json_metadata = account.json_metadata;
                if(account.posting_json_metadata !== ""){
                    json_metadata = account.posting_json_metadata;
                }
                images = {
                    profile_image : util.getProfileImageLink(json_metadata),
                    cover_image: util.getProfileCoverLink(json_metadata)
                };

                return res.json({ data: images, status: 200 });
            }else{
                UsersModel.get_user(username,(user) => {
                    if(user && user.metadata){
                        let metadata = JSON.parse(user.metadata);
                        images = {
                            profile_image : metadata.author_profile_pic,
                            cover_image: metadata.author_profile_cover
                        };
                    }
                    return res.json({ data: images, status: 200 });
                }); 
            }
           
        });
    }else{
        return res.json({ data: 'No username provided', status: 400 });
    }
    
});

router.post('/multiple', (req, res, next) => {
    let usernames = req.body.usernames
    steemapi.get_multiple_account_info(JSON.parse(usernames),(result) => {
        if(result.status === 200 && result.count > 0){
            let accounts = result.data;
            let ind = 0;
            accounts.forEach(account => {
                TwitterModel.get_user(account.name,(user) => {
                    let is_verified = 0;
                    if(user){
                        is_verified = user.is_verified;
                    }
                    account.is_verified = is_verified;
                    ind++;
                    if(ind === accounts.length){
                        return res.json({ data: accounts, count: accounts.length, status: 200 });
                    }
                });
            });
        }else{
            return res.json(result);
        }
    });
});
  
router.get('/followers/:limit?/@:username', (req, res, next) => {
    let username = req.params.username
    let limit = req.params.limit || 100;
    client.get('follower_' + username, (err, data) => {
        if (data) {
            let followingjson = JSON.parse(data);
            let result = followingjson.slice(0,limit)
            return res.json({data: result, count:followingjson.length ,status: 200 });
        }else{
            steemapi.get_followers(username, limit, (result) => {
                return res.json(result);
            });
        }
    });
});


router.get('/followers-count/@:username', (req, res, next) => {
    let username = req.params.username
    steemapi.count_followers(username, (result) => {
        return res.json(result);
    });
});

router.get('/following/:limit?/@:username', (req, res, next) => {
    let username = req.params.username;
    let limit = req.params.limit || 100;
    client.get('following_' + username, (err, data) => {
        if (data) {
            let followingjson = JSON.parse(data);
            let result = followingjson.slice(0,limit)
            return res.json({data: result, count:followingjson.length ,status: 200 });
        }else{
            steemapi.get_following(username, limit,(result) => {
                return res.json(result);
            });
        }
    });
});

router.get('/rebloggers/@:author/:permlink', (req, res, next) => {
    let author = req.params.author;
    let permlink = req.params.permlink;
    steemapi.get_rebloggers(author, permlink, (result) => {
        return res.json(result);
    });
});

router.get('/isfollowing/@:follower/@:following', (req, res, next) => {
    let follower = req.params.follower;
    let following = req.params.following;
    repository().is_following_checker(follower,following,(is_follower) => {
        return res.json({ data: is_follower, status: 200 });  
    });
      
});

router.get('/check-subscription/@:username', (req, res, next) => {
    let username = req.params.username
    if(username){
        steemapi.is_community_subscribed(username, (result) => {
            return res.json(result);
        });
    }else{
        return res.json({ data: 'Invalid username', status: 400});
    }
});

router.get('/notifications/@:username/:limit/:offset?', (req, res, next) => {
    let username = req.params.username;
    let offset = req.params.offset || 0;
    let limit = req.params.limit || 10;
    NotifsModel.get_all_by_user(username,limit,offset,(result) => {
        if(result){
            NotifsModel.count_all(username,(count) => {
                return res.json({data: result, count: count, status: 200 });
            });
        }else{
            return res.json({data: 'No data fetched', count:0,  status: 400 });
        }
    });
});

router.get('/notifications/mark-as-read/:notif_id', (req, res, next) => {
    let notif_id = req.params.notif_id;
    NotifsModel.change_read_status(notif_id,1,(result) => {
        if(result){
            return res.json({data: 'Success', status: 200 });
        }
        return res.json({data: 'Failed to change status', status: 400 });
    });
});


router.post('/notifications/mark-all-as-read', util.isAuthenticatedJSON,(req, res, next) => {
    let author = "";
    if (req.session.steemconnect) {
      author = req.session.steemconnect.name;
    }
    NotifsModel.change_all_read_status(author,(result) => {
        if(result){
            return res.json({data: 'Success', status: 200 });
        }
        return res.json({data: 'Failed to change status', status: 400 });
    });
});

router.post('/notifications/clear-all', util.isAuthenticatedJSON,(req, res, next) => {
    let author = "";
    if (req.session.steemconnect) {
      author = req.session.steemconnect.name;
    }
    NotifsModel.clear_all_notif(author,(result) => {
        if(result){
            return res.json({data: 'Success', status: 200 });
        }
        return res.json({data: 'Failed to change status', status: 400 });
    });
});

router.get('/notifications/counter/@:username', (req, res, next) => {
    let username = req.params.username;
    if(username){
        NotifsModel.get_counter(username,(result) => {
            return res.json({data: result, status: 200 });
        });
    }else{
        return res.json({ data: 'Invalid username', status: 400});
    }
});


router.get('/wallet-info/@:username', (req, res, next) => {
    let username = req.params.username;
    if(username){
        repository().get_wallet_info(username,(result) => {
            return res.json({data: result, status: 200 });
        });
    }else{
        return res.json({ data: 'Invalid username', status: 400});
    }
   
});

router.get('/voting-power/@:username', (req, res, next) => {
    let username = req.params.username;
    if(username){
        repository().get_voting_power(username,(result) => {
            return res.json({data: result, status: 200 });
        });
    }else{
        return res.json({ data: 'Invalid username', status: 400});
    }
});

module.exports = router;
