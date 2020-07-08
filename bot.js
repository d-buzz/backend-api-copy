const window = require('window');
const Package = require('./package.json');
const Modules = require('./modules/module');
const ENV = require('./env');

(function (w) {
    'use strict';
    console.log('Running Dbuzz Bot', Package.version);
    w.init = () => {
        Modules.AccountFetcher().start();
        Modules.FeedFetcher().start();
        if(ENV.twitter_verification_enable){
            Modules.TwitterChecker().start();
        }
        if(ENV.twitter_to_hive_autopost){
            Modules.TwitterFetcher().start();
        }
    };

    /**
     * Start Bot
     */
    w.init();
})(window);