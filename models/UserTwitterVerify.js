const _Model = require('./model')();

var _this = {
    build: () =>
    {
        _Model.table = 'user_twitter_verify';
        return _Model;
    },

    insert : ($data, cb) => {
        _this.build().set('steem_id',$data.steem_id).set('username',$data.username).set('generated_id',$data.generated_id).insert((insertedUsers) => 
        {   
            if(insertedUsers){
                cb(true);
            }else{
                cb(false);
            }
        });
    },
    
    change_verified_status : ($id,$twitter_id,$screenname, cb) => {
        const today = new Date();
        _this.build().set('is_verified',1).set('verified_dt',today).set('twitter_id',$twitter_id).set('screenname',$screenname).update($id, (result) => {
            if(result){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    set_twitter_id : ($generated_id,$twitter_id, cb) => {
        _this.get_user_by_generated_id($generated_id,(tweet) => {
            if(tweet){
                _this.build().set('twitter_id',$twitter_id).update(tweet.id, (result) => {
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

    set_last_checkdate : ($generated_id, cb) => {
        let datenow = new Date();
        _this.get_user_by_generated_id($generated_id,(tweet) => {
            if(tweet){
                _this.build().set('last_check_date',datenow).update(tweet.id, (result) => {
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


    check_if_exist : ($username, cb) => {
        _this.build().where('username', $username).first((user) => 
        {
            if(user){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    check_if_verified : ($username, cb) => {
        _this.build().where('username', $username).where('is_verified',1).first((user) => 
        {
            if(user){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    get_user : ($username, cb) => {
        _this.build().where('username', $username).first((user) => 
        {
            cb(user);
        });
    },

    get_user_by_generated_id : ($generated_id, cb) => {
        _this.build().where('generated_id', $generated_id).first((user) => 
        {
            cb(user);
        });
    },

    get_user_by_twitter_id : ($twitter_id, cb) => {
        _this.build().where('twitter_id', $twitter_id).first((user) => 
        {
            cb(user);
        });
    },

    get_user_duplicate : ($generated_id, cb) => {
        _this.get_user_by_generated_id($generated_id,(result) => {
            if(result){
                _this.get_user_by_twitter_id(result.twitter_id,(duplicate) => {
                    if(duplicate){
                        result.duplicate = duplicate;
                    }
                    cb(result);
                });
            }else{
                cb(result);
            }
        });
    },

    get_all_unverified : (cb) => {
        _this.build().where('is_verified', 0).get((user) => 
        {
            cb(user);
        });
    },

    get_all_verified : (cb) => {
        _this.build().where('is_verified', 1).get((user) => 
        {
            cb(user);
        });
    },

    get_generated_id : ($username,cb) => {
        _this.build().where('username', $username).first((user) => 
        {   
            if(user){
                cb(user.generated_id);
            }else{
                cb(null);
            }
        });
    },


    check_twitter_id_exists : ($twitter_id,cb) => {
        _this.build().where('twitter_id', $twitter_id).first((user) => 
        {
            if(user){
                cb(true);
            }else{
                cb(false);
            }
        });
    },
};

function UserTwitterVerify()
{
    return _this;
}

module.exports = UserTwitterVerify;