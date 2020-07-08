const _db = require('../modules/database');

var _this = {
    table: '',
    params: [],
    _select_sql: '',
    _set_sql: '',

    DB: () =>
    {
        return new _db();
    },

    raw: ($sql, $params = [], cb = null) =>
    {
        _this.DB().query($sql, $params, 'custom', (result) =>
        {
            if (cb) {
                cb(result);
            }
        });
    },

    all: (cb = null) =>
    {
        _this.DB().query(`SELECT * FROM ${_this.table}`, [], 'select', (result) =>
        {
            if (cb) {
                cb(result);
            }
        });
    },

    where: (...$cond) =>
    {
        if ($cond.length === 2) {
            if (_this._select_sql.indexOf('WHERE') < 0) {
                _this._select_sql += ` WHERE ${$cond[0]} = ?`;
            } else {
                _this._select_sql += ` AND ${$cond[0]} = ?`;
            }
            _this.params.push($cond[1]);
        } else if ($cond.length === 3) {
            if (_this._select_sql.indexOf('WHERE') < 0) {
                _this._select_sql += ` WHERE ${$cond[0]} ${$cond[1]} ?`;
            } else {
                _this._select_sql += ` AND ${$cond[0]} ${$cond[1]} ?`;
            }
            _this.params.push($cond[2]);
        }
        return _this;
    },

    set: ($col, $value) =>
    {
        if (_this._set_sql.indexOf('SET') < 0) {
            _this._set_sql += ` SET ${$col} = ?`;
            _this.params.push($value);
        } else {
            _this._set_sql += `, ${$col} = ?`;
            _this.params.push($value);
        }
        return _this;
    },

    orderBy: ($col, $order = 'ASC') =>
    {
        _this._select_sql += ` ORDER BY ${$col} ${$order.toUpperCase()}`;
        return _this;
    },

    groupBy: ($col) =>
    {
        _this._select_sql += ` GROUP BY ${$col}`;
        return _this;
    },

    get: (cb = null, $limit = 0, $offset = 0) =>
    {
        let sql = 'SELECT * FROM ' + _this.table + _this._select_sql;
        if ($limit > 0) {
            sql = sql + ` LIMIT ${$offset}, ${$limit}`; 
        }
        const params = _this.params;
        _this._select_sql = '';
        _this.params = [];
        _this.DB().query(sql, params, 'select', (result) =>
        {
            if (cb) {
                cb(result);
            }
        });
    },

    find: ($id, cb = null, $id_column = 'id') =>
    {
        const sql = 'SELECT * FROM ' + _this.table + ` WHERE ${$id_column} = ${$id} LIMIT 1`;
        _this.DB().query(sql, [], 'select', (result) =>
        {
            if (cb) {
                if (result) {
                    if (result.length > 0) {
                        cb(result[0]);
                    } else {
                        cb(null);
                    }
                } else {
                    cb(null);
                }
            }
        });
    },

    first: (cb = null) =>
    {
        const sql = 'SELECT * FROM ' + _this.table + _this._select_sql + ' LIMIT 1';
        const params = _this.params;
        _this._select_sql = '';
        _this.params = [];
        _this.DB().query(sql, params, 'select', (result) =>
        {
            if (cb) {
                if (result) {
                    if (result.length > 0) {
                        cb(result[0]);
                    } else {
                        cb(null);
                    }
                } else {
                    cb(null);
                }
            }
        });
    },

    insert: (cb = null, $timestamp = true) =>
    {
        if ($timestamp) {
            _this.set('created_at', (new Date())).set('updated_at', (new Date()));
        }
        const sql = 'INSERT INTO ' + _this.table + _this._set_sql;
        const params = _this.params;
        _this._set_sql = '';
        _this.params = [];
        _this.DB().query(sql, params, 'insert', (result) =>
        {
            if (cb) {
                if (!result) cb(0);
                cb(result.insertId);
            }
        });
    },

    update: ($id, cb = null, $id_column = 'id', $timestamp = true) =>
    {
        if ($timestamp) {
            _this.set('updated_at', (new Date()));
        }
        let sql = 'UPDATE ' + _this.table + _this._set_sql + ' WHERE ' + $id_column + ' = ' + $id;
        const params = _this.params;
        _this._set_sql = '';
        _this.params = [];
        _this.DB().query(sql, params, 'update', (result) =>
        {
            if (cb) {
                cb(result);
            }
        });
    },

    count: (cb = null) =>
    {
        const sql = 'SELECT COUNT(*) as count FROM ' + _this.table + _this._select_sql;
        const params = _this.params;
        _this._select_sql = '';
        _this.params = [];
        _this.DB().query(sql, params, 'count', (result) =>
        {
            if (cb) {
                if (result) {
                    cb(result[0].count);
                }
            }
        });
    },
};

function Model()
{
    return _this;
}

module.exports = Model;
