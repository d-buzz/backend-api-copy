module.exports = {
    production: false,
    primary_tag: 'hive-193084',
    return_json: true,
    voting_weight: 10000,
    character_limit: 280,
    title_limit: 100,
    profile_img_path: '/profiles',
    cover_img_path: '/covers',
    timeout_interval: 2000,
    target_api: 'https://anyx.io',
    default_tags: ['dbuzz'],
    twitter_hashtags: ['hive','dbuzz'],
    enable_tweet_post_to_hive: false,
    enable_comment_options: true,
    max_accepted_payout: '1.000 HBD',
    percent_steem_dollars: 5000,
    buzz_limit_with_rewards: 8,
    twitter_verification_enable: false,
    twitter_to_hive_autopost: false,
    STEEM : {
        CLIENT_ID : 'dbuzz.app',
        SECRET : 'STM7JXs6CYkc6tWndfENbTjmdrfaQdnvXLf9843BuCLs2uHmGfeNq', 
        IMAGES_URL: 'https://steemitimages.com/400x400/',
    },
    DATABASE : {
        HOST: 'localhost',
        USER: 'root',
        PORT: 8000,
        PASS: '',
        DATABASE: 'dbuzz'
    },
    BE : {
        HOST: 'http://localhost',
        PORT : 3000
    },
    FE : {
        HOST: 'http://localhost',
        PORT : 4200
    },
    REDIS: {
        host: '127.0.0.1',
        port: 6379,
        require_password: false,
        password: '',
        db: 9
    },
    SOCKET: {
        HOST: 'http://localhost',
        PORT: 2088
    },
    TWITTER : {
        CONSUMER_KEY :  'ISVm4S9kX3jtFec8vX6CvhI9G',
        CONSUMER_SECRET : 'krVwB9Jgq7BmzwY6FFWA8MIb5a15oRQbDSa6Hciw4Adx06MHtV',
        ACCESS_TOKEN : '1166374295087411205-fZzZa909NxzUbhgSiclcqHAJyfSS7A',
        ACCESS_SECRET : 'qWuLyNAiRHESJcDPcIIx5TRSt78Yezy6rvM2KPqyBylff'
    }
};
