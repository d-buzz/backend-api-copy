const express = require('express');
const router = express.Router();
const ENV = require('./../env');
const steemapi = require('./../modules/steemapi');
const redisclient = require('../modules/redisconnect');
const util = require('./../modules/util');
const ModelModule = require('../models/module');
const FeedsModel = ModelModule.Feeds();
const WitnessModel = ModelModule.Witness();
const UserModel = ModelModule.Users();
const repository = require('../modules/repository');

/* GET home page. */
router.get('/', (req, res, next) => {
  if (req.session.steemconnect) {
    return res.json({ data: { username: req.session.steemconnect.name }, status: 200 });
  } else {
    return res.json({ data: 'Must login', status: 400 });
  }
});

// planning to add tag so that I can get the data from the hive
/* GET a users blog profile page. */
router.get('/@:username', (req, res, next) => {
  let username = req.params.username
  if (!username) {
    return res.json({ data: 'Username is required', status: 400 });
  } else {
    if(req.session.steemconnect){
      return res.json({
        data: {
          username: username,
          user: req.session.steemconnect
        }, status: 200
      });
    }else{
      return res.json({ data: 'Must login', status: 400 });
    }
  }
});

/* GET a users blog feed page. */
router.get('/@:username/feed/:limit?', (req, res, next) => {
  let username = req.params.username;
  let limit = req.params.limit || 100;
  let body = { tag: username, limit: limit };
  steemapi.get_user_feed(body, (result) => {
    return res.json(result);
  });
});

/* GET a users transfers profile page. */
router.get('/@:username/transfers/:start?/:limit?', (req, res, next) => {
  let username = req.params.username;
  let limit = req.params.limit || 1000;
  let start = req.params.start || -1;
  steemapi.get_account_transactions(username,start,limit,(result) => {
    return res.json(result);
  });
});

/* GET a single post page page. */
router.get('/:category/@:username/:permlink', (req, res, next) => {
  let username = req.params.username
  let permlink = req.params.permlink
  let url = username +'/'+permlink;
  FeedsModel.get_mapped_feed(url,(feed) => {
    if(feed){
      return res.json({ data: feed, status: 200});
    }else{
      return res.json({ data: 'No data fetched', status: 400});
    }
  });
});

router.get('/all-replies/:username/:limit/:offset?', (req, res, next) => {
  let username = req.params.username;
  let limit = req.params.limit;
  let offset = req.params.offset || 0;
  FeedsModel.get_replies(username,(result) => {
    if(result && result.length > 0){
      let replies = result.slice(offset,limit);
      return res.json({ data: replies, count: result.length, status: 200});
    }else{
      return res.json({ data: 'No data fetched', status: 400});
    }
  });
});

router.get('/mentions/:username/:limit/:offset?', (req, res, next) => {
  let username = req.params.username;
  let limit = req.params.limit;
  let offset = req.params.offset || 0;
  FeedsModel.get_mentions(username,limit,offset,(result) => {
    if(result && result.length > 0){
      FeedsModel.count_user_mentions(username,(count) => {
        return res.json({ data: result, count: count, status: 200});
      });
    }else{
      return res.json({ data: 'No data fetched', status: 400});
    }
  });
});

router.get('/replies/:username/:permlink', (req, res, next) => {
  let username = req.params.username
  let permlink = req.params.permlink
  let parent_url = username +'/'+ permlink;
  FeedsModel.get_replies_by_parent_url(parent_url,(result) => {
    if(result){
      return res.json({ data: result, count: result.length, status:200 });
    }else{
      return res.json({ data: 'No data fetched', status: 400});
    }
  });
});

router.get('/is-voter/:voter/:username/:permlink', (req, res, next) => {
  let voter = req.params.voter
  let username = req.params.username
  let permlink = req.params.permlink
  steemapi.is_voter(voter,username,permlink,(result) => {
    return res.json(result);
  });
});

