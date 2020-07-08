const express = require('express');
const util = require('../modules/util');
const steem = require('../modules/hivesignerconnect');
const ENV = require('./../env');
const ModelModule = require('../models/module');
const UserModel = ModelModule.Users();
const FeedsModel = ModelModule.Feeds();
const router = express.Router();
const { check, validationResult } = require('express-validator');
const repository = require('../modules/repository');
const moment = require('moment');

/* GET a create post page. */
router.get('/', util.isAuthenticated, (req, res, next) => {
  return res.json({ data: 'Authenticated! Create post now', status: 200 });
});

/* POST a create post broadcast to STEEM network. */
router.post('/create-post', util.isAuthenticatedJSON, async (req, res) => {
  try {
    await check('post').unescape().trim().notEmpty().withMessage('post is required').isLength({ min: 1, max: ENV.character_limit })
      .withMessage('Post is limited only to ' + ENV.character_limit + ' characters.').run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ data: errors.array()[0].msg, status: 400 });
    }
    let body = req.body.post
    let title = body.substr(0, ENV.title_limit) + ' ...';
    let author = "";
    if (req.session.steemconnect) {
      author = req.session.steemconnect.name;
    }

    if (author === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }

    let permlink = util.urlString()
    let primaryTag = ENV.primary_tag
    let customData = '';
    let all_tags = [];
    let tags = [];
    let defaults = ENV.default_tags;
    if (defaults.length > 0) {
      defaults.forEach(def => {
        all_tags.push(def)
      });
    }

    if (req.body.tags) {
      tags = JSON.parse(req.body.tags);
      if (tags.length > 0) {
        tags.forEach(tag => {
          all_tags.push(tag);
        });
      }
    }

    if (all_tags.length > 0) {
      const distinct = (value, index, self) => {
        return self.indexOf(value) === index;
      }
      all_tags = all_tags.filter(distinct);
      customData = {
        tags: all_tags,
        app: 'dBuzz/v1.0.0'
      }
    }

    let comment_options = '';
    if (ENV.enable_comment_options) {
      FeedsModel.count_post_per_day(author, (count_post) => {
        let max_accepted_payout = ENV.max_accepted_payout;
        let percent_steem_dollars = ENV.percent_steem_dollars;
        if (parseInt(count_post) >= parseInt(ENV.buzz_limit_with_rewards)) {
          max_accepted_payout = '0.000 HBD';
          percent_steem_dollars = 0;
        }
        comment_options = {
          author: author,
          permlink: permlink,
          max_accepted_payout: max_accepted_payout,
          percent_steem_dollars: percent_steem_dollars,
          allow_votes: true,
          allow_curation_rewards: true,
          extensions: []
        };
        let token = req.session.access_token;
        repository().refresh_token(token, req);
        steem.comment('', primaryTag, author, permlink, title, body, customData, comment_options, (err, steemResponse) => {
          if (err === null) {
            let feed = {
              author: author,
              permlink: permlink,
              title: title,
              body: body,
              tags: all_tags,
              created: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
              category: primaryTag,
              max_accepted_payout: max_accepted_payout,
              percent_steem_dollars: percent_steem_dollars,
            };
            repository().save_new_post2(feed, (cb) => {
              console.log('save post status:',cb);
              return res.json({ data: { permlink: permlink, tags: all_tags }, status: 200 })
            });
            // repository().save_new_post(author, permlink,(cb) => {
            //   console.log('save post status:',cb);
            //   return res.json({ data: { permlink: permlink, tags: all_tags }, status: 200 })
            // });
          } else {
            if (err.error === 'invalid_grant') {
              return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
            } else {
              return res.json({ data: err.error_description, status: 400 })
            }
          }
        });
      });
    }else{
      let token = req.session.access_token;
      repository().refresh_token(token, req);
      steem.comment('', primaryTag, author, permlink, title, body, customData, comment_options, (err, steemResponse) => {
        if (err === null) {
          let feed = {
            author: author,
            permlink: permlink,
            title: title,
            body: body,
            tags: all_tags,
            created: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
            category: primaryTag,
            max_accepted_payout: '1000000.000 HBD',
            percent_steem_dollars: 10000,
          };
          repository().save_new_post2(feed, (cb) => {
            console.log('save post status:',cb);
            return res.json({ data: { permlink: permlink, tags: all_tags }, status: 200 })
          });
          // repository().save_new_post(author, permlink,(cb) => {
          //   console.log('save post status:',cb);
          //   return res.json({ data: { permlink: permlink, tags: all_tags }, status: 200 })
          // });
        } else {
          if (err.error === 'invalid_grant') {
            return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
          } else {
            return res.json({ data: err.error_description, status: 400 })
          }
        }
      });
    }
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
});

