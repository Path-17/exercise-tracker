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
  workout.weekNumber = new Date(workout.time).getWeek();
  workout.year = new Date(workout.time).getFullYear();
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

    let name = workout.exercise_list[i].name;
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

app.get('/exercise-get', (req,res)=>{

  exerciseDatabase.find({}, function(err, docs){
    res.json(docs);
  });

});

app.get('/workout-get', (req, res) => {

  class workoutWeek{
    constructor(count, week, workoutList){
      this.workoutList = workoutList;
      this.count = count;
      this.week = week;
    }
  }

  let workoutWeekList = [];

  
  let weekNum = new Date(Date.now()).getWeek();
  //weekNumber--;

  console.log("current week is:" + String(weekNum));

  let currentYear = new Date(Date.now()).getFullYear();

  workoutDatabase.find({weekNumber: weekNum, year: currentYear}, function(err, docs0){
    if(docs0.length > 0){
      let temp0 = new workoutWeek(docs0.length, 0, docs0);
      workoutWeekList.push(temp0);
    }
    else{
      workoutWeekList.push(0);
    }
    workoutDatabase.find({weekNumber: weekNum-1, year: currentYear}, function(err, docs1){
      if(docs1.length > 0){
        let temp1 = new workoutWeek(docs1.length, 1, docs1);
        workoutWeekList.push(temp1);
      }
      else{
        workoutWeekList.push(0);
      }
      workoutDatabase.find({weekNumber: weekNum-2, year: currentYear}, function(err, docs2){
        if(docs2.length > 0){
          let temp2 = new workoutWeek(docs2.length, 2, docs2);
          workoutWeekList.push(temp2);
        }
        else{
          workoutWeekList.push(0);
        }
        workoutDatabase.find({weekNumber: weekNum-3, year: currentYear}, function(err, docs3){
          if(docs3.length > 0){
            let temp3 = new workoutWeek(docs3.length, 3, docs3);
            workoutWeekList.push(temp3);
          }
          else{
            workoutWeekList.push(0);
          }
          workoutDatabase.find({weekNumber: weekNum-4, year: currentYear}, function(err, docs4){

            if(docs4.length > 0){
              let temp4 = new workoutWeek(docs4.length, 4, docs4);
              workoutWeekList.push(temp4);
            }
            else{
              workoutWeekList.push(0);
            }
            workoutDatabase.find({weekNumber: weekNum-5, year: currentYear}, function(err, docs5){
              if(docs5.length > 0){
                let temp5 = new workoutWeek(docs5.length, 5, docs5);
                workoutWeekList.push(temp5);
              }
              else{
                workoutWeekList.push(0);
              }
              workoutDatabase.find({weekNumber: weekNum-6, year: currentYear}, function(err, docs6){

                if(docs6.length > 0){
                  let temp6 = new workoutWeek(docs6.length, 6, docs6);
                  workoutWeekList.push(temp6);
                }
                else{
                  workoutWeekList.push(0);
                }
                workoutDatabase.find({weekNumber: weekNum-7, year: currentYear}, function(err, docs7){
                  if(docs7.length > 0){
                    let temp7 = new workoutWeek(docs7.length, 7, docs7);
                    workoutWeekList.push(temp7);
                  }
                  else{
                    workoutWeekList.push(0);
                  }
                  res.json(workoutWeekList);
                });
              });
            });
          });
        });
      });
    });
  });
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

// Returns the ISO week of the date.
Date.prototype.getWeek = function() {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                          - 3 + (week1.getDay() + 6) % 7) / 7);
}

module.exports = app;
