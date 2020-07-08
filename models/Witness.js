const _Model = require('./model')();

var _this = {
    build: () =>
    {
        _Model.table = 'witnesses';
        return _Model;
    },

    insert : ($data, cb) => {
        _this.build().set('username',$data.username)
                     .set('witness_info', $data.witness_info)
                     .set('metadata', $data.metadata)
                     .set('is_supported', $data.is_supported).insert((inserted) => 
        {   
            if(inserted){
                cb(true);
            }else{
                cb(false);
            }
        });
    },

    update : ($id,$data, cb) => {
        _this.build().set('metadata', $data.metadata)
                     .set('witness_info', $data.witness_info).update($id,(result) => 
        {   
            if(result){
                cb(true);
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

    search_witness: ($q,$limit,$offset, cb) => {
        _this.build().where('username', 'LIKE','%'+$q+'%').where('is_supported',1).get((result) => 
        {
            cb(result);
        },$limit,$offset);
    },

    get_witness : ($username, cb) => {
        _this.build().where('username', $username).first((user) => 
        {
            cb(user);
        });
    },
};

function Witness()
{
    return _this;
}

module.exports = Witness;