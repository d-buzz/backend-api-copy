const ENV = require('../env');
const fs = require('fs');
const request = require('request');
const config = require('../config');
const path = require('path');
const moment = require('moment');
const utf8 = require('utf8');
const metafetch = require('metafetch');

module.exports.urlString = () => {
  let string = ''
  let allowedChars = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 15; i++) {
    string += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
  }
  return string;
}

module.exports.removeHastags = (str) => {
  var tags = /\#[A-Z0-9]*[-A-Z0-9]/gim;
  var lb = /(\r\n|\n|\r)/gm;
  str = str.replace(lb, " ");
  if (str.match(tags)) {
    let hashtags = str.match(tags);
    if(hashtags.length > 0){
      hashtags.forEach(hashtag => {
            str = str.replace(hashtag,"");
        });
    }
  }
  return str;
}

module.exports.trimLineBreak = (str) => {
  var lb = /(\r\n|\n|\r)/gm;
  str = str.replace(lb, " ");
  return str;
}

module.exports.timeDifference = (diffdate, type) => {
  let datenow = new Date();
  var x = new moment(datenow);
  var y = new moment(diffdate);
  return x.diff(y, type); // seconds, minutes, days
}

module.exports.decodeSafeUrl = (str) => {
  const valueBase64 = decodeURI(str);
   return Buffer.from(valueBase64, 'base64').toString();
}

module.exports.urlMetaFetch = (url, cb) => {
  metafetch.fetch(url, { 
      flags: { 
          headers: false,
          links: false,
          meta: false
      },
      http: {
          timeout: 30000,
          headers: {
              Accept: "*/*"
          }
      }
  }).then(function(meta){
    if(!meta.image && (meta.images && meta.images.length > 0)){
      meta.image = meta.images[0];
    }
    if(!meta.title && meta.siteName){
      meta.title = meta.siteName;
    }
      cb({ data: meta, status: 200 });
  }).catch(function(error) {
      cb({ data: error, status: 400 });
  });
}

module.exports.removeSpecificTagFromArray = (tags=[],to_remove='') => {
  if(tags.length > 0 && to_remove!=''){
    const index = tags.indexOf(to_remove);
    if (index > -1) {
      tags.splice(index, 1);
    }
  }
  return tags;
}

module.exports.randomNumber = () => {
  let num = '';
  let allowedChars = "0123456789";
  for (var i = 0; i < 20; i++) {
    num += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
  }
  return num;
}

module.exports.isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
}

