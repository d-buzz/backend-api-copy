const fs = require('fs');

console.log('Initializing Temp Files');
let dirs = [
    './cache',
    './cache/follower',
    './cache/following',
    './public/profiles',
    './public/covers'
];
dirs.forEach(dir => {
    console.log('Created directory '+dir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});

let whotofollow = ["dbuzz","hlix","nathansenn","chrisrice"];
let data = JSON.stringify(whotofollow);
let filepath = 'cache/who_to_follow.json';
let userjs = `{"users": ${data}}`;
fs.writeFile(filepath, userjs, (err1) => {
    if (!err1) {
        console.log('Cached who to follow users');
    }else{
        console.log(err1);
    }
});

let witnesses = ["engrave"];
let data2 = JSON.stringify(witnesses);
let filepath2 = 'cache/witnesses.json';
let witjs = `{"users": ${data2}}`;
fs.writeFile(filepath2, witjs, (err2) => {
    if (!err2) {
        console.log('Cached witnesses');
    }else{
        console.log(err2);
    }
});

console.log('Creates config file');
fs.createReadStream('./config.example.js').pipe(fs.createWriteStream('./config.js'));

console.log('Created env file');
fs.createReadStream('./env.example.js').pipe(fs.createWriteStream('./env.js'));