/* POST a vote broadcast to STEEM network. */
router.post('/vote', util.isAuthenticatedJSON, async (req, res) => {
  try {
    await check('author').trim().notEmpty().withMessage('author is required').run(req);
    await check('permlink').trim().notEmpty().withMessage('permlink is required').run(req);
    await check('votingWeight').trim().notEmpty().withMessage('voting weight is required').run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ data: errors.array()[0].msg, status: 400 });
    }

    let author = req.body.author
    let permlink = req.body.permlink
    let weight = parseInt(req.body.votingWeight);
    let voter = "";
    if (req.session.steemconnect) {
      voter = req.session.steemconnect.name;
    }

    if (voter == '' && req.cookies.steemconnect_name) {
      voter = req.cookies.steemconnect_name;
    }

    if (voter === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }

    let token = req.session.access_token;
    repository().refresh_token(token, req);
    steem.vote(voter, author, permlink, weight, function (err, steemResponse) {
      if (err === null) {
        repository().save_new_upvote(author, permlink, (cb) => {
          if (cb) {
            return res.json({ data: 'Upvoted successfully', status: 200 })
          }
          return res.json({ data: 'Upvoted successfully but failed to save to database', status: 200 })
        });
      } else {
        if (err.error === 'invalid_grant') {
          return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
        } else {
          return res.json({ data: err.error_description, status: 400 })
        }
      }
    });
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
})

/* follow  */
router.post('/follow', util.isAuthenticatedJSON, async (req, res) => {
  try {
    await check('author').trim().notEmpty().withMessage('author is required').run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ data: errors.array()[0].msg, status: 400 });
    }

    let follower = "";
    if (req.session.steemconnect) {
      follower = req.session.steemconnect.name;
    }

    if (follower == '' && req.cookies.steemconnect_name) {
      follower = req.cookies.steemconnect_name;
    }

    if (follower === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }

    let follow = req.body.author
    let token = req.session.access_token;
    repository().refresh_token(token, req);
    steem.follow(follower, follow, function (err, steemResponse) {
      if (err === null) {
        setTimeout(() => {
          repository().get_user_following(follower);
        }, 7000);
        setTimeout(() => {
          return res.json({ data: 'Followed ' + follow + ' successfully', status: 200 });
        }, 5000);
      } else {
        if (err.error === 'invalid_grant') {
          return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
        } else {
          return res.json({ data: err.error_description, status: 400 })
        }
      }
    });
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
})

/* unfollow  */
router.post('/unfollow', util.isAuthenticatedJSON, async (req, res) => {
  try {
    await check('author').trim().notEmpty().withMessage('author is required').run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ data: errors.array()[0].msg, status: 400 });
    }

    let follower = "";
    if (req.session.steemconnect) {
      follower = req.session.steemconnect.name;
    }

    if (follower == '' && req.cookies.steemconnect_name) {
      follower = req.cookies.steemconnect_name;
    }

    if (follower === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }

    let follow = req.body.author;
    let token = req.session.access_token;
    repository().refresh_token(token, req);
    steem.unfollow(follower, follow, function (err, steemResponse) {
      if (err === null) {
        setTimeout(() => {
          repository().get_user_following(follower);
        }, 7000);
        setTimeout(() => {
          return res.json({ data: 'Unfollowed ' + follow + ' successfully', status: 200 })
        }, 5000);
      } else {
        if (err.error === 'invalid_grant') {
          return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
        } else {
          return res.json({ data: err.error_description, status: 400 })
        }
      }
    });
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
})