module.exports.getContentLinkToPreview = (str) => {
  var urls = /(\b(https?|ftp):\/\/[(A-Z0-9+&@#\/%?=~_|!:,.;-]*[-A-Z0-9+&@#\/%=~_])/gim;
  var img_url = /((\(|\)?)\b(http(s)?:\/\/[(\(|\)?)A-Z0-9+&@#\/%?=~_|!:,.;-]*[-A-Z0-9+&@#\/%=~_(\)|\)?)])*[^\s]\.(?:jpg|jpeg|gif|png)(\)|\))?)/gim;
  var youtube_link = /(\b(http(s)?:\/\/)?((w){3}.)?(m.)?youtu(be|.be)?(\.com)?\/[^\s]+)/gim;
  var steemit_images = /(\b(http(s)?:\/\/)?((w){3}.)?steemitimages?(\.com)?\/[^\s]+)/gim;
  var other_img_link = /(\!\[\]\s?)*(\(\s|\(?)(http(s)?:\/\/.*format=(?:png|jpg|jpeg)*[^\s]+)/gim;
  var threespeak_link = /(\b(http(s)?:\/\/)?((w){3}.)?3speak.online\/watch\?[^\s]+)/gim;
  let link_to_preview = '';
  let has_media = false;

  if (str.match(img_url)) {
    let images = str.match(img_url);
    if(images && images.length > 0){
      has_media = true;
    }
  }

  if (str.match(steemit_images)) {
    let steemit_imgs = str.match(steemit_images);
    if (steemit_imgs.length > 0) {
      has_media = true;
    }
  }

  if (str.match(other_img_link)) {
    let other_imgs = str.match(other_img_link);
    if (other_imgs.length > 0) {
      has_media = true;
    }
  }

  // check if has youtube link
  if (str.match(youtube_link)) {
    let yt_link = str.match(youtube_link);
    if (yt_link.length > 0) {
      has_media = true;
    }
  }

  if (str.match(threespeak_link)) {
    let vid_link = str.match(threespeak_link);
    if (vid_link.length > 0) {
      has_media = true;
    }
  }
  

  if(!has_media){
    let _links = str.match(urls);
    if(_links){
      link_to_preview = _links[0];
    }
  }
  return link_to_preview;
}


module.exports.filterToSpecificTag = (data, tag = ENV.primary_tag) => {
  let resultsArray = [];
  if(data.length > 0){
    for (res in data) {
      if (data[res].category == tag) {
        let checker = this.passCharacterLimit(data[res].body);
        if (checker) {
          resultsArray.push(data[res]);
        }
      }
    }
  }
  return resultsArray;
}

module.exports.filterToCharLimitUtf8Decode = (data) => {
  let resultsArray = [];
  if(data.length > 0){
    for (res in data) {
      let content = utf8.decode(data[res].body);
      let checker = this.passCharacterLimit(content);
      if (checker) {
        resultsArray.push(data[res]);
      }
    }
  }
  return resultsArray;
}

module.exports.filterToCharLimit = (data) => {
  let resultsArray = [];
  if(data.length > 0){
    for (res in data) {
      let checker = this.passCharacterLimit(data[res].body);
      if (checker) {
        resultsArray.push(data[res]);
      }
    }
  }
  return resultsArray;
}

module.exports.passCharacterLimit = (string) => {
  let char_limit = ENV.character_limit;
  if (string.length <= char_limit) {
    return true;
  }
  return false;
}

module.exports.isFollowing = (follower, following) => {
  let is_follower = false;
  let dir = path.resolve(__dirname, '../cache/following/' + follower + '.json');
  if (this.checkFileExists(dir) && fs.readFileSync(dir, 'utf8')) {
    const followJson = JSON.parse(fs.readFileSync(dir, 'utf8'));
    if (followJson) {
      followJson.following.forEach(val => {
        if (val.username === following) {
          is_follower = true;
        }
      });
    }
  }
  return is_follower;
}

module.exports.checkCacheFileHasData = (filepath) => {
  let has_data = false;
  let dir = path.resolve(__dirname, '../cache/' + filepath);
  if (this.checkFileExists(dir) && fs.readFileSync(dir, 'utf8')) {
    const followJson = JSON.parse(fs.readFileSync(dir, 'utf8'));
    if (followJson) {
      has_data = true;
    }
  }
  return has_data;
}


module.exports.downloadImage = (uri, filename, cb) => {
  request.head(uri, function (err, res, body) {
    if (!err && res.statusCode === 200) {
      request({url: uri,headers: {
        "Keep-Alive": "max=5000"
        }
      }).pipe(fs.createWriteStream(filename))
        .on("close", close => {
          cb(true);
        });
    } else {
      cb(false);
    }
  });
}

module.exports.checkFileExists = (path) => {
  if (fs.existsSync(path)) {
    return true;
  }
  return false;
}

module.exports.saveAuthorPhotos = (account) => {
  if (account.author_profile_pic) {
    let profile_url = account.author_profile_pic;
    let profile_filename = config.profile_img_path + '/' + account.author + '.jpg';
    if (!fs.existsSync(config.profile_img_path)) {
      fs.mkdirSync(config.profile_img_path);
    }
    if (!this.checkFileExists(profile_filename)) {
      this.downloadImage(profile_url, profile_filename, function (res) {
        if(res){
          console.log('done download profile photo of author ' + account.author);
        }else{
          console.log('failed to download profile photo of author ' + account.author);
        }
      });
    }
  }

  // save cover photo
  if (account.author_profile_cover) {
    let url = account.author_profile_cover;
    let filename = config.cover_img_path + '/' + account.author + '.jpg';
    if (!fs.existsSync(config.cover_img_path)) {
      fs.mkdirSync(config.cover_img_path);
    }
    if (!this.checkFileExists(filename)) {
      this.downloadImage(url, filename, function (res) {
        if(res){
          console.log('done download cover photo of author ' + account.author);
        }else{
          console.log('failed to download cover photo of author ' + account.author);
        }
      });
    }
  }
}

module.exports.getProfileImageLink = (json_metadata) => {
  let profile_url = null;
  if(this.isValidJson(json_metadata)){
    let metadata = JSON.parse(json_metadata);
    if (metadata.profile) {
      if (metadata.profile.profile_image) {
        profile_url = ENV.STEEM.IMAGES_URL + metadata.profile.profile_image;
      }
    }
  }
  return profile_url;
}

module.exports.getProfileCoverLink = (json_metadata) => {
  let profile_url = null;
  if(this.isValidJson(json_metadata)){
    let metadata = JSON.parse(json_metadata);
    if (metadata.profile) {
      if (metadata.profile.cover_image) {
        profile_url = ENV.STEEM.IMAGES_URL + metadata.profile.cover_image;
      }
    }
  }
  return profile_url;
}

module.exports.isValidJson = (text) => {
  if (typeof text !== "string") { 
    return false; 
  } 
  try { 
      JSON.parse(text); 
      return true; 
  } catch (error) { 
      return false; 
  } 
}

module.exports.isAuthenticated = (req, res, next) => {
  if (req.session.access_token || req.cookies.access_token || req.body.access_token){
    if(!req.session.access_token && req.body.access_token){
      req.session.access_token = req.body.access_token;
    }
    if(!req.session.access_token && req.body.access_token){
      req.session.access_token = req.body.access_token;
    }
    if(!req.session.steemconnect && req.body.steemconnect){
      req.session.steemconnect = JSON.parse(req.body.steemconnect);
    }
    // console.log('session',req.session.access_token);
    return next();
  }
    

  return res.redirect('/');
}

module.exports.isAuthenticatedJSON = (req, res, next) => {
  if (req.session.access_token || req.cookies.access_token || req.body.access_token){
    if(!req.session.access_token && req.cookies.access_token){
      req.session.access_token = req.cookies.access_token;
    }
    if(!req.session.access_token && req.body.access_token){
      req.session.access_token = req.body.access_token;
    }
    if(!req.session.steemconnect && req.body.steemconnect){
      req.session.steemconnect = JSON.parse(req.body.steemconnect);
    }
    return next();
  }
  return res.json({ data: 'Must Login', status: 400 });
}

module.exports.setUser = (req, res, next) => {
  if (req.session.steemconnect) {
    let metadata = {};
    if (req.session.steemconnect.json_metadata === '{}') {
      metadata.profile = { about: '', profile_image: '' }
    } else {
      metadata = JSON.parse(req.session.steemconnect.json_metadata)
    }
    res.locals.user = {
      name: req.session.steemconnect.name,
      profile: metadata.profile
    }
  }
  next();
}

module.exports.getRshareReward = (post, recent_claims, reward_balance, hive_price) => {
  const claim = post.net_rshares * post.reward_weight / 10000.0;
  const reward =
      Math.floor(1000.0 * claim * reward_balance / recent_claims) / 1000.0;

  // There is a payout threshold of 0.020 HBD.
  if (reward * hive_price < 0.02) return 0;

  const max_hive =
      parseFloat(post.max_accepted_payout.replace(" HBD", "")) / hive_price;

  return Math.min(reward, max_hive);
}


module.exports.payCurators = (post, max_reward_tokens) => {
  let unclaimed = max_reward_tokens;
  const total_weight = post.total_vote_weight;
  post.active_votes.forEach(vote => {
    // use Math.max(0, ..) to filter downvotes
    unclaimed -=
      Math.floor(
        1000.0 * Math.max(0, max_reward_tokens * vote.weight / total_weight)
      ) / 1000.0;
  });

  return Math.max(0, unclaimed);
}

module.exports.createPayout = (author_tokens, percent_hive_dollars, hbd_print_rate, current_hive_price) => {
  const hbd_hive = author_tokens * percent_hive_dollars / (2 * 10000.0);
  // if hbd_print_rate is below 10000, part of the payout is in hive instead of hBD
  const to_hive = hbd_hive * (10000 - hbd_print_rate) / 10000.0;
  const to_hbd = hbd_hive - to_hive;
  const vesting_hive = author_tokens - hbd_hive;

  return [
    Math.floor(1000.0 * to_hive) / 1000.0,
    Math.floor(1000.0 * to_hbd * current_hive_price) / 1000.0,
    Math.floor(1000.0 * vesting_hive) / 1000.0
  ];
}

