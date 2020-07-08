const _Model = require('./model')();

var _this = {
    build: () =>
    {
        _Model.table = 'user_twitter_post';
        return _Model;
    },

    insert : ($data, cb) => {
        _this.build().set('username',$data.username)
                     .set('screenname',$data.screenname)
                     .set('hashtags',$data.hashtags)
                     .set('post',$data.post)
                     .set('post_date',$data.post_date)
                     .set('id_str',$data.id_str)
                     .set('source',$data.source)
                     .set('images',$data.images).insert((inserted) => 
        {   
            if(inserted){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    update : ($id,$data, cb) => {
        _this.build().set('images',$data.images).update($id,(updated) => 
        {   
            if(updated){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    get_post : ($id_str, cb) => {
        _this.build().where('id_str', $id_str).first((post) => 
        {
            cb(post);
        });
    },

    get_all_unposted : ($username, cb) => {
        _this.build().where('username', $username).where('is_posted_hive',0).where('is_posting',0).get((posts) => 
        {
            cb(posts);
        });
    },

    check_if_exist : ($id_str, cb) => {
        _this.build().where('id_str', $id_str).first((post) => 
        {
            if(post){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    check_if_posted : ($id_str, cb) => {
        _this.build().where('id_str', $id_str).where('is_posted_hive',1).first((post) => 
        {
            if(post){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    change_isposted_status : ($id_str,$hive_post_url, cb) => {
        const today = new Date();
        _this.get_post($id_str,(result) => {
            if(result){
                _this.build().set('is_posted_hive',1).set('is_posting',0).set('post_date_hive',today).set('hive_post_url',$hive_post_url).update(result.id, (result1) => {
                    if(result1){
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

    set_is_posting : ($id_str,$is_posting, cb) => {
        _this.get_post($id_str,(result) => {
            if(result){
                _this.build().set('is_posting',$is_posting).update(result.id, (result1) => {
                    if(result1){
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

    save_last_error : ($id_str,$last_error, cb) => {
        _this.get_post($id_str,(result) => {
            if(result){
                _this.build().set('last_error',$last_error).update(result.id, (result1) => {
                    if(result1){
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

    get_last_str_id: ($screename,cb) => {
        _this.build().where('screenname',$screename).orderBy('post_date','DESC').first((post) => 
        {   
            if(post){
                cb(post.id_str);
            }else{
                cb(null);
            }
        });
    },

    get_unposted_tweets: ($username,cb) => {
        _this.build().where('username',$username).where('is_posted_hive',0).orderBy('post_date','DESC').first((post) => 
        {   
            cb(post);
        });
    }
};

function UserTwitterPosts()
{
    return _this;
}

module.exports = UserTwitterPosts;