/* POST a DownVote broadcast to STEEM network. */
router.post('/downVote', util.isAuthenticatedJSON, async (req, res) => {
  try {
    await check('author').trim().notEmpty().withMessage('author is required').run(req);
    await check('permlink').trim().notEmpty().withMessage('permlink is required').run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ data: errors.array()[0].msg, status: 400 });
    }

    let voter = "";
    if (req.session.steemconnect) {
      voter = req.session.steemconnect.name;
    }

    if (voter == '' && req.cookies.steemconnect_name) {
      voter = req.cookies.steemconnect_name;
    }

    if (voter === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }

    let is_remove = req.body.is_remove || 1;
    let author = req.body.author;
    let permlink = req.body.permlink;
    let link = author + '/' + permlink;
    FeedsModel.get_voting_weight(voter, link, (result) => {
      let weight = -result;
      let token = req.session.access_token;
      let label = '';
      if (parseInt(is_remove) === 1) {
        weight = 0;
        label = 'Removed vote';
      } else {
        label = 'Downvoted';
        if (result === 0) {
          return res.json({ data: 'Invalid voting weight', status: 400 })
        }
      }
      repository().refresh_token(token, req);
      steem.vote(voter, author, permlink, weight, function (err, steemResponse) {
        if (err === null) {
          repository().remove_upvote(author, permlink, (cb) => {
            if (cb) {
              return res.json({ data: label + ' successfully', status: 200 })
            }
            return res.json({ data: label + ' successfully but failed to save to database', status: 200 })
          });
        } else {
          if (err.error === 'invalid_grant') {
            return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
          } else {
            return res.json({ data: err.error_description, status: 400 })
          }
        }
      });
    });
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
})

/* POST a comment broadcast to STEEM network. */
router.post('/comment', util.isAuthenticatedJSON, async (req, res) => {
  try {
    await check('parentTitle').trim().notEmpty().withMessage('parentTitle is required').run(req);
    await check('parentPermlink').trim().notEmpty().withMessage('parentPermlink is required').run(req);
    await check('parentAuthor').trim().notEmpty().withMessage('parentAuthor is required').run(req);
    await check('message').unescape().trim().notEmpty().withMessage('message is required').isLength({ min: 1, max: ENV.character_limit })
      .withMessage('message is limited only to ' + ENV.character_limit + ' characters.').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ data: errors.array()[0].msg, status: 400 });
    }

    let author = "";
    if (req.session.steemconnect) {
      author = req.session.steemconnect.name;
    }

    if (author === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }

    let parentPermlink = req.body.parentPermlink;
    let permlink = 're-'+util.urlString();
    let title = req.body.parentTitle;
    let body = req.body.message;
    let parentAuthor = req.body.parentAuthor;
    let post_has_rewards = req.body.post_has_rewards || false;
    let comment_options = '';
    let max_accepted_payout = ENV.max_accepted_payout;
    let percent_steem_dollars = ENV.percent_steem_dollars;
    if (ENV.enable_comment_options) {
      if(!post_has_rewards){
        max_accepted_payout = '0.000 HBD';
        percent_steem_dollars = 0;
      }
      comment_options = {
        author: author,
        permlink: permlink,
        max_accepted_payout: max_accepted_payout,
        percent_steem_dollars: percent_steem_dollars,
        allow_votes: true,
        allow_curation_rewards: true,
        extensions: []
      };
    }

    let token = req.session.access_token;
    repository().refresh_token(token, req);
    steem.comment(parentAuthor, parentPermlink, author, permlink, title, body, '', comment_options, (err, steemResponse) => {
      if (err === null) {
        let feed = {
          author: author,
          permlink: permlink,
          title: title,
          parent_author: parentAuthor,
          parent_permlink: parentPermlink,
          body: body,
          tags: [],
          created: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
          category: ENV.primary_tag,
          max_accepted_payout: max_accepted_payout,
          percent_steem_dollars: percent_steem_dollars,
        };
        repository().save_new_comment2(feed, (cb) => {
          return res.json({ data: 'Successfully posted to HIVE network', status: 200 })
        });
        // repository().save_new_comment(author, permlink, (cb) => {
        //   return res.json({ data: 'Successfully posted to HIVE network', status: 200 })
        // });
      } else {
        if (err.error === 'invalid_grant') {
          return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
        } else {
          return res.json({ data: err.error_description, status: 400 })
        }
      }
    });
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
});

