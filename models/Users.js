const _Model = require('./model')();

var _this = {
    build: () =>
    {
        _Model.table = 'users';
        return _Model;
    },

    insert : ($data, cb) => {
        _this.build().set('username',$data.username)
                     .set('steem_id', $data.steem_id)
                     .set('metadata', $data.metadata)
                     .set('is_member', $data.is_member)
                     .set('follower_count', $data.follower_count)
                     .set('following_count', $data.following_count).insert((insertedUsers) => 
        {   
            if(insertedUsers){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    update : ($id,$data, cb) => {
        _this.build().set('metadata', $data.metadata)
                     .set('is_member', $data.is_member)
                     .set('follower_count', $data.follower_count)
                     .set('following_count', $data.following_count).update($id,(result) => 
        {   
            if(result){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    get_all : (cb) => {
        _this.build().where('status', 1).get((user) => 
        {
            cb(user);
        });
    },

    
    get_all_members : (cb) => {
        _this.build().where('status', 1).where('is_member',1).get((user) => 
        {
            cb(user);
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

    get_user : ($username, cb) => {
        _this.build().where('username', $username).first((user) => 
        {
            cb(user);
        });
    },

    search_user: ($q,$limit,$offset, cb) => {
        _this.build().where('username', 'LIKE', '%'+$q+'%').get((result) => 
        {
            cb(result);
        },$limit,$offset);
    },

    change_ismember_status: ($username,$is_member,cb) => {
        _this.get_user($username,(user) => {
            if(user){
                _this.build().set('is_member', $is_member).update(user.id,(result) => 
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

    change_online_status: ($username,$is_online,cb) => {
        _this.get_user($username,(user) => {
            if(user){
                _this.build().set('is_online', $is_online).update(user.id,(result) => 
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

    update_access_token : ($username,$access_token, cb) => {
        _this.get_user($username,(user) => {
            if(user){
                _this.build().set('access_token', $access_token).update(user.id,(result) => 
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
};

function Users()
{
    return _this;
}

module.exports = Users;