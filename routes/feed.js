const express = require('express');
const router = express.Router();
const ENV = require('./../env');
const ModelModule = require('../models/module');
const FeedsModel = ModelModule.Feeds();
const client = require('../modules/redisconnect');

/* GET a feed page. */
router.get('/:feed/:tag/:limit?/:offset?', (req, res, next) => {
  let feed = req.params.feed;
  let offset = req.params.offset || 0;
  let tag = req.params.tag || '';
  let limit = req.params.limit;
    let body = { tag: tag, limit: limit };
    if (feed === 'trending') {
      body.tag = tag || ENV.primary_tag;
      body.limit = limit || 20;
      FeedsModel.get_all_by_rank(limit,offset,(feeds)=>{
        if(feeds && feeds.length > 0){
          FeedsModel.count_by_trending((counter) => {
            return res.json({ data: feeds, count: counter, status: 200});
          });
        }else{
          return res.json({ data: feeds, count: 0, status: 200});
        }
      });
    } else if (feed == 'latest') {
      body.tag = tag || ENV.primary_tag;
      body.limit = limit || 10;
      FeedsModel.get_all_limit(limit,offset,(feeds)=>{
        if(feeds && feeds.length > 0){
          FeedsModel.count_by_latest((counter) => {
            return res.json({ data: feeds, count: counter, status: 200});
          });
        }else{
          return res.json({ data: feeds, count: 0, status: 200});
        }
      });
    } else if (feed === 'user-feed') {
      body.limit = limit || 20;
      client.get('following_' + tag, (err, following_list) => {
        if(!err && following_list){
          FeedsModel.get_all_feeds_by_following(tag,(feeds)=>{
            if(feeds && feeds.length > 0){
              let userfeed = feeds.slice(offset,limit);
              return res.json({ data: userfeed, count: feeds.length, status: 200});
            }else{
              return res.json({ data: feeds, count: 0, status: 200});
            }
          });
        }else{
          FeedsModel.get_all_limit(limit,offset,(feeds)=>{
            if(feeds && feeds.length > 0){
              FeedsModel.count_by_latest((counter) => {
                return res.json({ data: feeds, count: counter, status: 200});
              });
            }else{
              return res.json({ data: feeds, count: 0, status: 200});
            }
          });
        }
      });
    } else { // user blog
      body.limit = limit || 20; 
      FeedsModel.get_user_blogs(tag,(blogs) => {
        FeedsModel.count_user_blogs(tag,(counter) => {
          let result = blogs.slice(offset,limit);
          return res.json({data: result, count: counter, status: 200 });
        });
      });
    }
});

module.exports = router;