router.post('/reblog', util.isAuthenticatedJSON, async (req, res) => {
  try {
    await check('author').trim().notEmpty().withMessage('author is required').run(req);
    await check('permlink').trim().notEmpty().withMessage('permlink is required').run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ data: errors.array()[0].msg, status: 400 });
    }

    let username = "";
    if (req.session.steemconnect) {
      username = req.session.steemconnect.name;
    }

    if (username == '' && req.cookies.steemconnect_name) {
      username = req.cookies.steemconnect_name;
    }

    if (username === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }

    let author = req.body.author;
    let permlink = req.body.permlink;
    let token = req.session.access_token;
    repository().refresh_token(token, req);
    steem.reblog(username, author, permlink, (err, result) => {
      if (err === null) {
        repository().save_new_reblog(author, permlink, username, (cb) => {
          if (cb) {
            return res.json({ data: 'Successfully reblogged post', status: 200 });
          }
          return res.json({ data: 'Successfully reblogged post but failed to save to database', status: 200 })
        });
      } else {
        if (err.error === 'invalid_grant') {
          return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
        } else {
          return res.json({ data: err.error_description, status: 400 })
        }
      }

    });
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
})

router.post('/delete', util.isAuthenticatedJSON, async (req, res) => {
  try {
    await check('author').trim().notEmpty().withMessage('author is required').run(req);
    await check('permlink').trim().notEmpty().withMessage('permlink is required').run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ data: errors.array()[0].msg, status: 400 });
    }

    let username = "";
    if (req.session.steemconnect) {
      username = req.session.steemconnect.name;
    }

    if (username == '' && req.cookies.steemconnect_name) {
      username = req.cookies.steemconnect_name;
    }

    if (username === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }
    
    let author = req.body.author;
    let permlink = req.body.permlink;
    if(author !== username){
      return res.json({ data: 'Not allowed to delete other author\'s post.', status: 400 });
    }

    let token = req.session.access_token;
    repository().refresh_token(token, req);
    steem.deleteComment(author, permlink, (err, result) => {
      if (err === null) {
        let url = author +'/'+ permlink;
        FeedsModel.update_delete_status(url,1,(result2) =>{
          if (result2) {
            return res.json({ data: 'Successfully deleted post', status: 200 });
          }
          return res.json({ data: 'Successfully deleted post but failed to save to database', status: 200 })
        })
      } else {
        if (err.error === 'invalid_grant') {
          return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
        } else {
          return res.json({ data: err.error_description, status: 400 })
        }
      }

    });
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
})


