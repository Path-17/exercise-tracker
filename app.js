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

// exercise database init
const exerciseDatabase = new dataStore('exerciseDatabase.db');
exerciseDatabase.loadDatabase();

// save template end point
app.post('/template-post', (req, res) => {
  let template = req.body;
  templateDatabase.insert(template);
});

// get template end point
app.get('/template-get', (req, res) => {

  templateDatabase.find({}, function(err, docs){
    // send back the list of templates
    res.json(docs);
  });

});

// save workout end point
app.post('/workout-post', (req, res) =>{

  let workout = req.body;
  workoutDatabase.insert(workout);

  // exercise db
  // name , lowercase, no spaces
  // max history [], get max per workout, then append it with time stamp

  for(let i = 0 ; i < workout.exercise_list.length ; i++){
    let tempRepList = workout.exercise_list[i].weight_rep_list;
    let oneRepMax = 0;
    for (let j = 0 ; j < tempRepList.length; j++){
      if(estimateOneRepMax(tempRepList[j].weight, tempRepList[j].reps) > oneRepMax){
        oneRepMax = estimateOneRepMax(tempRepList[j].weight, tempRepList[j].reps);
        
      }
    }

    let name = workout.exercise_list[i].name.toLowerCase().replace(/\s/g, '');
    let searchTerm = {name};

    exerciseDatabase.count(searchTerm, function(err, count){

      let time = workout.time;
      let max_time_pair = {oneRepMax, time};
      let PR_Times = [max_time_pair];

      // if not in db, insert it
      if(count == 0){
        
        let exerciseData = {
          name,
          PR_Times
        }
        exerciseDatabase.insert(exerciseData);
      }
      // if in db, update the array with the new Pr-Time pair
      else{
        let temp = max_time_pair;
        exerciseDatabase.update({name}, {$push: {PR_Times: {oneRepMax, time}}},{},function(){
          console.log("exercise database updated")    
        });
        exerciseDatabase.persistence.compactDatafile();
      }

    });
  }
  

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

function estimateOneRepMax(weight, reps){
  return (weight / (1.0278-(0.0278*reps)));
}

module.exports = app;