router.get('/active-voters/:username/:permlink', (req, res, next) => {
  let username = req.params.username
  let permlink = req.params.permlink
  steemapi.get_active_votes(username,permlink,(result) => {
    return res.json(result);
  });
});

router.get('/active-rebloggers/:username/:permlink', (req, res, next) => {
  let username = req.params.username
  let permlink = req.params.permlink
  steemapi.get_rebloggers(username,permlink,(result) => {
    return res.json(result);
  });
});

router.get('/trending-tags/:limit?', (req, res, next) => {
  let limit = req.params.limit || 20;
  redisclient.get('trending_tags', (err, data) => {
    if (err === null) {
      if(data){
        let result = JSON.parse(data);
        result = result.slice(0,limit);
        return res.json({ data: result, status: 200});
      }else{
        return res.json({ data: 'No data fetched', status: 400});
      }
    } else {
      steemapi.get_trending_tags(null,limit,(result) => {
        return res.json(result);
      });
    }
  });
});

router.get('/who-to-follow/:username?/:limit?', (req, res, next) => {
  let username = req.params.username || '';
  let limit = req.params.limit || 10;
  if(username){
    repository().get_who_to_follow(username,(result) => {
      if(result && result.length > 0){
        let whotofollow = result.slice(0,limit);
        return res.json({ data: whotofollow, status: 200});
      }
      return res.json({data: 'No data fetched', status: 400});
    });
  }else{
    return res.json({data: 'No data fetched', status: 400});
  }
});

router.get('/lookup-witness/:author/:limit?/:offset?', (req, res, next) => {
  let author = req.params.author;
  let limit = req.params.limit || 10;
  let offset = req.params.offset || 0;
  WitnessModel.search_witness(author,limit,offset,(result) => {
    if(result){
      return res.json({ data: result, status: 200 });
    }
    return res.json({ data: 'No data fetched', status: 400 });
  });
});

router.get('/lookup-user/:author/:limit?/:offset?', (req, res, next) => {
  let author = req.params.author;
  let limit = req.params.limit || 10;
  let offset = req.params.offset || 0;
  UserModel.search_user(author,limit,offset,(result) => {
    if(result){
      return res.json({ data: result, status: 200 });
    }
    return res.json({ data: 'No data fetched', status: 400 });
  });
});

router.get('/lookup-latest/:author/:limit?/:offset?', (req, res, next) => {
  let author = req.params.author;
  let limit = req.params.limit || 10;
  let offset = req.params.offset || 0;
  FeedsModel.search_feed_by_user(author,limit,offset,(result) => {
    if(result){
      return res.json({ data: result, status: 200 });
    }else{
      return res.json({ data: 'No data fetched', status: 400 });
    }
  });
});

router.get('/blog-counter/:author', (req, res, next) => {
  let author = req.params.author;
  FeedsModel.count_user_blogs(author,(blog_count) => {
    FeedsModel.count_user_comments(author,(comment_count) => {
      let counter = {
          blogs: blog_count,
          comments: comment_count
      };
      return res.json({ data: counter, status: 200 });
    });
  });
});

router.get('/hive-test/:author/:permlink', (req, res, next) => {
  let author = req.params.author;
  let permlink = req.params.permlink;
  let type = req.params.type;
  let limit = req.params.limit || 100;
  let params = {
    tag: ENV.primary_tag,
    limit: 100
  };
  steemapi.get_content(author,permlink,(result) => {
    return res.json(result);
  });
});

router.get('/pending-payout/:author/:permlink', (req, res, next) => {
  let author = req.params.author;
  let permlink = req.params.permlink;
  repository().get_post_pending_payout(author,permlink,(payout) => {
    return res.json(payout);
  });
});


router.get('/url-get-metadata', (req, res, next) => {
  let url = req.query.url;
  url = util.decodeSafeUrl(url);
  util.urlMetaFetch(url,(metadata) => {
    return res.json(metadata);
  });
});
module.exports = router;
