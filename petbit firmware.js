// Version 2.8
// Initialize variables
var steps = 0;   // Counter for steps
const range = 60*1000;  // Range for each step interval in milliseconds
let date_now = Date.now();  // Current timestamp
let prev_min_stamp = Math.round(date_now / range);  // Previous minute timestamp
let curr_min_stamp = 0;  // Current minute timestamp
let curr_min_steps = 0;  // Steps in the current minute
let curr_hr_steps = 0;
let stop_counting = false;  // Flag for stopping the step count
let act_threshold = 5;  // Active threshold for steps
let active_min = 0;  // Active minutes count
let myDate = new Date(date_now);  // Current date object
let prev_day; 
let prev_hr;
let day = 1;
let seven_day_steps = new Array(7).fill(0);
let seven_day_active_mins = new Array(7).fill(0);
let hourly_steps = new Array(24).fill(0); // Steps every hour of the day
let quarter_steps = new Array(4).fill(0); // Steps in 15 
let daily_average = 0;
let daily_average_active_mins = 0; 

// Set timezone and DST
//E.setTimeZone(-7);
E.setDST(60,-480,1,0,2,0,120,0,0,10,0,120);
//E.setDST();
prev_day = myDate.getDate();
prev_hr = myDate.getHours();
console.log(myDate);

// Open log file in write mode
//let log_file=require("Storage").open("log", "w");

function averageDaily() {
  let total_steps = 0;
  let total_active_mins = 0;
  let denominator = 7;
  
  if (day < 7) 
      denominator = day;

  seven_day_steps.forEach(function a(value) { total_steps +=value;});
  seven_day_active_mins.forEach(function a(value) { total_active_mins +=value;});
  daily_average = total_steps/denominator;
  daily_average_active_mins = total_active_mins/denominator;

}

function dumpLogs() {
  console.log("Steps: " + steps);
  console.log(seven_day_steps);
  console.log(seven_day_active_mins);
  console.log(hourly_steps);
  
  console.log("Daily Average Steps:" + daily_average);
  console.log("Daily Average Mins:" + daily_average_active_mins);

}

function returnLog() {
 // Log object
  let log_obj = { 
      "timestamp": curr_min_stamp,  // Current minute timestamp
      "steps": steps,  // Total steps
      "active_min": active_min,  // Active minutes
      "daily_average" :daily_average,
      "daily_average_active_mins" :daily_average_active_mins,
      "hourly_steps" : hourly_steps,
      "seven_day_active_mins": seven_day_active_mins,
      "seven_day_steps" : seven_day_steps
    }; 
  
  return JSON.stringify(log_obj);
  
}
function startLog() {
  writeLog();
  console.log("Start timer");
  // Write log every 15 minutes
  setInterval(writeLog, 15000*60);
}

function cleanOldLog() {
  
  var locateFile = "steps_log_daily_" + (day - 1);
    console.log("Looking for :" + locateFile);
    var regex = new RegExp(locateFile);
    var fileList = require("Storage").list(/steps_log_daily_/);
      
    var filteredList = fileList.filter(function(fileName) {
        return regex.test(fileName);
    });
  
    console.log("File name to remove:" + regex);
    console.log("Filtered List:" + filteredList);
}

// Function to write logs - runs every 15 minutes regardless of the activity
function writeLog() {
  date_now = Date.now();  // Update current timestamp
  myDate = new Date(date_now);  // Update current date object
  console.log(myDate.toString());
  curr_min_stamp = Math.round(date_now/ range);  // Update current minute timestamp
  let curr_day = myDate.getDate();
  let curr_hr = myDate.getHours();
  
    console.log("today:"+ curr_day + " prev:"+ prev_day);
      console.log("now hour:"+ curr_hr + " prev:"+ prev_hr);

  // Reset daily steps when the day changes
  if (curr_day != prev_day) {
    day++;
    
//    if (day > 1) // need to change to 7 once testing is dopne.
  //    cleanOldLog();
    
    steps = 0;
    active_min = 0;
    hourly_steps.fill(0);
    prev_day = curr_day;
    
    // remove oldest steps if first seven days have passed
    if (day > 7) {
        seven_day_steps.shift(); 
        seven_day_steps.push(0);
        seven_day_active_mins.shift();
        seven_day_active_mins.push(0);
    }
    
    // New day, new steps log
//log_file.erase();
    //require("Storage").compact();
//    log_file = require("Storage").open("steps_log", "w");
  }
  
   if (curr_hr != prev_hr) {
      
      curr_hr_steps = 0;
      prev_hr = curr_hr;
      dumpLogs();

    }
  
  // Update Daily Average  
  averageDaily();

  // Log object
  let log_obj = { 
      "timestamp": curr_min_stamp,  // Current minute timestamp
      "steps": steps,  // Total steps
      "active_min": active_min,  // Active minutes
    };
  
  // Write log object to file and storage
  //log_file.write(JSON.stringify(log_obj));
  //require("Storage").write("steps_log_daily_"+ day, JSON.stringify(log_obj));
  
  // Log the action to console
  console.log("wrote log " + JSON.stringify(log_obj) + " at " + curr_min_stamp + " "       + myDate.getDate() + "/" + (myDate.getMonth()+1));
}
  
// Function to handle active minutes
function activeMins() {
  steps++;  // Increment step count
  curr_hr_steps++;
  
  curr_min_stamp = Math.round(Date.now() / range);  // Update current minute timestamp
  
  // Handle step count for active minutes
  if (prev_min_stamp == curr_min_stamp) {
    if (!stop_counting)
    {
      curr_min_steps++;  // Increment current minute steps
      if (curr_min_steps > act_threshold)
      {
        active_min++;  // Increment active minutes
        stop_counting = true;  // Stop counting steps
      }
    }
  } else {
    prev_min_stamp = curr_min_stamp;  // Update previous minute timestamp
    stop_counting = false;  // Start counting steps
    curr_min_steps = 0;  // Reset current minute steps
  }
  
  if (day <=7) {
    seven_day_steps[day-1] = steps;
    seven_day_active_mins[day-1]=active_min;
  }
  else {
    seven_day_steps[6] = steps;
    seven_day_active_mins[6]=active_min;
  }
  hourly_steps[new Date(Date.now()).getHours()] = curr_hr_steps;

  averageDaily();

}

console.log("Version 2.8");
writeLog();
// Start the logging at the nearest 15 minutes boundary
console.log("Start logging in "+ (15 - (myDate.getMinutes()%15)) + " minutes");
setTimeout(startLog, ((15 - (myDate.getMinutes()%15)))*1000*60);

// Start step counter
require("puckjsv2-accel-steps").on();
Puck.on('accel',function(a) {
  activeMins();  // Handle active minutes on step
});
