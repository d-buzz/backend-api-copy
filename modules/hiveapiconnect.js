const hive = require('@hiveio/hive-js');
const ENV = require('./../env');

hive.api.setOptions({ url: ENV.target_api });
hive.config.set('address_prefix','STM');
hive.config.set('alternative_api_endpoints', ['https://api.hive.blog', 'https://anyx.io']);
module.exports = hive;