var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var createTemplateRouter = require('./routes/createTemplate');
var dashboardRouter = require('./routes/dashboard');
var logWorkoutRouter = require('./routes/logWorkout');
var historyRouter = require('./routes/history');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/create-template', createTemplateRouter);
app.use('/', dashboardRouter);
app.use('/dashboard', dashboardRouter);
app.use('/log-a-workout', logWorkoutRouter);
app.use('/history', historyRouter);

// template database init
const dataStore = require('nedb');
const templateDatabase = new dataStore('templateDatabase.db');
templateDatabase.loadDatabase();

// workout database init
const workoutDatabase = new dataStore('workoutDatabase.db');
workoutDatabase.loadDatabase();

// save template end point
app.post('/template-post', (req, res) => {
  let template = req.body;
  templateDatabase.insert(template);
});

// get template end point
app.get('/template-get', (req, res) => {

  templateDatabase.find({}, function(err, docs){
    // send back the list of names
    res.json(docs);
  });

});

// save workout end point
app.post('/workout-post', (req, res) =>{

  

});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

module.exports = app;