router.post('/community/subscribe', util.isAuthenticatedJSON, (req, res) => {
  try {
    let username = "";
    if (req.session.steemconnect) {
      username = req.session.steemconnect.name;
    }

    if (username == '' && req.cookies.steemconnect_name) {
      username = req.cookies.steemconnect_name;
    }

    if (username === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }

    let token = req.session.access_token;
    repository().refresh_token(token, req);
    steem.subscribe(username, ENV.primary_tag, (err, result) => {
      if (err === null) {
        UserModel.change_ismember_status(username, 1, (result) => {
          return res.json({ data: 'Successfully subscribed to community', status: 200 });
        });
      } else {
        if (err.error === 'invalid_grant') {
          return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
        } else {
          return res.json({ data: err.error_description, status: 400 })
        }
      }
    })
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
})

router.post('/community/unsubscribe', util.isAuthenticatedJSON, (req, res) => {
  try {
    let username = "";
    if (req.session.steemconnect) {
      username = req.session.steemconnect.name;
    }

    if (username == '' && req.cookies.steemconnect_name) {
      username = req.cookies.steemconnect_name;
    }

    if (username === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }

    let token = req.session.access_token;
    repository().refresh_token(token, req);
    steem.unsubscribe(username, ENV.primary_tag, (err, result) => {
      if (err === null) {
        UserModel.change_ismember_status(username, 0, (result) => {
          return res.json({ data: 'Successfully subscribed to community', status: 200 });
        });
      } else {
        if (err.error === 'invalid_grant') {
          return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
        } else {
          return res.json({ data: err, status: 400 })
        }
      }
    })
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
})


router.post('/community/flag-post', util.isAuthenticatedJSON, async (req, res) => {
  try {
    await check('author').trim().notEmpty().withMessage('author is required').run(req);
    await check('permlink').trim().notEmpty().withMessage('permlink is required').run(req);
    await check('notes').trim().notEmpty().withMessage('notes is required').run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ data: errors.array()[0].msg, status: 400 });
    }

    let username = "";
    if (req.session.steemconnect) {
      username = req.session.steemconnect.name;
    }

    if (username == '' && req.cookies.steemconnect_name) {
      username = req.cookies.steemconnect_name;
    }

    if (username === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }

    let author = req.body.author;
    let permlink = req.body.permlink;
    let notes = req.body.notes;
    let token = req.session.access_token;
    repository().refresh_token(token, req);
    steem.flagPost(username, author, ENV.primary_tag, permlink, notes, (err, result) => {
      if (err === null) {
        return res.json({ data: 'Successfully flagged post', status: 200 });
      } else {
        if (err.error === 'invalid_grant') {
          return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
        } else {
          return res.json({ data: err, status: 400 })
        }
      }
    })
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
});

router.post('/witness/vote', util.isAuthenticatedJSON, async (req, res) => {
  try {
    await check('witness').trim().notEmpty().withMessage('witness is required').run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ data: errors.array()[0].msg, status: 400 });
    }

    let username = "";
    if (req.session.steemconnect) {
      username = req.session.steemconnect.name;
    }

    if (username == '' && req.cookies.steemconnect_name) {
      username = req.cookies.steemconnect_name;
    }

    if (username === '') {
      return res.json({ data: 'Please login again.', status: 400 });
    }

    let witness = req.body.witness;
    let token = req.session.access_token;
    repository().refresh_token(token, req);
    steem.witnessVote(username, witness, true, (err, result) => {
      if (err === null) {
        return res.json({ data: 'Successfully voted witness', status: 200 });
      } else {
        if (err.error === 'invalid_grant') {
          return res.json({ data: 'The token has invalid role. Please login again.', status: 400 })
        } else {
          return res.json({ data: err, status: 400 })
        }
      }
    })
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
});


router.post('/user/change-status', async (req, res) => {
  try {
    await check('username').trim().notEmpty().withMessage('username is required').run(req);
    await check('is_online').trim().notEmpty().withMessage('is_online is required').run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ data: errors.array()[0].msg, status: 400 });
    }
    let username = req.body.username;
    let status = req.body.is_online;

    UserModel.change_online_status(username, status, (updated) => {
      if (updated) {
        return res.json({ data: 'Status successfully updated', status: 200 })
      }
      return res.json({ data: 'Failed to update status', status: 400 })
    });
  } catch (error) {
    return res.json({ data: error, status: 400 });
  }
})



module.exports = router;
