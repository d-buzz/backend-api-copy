const _socket = require('../utility/socket');
const tweet = require('./twitterconnect');
const ModelModule = require('../models/module');
const util = require('./util');
const time_interval_tweet_search = 15; // minutes
var _this = {
    User:() => {
        return ModelModule.UserTwitterVerify();
    },
    Socket: () => {
        return new _socket().buildSignal('twitterchecker');
    },
    start: () => {
        console.info('Twitter Checker Initiated');
        _this.getUnverifiedUsers();
        _this.Socket().listen('wake-signal', (packet) => {
            if (packet.data.module === 'twitterchecker') {
                console.info(packet.data.function, 'is awaken');
                _this[packet.data.function]();
            }
        });

        _this.Socket().hear_signal('checkTwitterId', (data) => {
            _this.getUnverifiedUsers();
        });
    },
    waker: ($func, $default_sec = 60) => {
        _this.Socket().waker('twitterchecker', $func, $default_sec);
    },

    getUnverifiedUsers: () => {
        _this.waker('getUnverifiedUsers');
        _this.User().get_all_unverified(result => {
            if(result && result.length > 0){
                result.forEach(user => {
                    if(user.last_check_date !== null){
                        let diff = util.timeDifference(user.last_check_date,'minutes');
                        if(parseInt(diff) > parseInt(time_interval_tweet_search)){
                            _this.searchGeneratedIdToTwitter(user);
                        }
                    }else{
                        _this.searchGeneratedIdToTwitter(user);
                    }
                });
            }else{
                console.log('getUnverifiedUsers error:','No user found');
                _this.Socket().signal('getUnverifiedUsers', false);
                return false;
            }
        });
    },

    searchGeneratedIdToTwitter: async (user) => {
        if(!user){
            console.log('searchGeneratedIdToTwitter error:','No user found');
            _this.Socket().signal('searchGeneratedIdToTwitter', false);
            return false;
        }
        let query = user.generated_id;
        try {
            const response = await tweet.get("search/tweets",{
                q : query,
                count: 1,
                result_type: 'recent'
            });
            if(response && response.statuses.length > 0){
                response.statuses.forEach(status => {
                    let twitter_res = status;
                    let twitter_id = twitter_res.user.id;
                    let screenname = twitter_res.user.screen_name;
                    _this.checkTwitterId(user,twitter_id,screenname);
                });
                return true;
            }else{
                _this.setLastCheckDate(user.generated_id);
                console.log('No tweets found for query '+ query);
            }
        } catch (error) {
            console.log('searchGeneratedIdToTwitter error:',error);
            _this.Socket().signal('searchGeneratedIdToTwitter', false);
        } 
    },

    checkTwitterId: (user,twitter_id,screenname) => {
        _this.setLastCheckDate(user.generated_id);
        _this.User().check_twitter_id_exists(twitter_id,(result) => {
            if(!result){
                _this.setUserAsVerified(user,twitter_id,screenname);
            }else{
                _this.User().set_twitter_id(user.generated_id,twitter_id,(result) => {
                    if(!result){
                        console.log('Failed to save twitter ID');
                    }
                    console.log('Twitter ID: '+twitter_id +' was already verified. Not valid for code ',user.generated_id);
                    _this.Socket().signal('checkTwitterId', false);
                });
            }
        });
    },

    setUserAsVerified: (user,twitter_id,screenname) => {
        if(user.id && twitter_id){
            _this.User().change_verified_status(user.id,twitter_id,screenname,(res) => {
                if(!res){
                    console.log('setUserAsVerified error:','Failed to change status');
                }else{
                    console.log('User '+ user.username + ' was set to VERIFIED');
                }
            });
        }else{
            console.log('setUserAsVerified error:','Invalid arguments');
        }
    },

    setLastCheckDate : (generated_id) => {
        _this.User().set_last_checkdate(generated_id,(updated) => {
            if(updated){
                console.log('Updated last check date of ',generated_id);
            }
        });
    }
};

function twitterchecker() {
    return _this;
}

module.exports = twitterchecker;