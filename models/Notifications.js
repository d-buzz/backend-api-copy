const _Model = require('./model')();
const UserModel = require('./Users'); 

var _this = {
    Users: () => {
        return UserModel();
    },

    build: () =>
    {
        _Model.table = 'notifications';
        return _Model;
    },

    insert : ($data, cb) => {
        _this.build().set('username',$data.username)
                     .set('sender', $data.sender)
                     .set('type', $data.type)
                     .set('date', $data.date)
                     .set('notif_id', $data.notif_id)
                     .set('url', $data.url)
                     .set('parent_url', $data.parent_url)
                     .set('sender_metadata', $data.sender_metadata)
                     .set('msg', $data.msg).insert((inserted) => 
        {   
            if(inserted){
                cb(true);
            }else{
                cb(false);
            }
        });
    },
    
    update : ($id,$data, cb) => {
        _this.build().set('sender_metadata', $data.sender_metadata)
                     .set('parent_url', $data.parent_url).update($id,(result) => 
        {   
            if(result){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    check_if_exist : ($username, $url, cb) => {
        _this.build().where('username', $username).where('url', $url).first((user) => 
        {
            if(user){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    get_notif : ($username, $url, cb) => {
        _this.build().where('username', $username).where('url', $url).first((notif) => 
        {
            _this.mapper(notif,(mapped) => {
                cb(mapped);
            });
        });
    },

    get_notif_by_notif_id : ($notif_id, cb) => {
        _this.build().where('notif_id',$notif_id).first((notif) => 
        {
            _this.mapper(notif,(mapped) => {
                cb(mapped);
            });
        });
    },


    change_read_status : ($id,$is_read, cb) => {
        _this.build().set('is_read', $is_read).update($id,(result) => 
        {   
            if(result){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    change_all_read_status : ($username, cb) => {
        _this.build().raw(`UPDATE notifications SET is_read=? WHERE username=? AND is_read=?`,[1,$username,0],(result) => {
            cb(result);
        });
    },

    clear_all_notif : ($username, cb) => {
        _this.build().raw(`UPDATE notifications SET is_removed=?, is_read=? WHERE username=?`,[1,1,$username],(result) => {
            cb(result);
        });
    },


    get_all_unread_by_user : ($username,cb) => {
        _this.build().where('username', $username).where('is_read',0).get((notifs) => 
        {
            _this.mapped_notifs(notifs,(result) => {
                cb(result);
            });
        });
    },

    get_all_by_user : ($username,$limit,$offset, cb) => {
        _this.build().where('username', $username).where('is_removed',0).orderBy('date','DESC').get((notifs) => 
        {
            _this.mapped_notifs(notifs,(result) => {
                cb(result);
            });
        }, $limit, $offset);
    },

    get_counter : ($username, cb) => {
        _this.build().where('username', $username).get((result) => 
        {   
            let read = 0;
            let unread = 0;
            if(result){
                result.forEach(notif => {
                    if(notif.is_read === 1){
                        read += 1;
                    }else{
                        unread += 1;
                    }
                });
            }

            let counter = { read: read, unread: unread };
            cb(counter);

        });
    },

    count_all: ($username,cb) => {
        _this.build().where('username',$username).count((count) => 
        {   
            cb(count);
        });
    },

    mapped_notifs: (notifs,cb) => {
        let all_notifs = [];
        if(notifs && notifs.length > 0){
            let ind = 0;
            notifs.forEach(notif => {
                _this.mapper(notif,(mapped) => {
                    all_notifs.push(mapped);
                    ind++;
                    if(ind === notifs.length){
                        cb(all_notifs);
                    }
                });
            });
        }else{
            cb(notifs);
        }
    },

    mapper: (notif,cb) => {
        if(notif && notif.sender){
            _this.Users().get_user(notif.sender,(user) => {
                if(user && user.metadata){
                    notif.sender_metadata = user.metadata;
                }
                cb(notif);
            });
        }else{
            cb(notif);
        }
    }
};

function Notifications()
{
    return _this;
}

module.exports = Notifications;