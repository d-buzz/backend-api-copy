const socketio = require('socket.io-client');
const config = require('../config');

const url = `${config.socket.host}:${config.socket.port}`;
const SteemsaysSocket = socketio(url, {
    path: '/steemsaysbot',
    forceNew: false,
});

var _this = {
    reg_data: {
        registered_at: (new Date()).toString(),
    },
    _signal_module: '',

    buildSignal: ($module) =>
    {
        _this._signal_module = $module;
        return _this;
    }, 

    connect: () => {
        SteemsaysSocket.on('connect', () => {
            console.log('Connected as ID: ' + SteemsaysSocket.id);
        });
    },

    listen: ($event, cb = null) => {
        SteemsaysSocket.on($event, (data) => {
            cb(data);
        });
    },

    waker: ($module, $function, $default_sec) =>
    {
        SteemsaysSocket.emit('waker-signal', {
            module: $module,
            function: $function,
            current_sec: $default_sec,
            default_sec: $default_sec,
        });
    },

    signal: ($func, $data) => {
        SteemsaysSocket.emit('module-signal', {
            module: _this._signal_module + $func,
            data: $data,
        });
    },

    hear_signal: ($func, cb = null) =>
    {
        _this.listen(_this._signal_module + $func, (data) =>
        {
            if (cb) {
                cb(data);
            }
        });
    },

    throw: ($type, $err) => {
        const packets = {
            type: $type,
            data: $err,
        };
        SteemsaysSocket.emit('query-error', packets);
    },

    result: ($type, $data) => {
        const packets = {
            type: $type,
            data: $data,
        };
        SteemsaysSocket.emit('query-result', packets);
    },
};

function Socket()
{
    return _this;
}

module.exports = Socket;

