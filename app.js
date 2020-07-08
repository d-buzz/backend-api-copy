let express = require('express');
let path = require('path');
// let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let session = require('express-session');
// let expressSanitized = require('express-sanitize-escape');
let cors = require('cors');
let compression = require('compression');
let ENV = require('./env');

let index = require('./routes/index');
let auth = require('./routes/auth');
let feed = require('./routes/feed');
let post = require('./routes/post');
let account = require('./routes/account')
let twitter = require('./routes/twitter')
let config = require('./config')
let util = require('./modules/util')

let app = express();
app.use(session({
    secret: config.session.secret,
    saveUninitialized: true,
    resave: false
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(expressSanitized.middleware());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.enable('trust proxy');
app.use(cors({origin: [
  ENV.FE.HOST + ((ENV.FE.PORT!='') ? ':' + ENV.FE.PORT : '')
], credentials: true}));

// custom middleware
// app.use(util.setUser);

app.options('*', cors());
app.use('/', index);
app.use('/auth', auth);
app.use('/logout', auth);
app.use('/feed', feed);
app.use('/post', post);
app.use('/account', account);
app.use('/twitter', twitter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

console.log('dBuzz API listening on: '+ ENV.BE.HOST + ((ENV.BE.PORT!='') ? ':' + ENV.BE.PORT : ''));
module.exports = app;
