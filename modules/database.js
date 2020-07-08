const mysql = require('mysql');
const ENV = require('../env');
const _socket = require('../utility/socket');

const Connection = mysql.createConnection({
    host: ENV.DATABASE.HOST,
    database: ENV.DATABASE.DATABASE,
    user: ENV.DATABASE.USER,
    password: ENV.DATABASE.PASS,
});

var _this = {
    Socket: () =>
    {
        return new _socket();
    },

    query: ($sql, $params = [], $type = 'select', cb = null) => {
        Connection.query($sql, $params, (err, results, fields) => {
            if (err) {
                _this.Socket().throw($type, err);
                if (cb) {
                    cb(null);
                }
            } else {
                _this.Socket().result($type, results);
                if (cb) {
                    cb(results);
                }
            }
        });
    },
};

function Database()
{
    return _this;
}

module.exports = Database;