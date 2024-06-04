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
const logging_interval = 15; // minutes
const version = "6.2";
let ran_main = 0;

function copyLastData(prev_data) {
  let old_log_obj = JSON.parse(prev_data);
  
  let old_log_date = new Date(old_log_obj.timestamp);
  let old_log_day = old_log_date.getDate();
  
  // Don't use the data if the current date is not correct
  if (myDate.getFullYear() < 2024) {
    require("Storage").write("old_log", prev_data);
    return;
  }
  
  if (old_log_date.getFullYear() < 2024) {
     prev_data = require("Storage").read("old_log");
     if (prev_data != undefined) { 
       console.log("Restoring known old log");
       old_log_obj = JSON.parse(prev_data);
       old_log_date = new Date(old_log_obj.timestamp);
       old_log_day = old_log_date.getDate();
     }
  }
  
  // Calculate the difference in time (milliseconds)
  const timeDifference = Math.abs(myDate - old_log_date);
    
  // Convert time difference to days
  const dayDifference = Math.round(timeDifference / (1000 * 60 * 60 * 24));
  
  console.log("Old log is more than " + dayDifference + " old.");
   
  if ((dayDifference) > 7) 
    return;
  

  if (dayDifference == 0) {
    console.log("From the same day, copy everything..");
    steps = old_log_obj.steps;
    active_min = old_log_obj.active_min;
    hourly_steps = old_log_obj.hourly_steps;
  }
  
  seven_day_active_mins = old_log_obj.seven_day_active_mins;
  seven_day_steps = old_log_obj.seven_day_steps;
  day = dayDifference + 1;
  
  for (i = 0; i < day-1; i++) {
    console.log("shift.." + i);
    seven_day_steps.shift(); 
    seven_day_steps.push(0);
    seven_day_active_mins.shift();
    seven_day_active_mins.push(0);
  }
  
  averageDaily();
    
//dumpLogs();
  
}

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
  console.log("Day:" + myDate.toString());
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
      "bat" : E.getBattery(),
      "day": day, // Day
      "timestamp": myDate,  // Current minute timestamp
      "dateString": new Date(Date.now()).toString(), 
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
  updateLog();
 // console.log("Start timer");
  // Write log every 15 minutes
  setInterval(updateLog, logging_interval * 1000*60);
}

// Function to write logs - runs every longing_interval minutes regardless of the activity
function updateLog() {
  date_now = Date.now();  // Update current timestamp
  myDate = new Date(date_now);  // Update current date object

  curr_min_stamp = Math.round(date_now/ range);  // Update current minute timestamp
  let curr_day = myDate.getDate();
  let curr_hr = myDate.getHours();
  
//    console.log("today:"+ curr_day + " prev:"+ prev_day);
  //  console.log("now hour:"+ curr_hr + " prev:"+ prev_hr);

  // Reset daily steps when the day changes
  if (curr_day != prev_day) {
    day++;
        
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
    
   }
  
   if (curr_hr != prev_hr) {
      
      curr_hr_steps = 0;
      prev_hr = curr_hr;
      //dumpLogs();

    }
  
  // Update Daily Average  
  averageDaily();
  
  // Write log object to file and storage
  require("Storage").write("log", returnLog());
    
  // Log the action to console
  console.log("wrote log at " + myDate.toString());
}
  
// Function to handle active minutes
function activeMins() {
  //console.log("activeMins" + steps);
  steps++;  // Increment step count
  curr_hr_steps++;
  //console.log("activeMins" + steps);
  
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

function setupDevice() {

    console.log("Version" + version);
    myDate = new Date(Date.now());
  
    let old_data = require("Storage").read("log"); 
    if ((old_data != undefined)) {
        console.log("Old log exists");
        console.log(old_data); 
        copyLastData(old_data);
    }
  
      // Set timezone and DST
    // California
    //E.setDST(60,-480,1,0,2,0,120,0,0,10,0,120);

    // United Kingdom
    E.setDST(60,0,4,0,2,0,60,4,0,9,0,120);

    date_now = Date.now();  // Current timestamp
    prev_min_stamp = Math.round(date_now / range);  // Previous minute timestamp
    
    prev_day = myDate.getDate();
    console.log(prev_day);
    prev_hr = myDate.getHours();
    console.log(myDate);

    // Change the name
    NRF.setAdvertising({}, {name: "Uno"});

    updateLog();
    // Start the logging at the nearest 15 minutes boundary
    console.log("Start logging in "+ (logging_interval - (myDate.getMinutes()%logging_interval)) + " minutes");
    setTimeout(startLog, ((logging_interval - (myDate.getMinutes()%logging_interval)))*1000*60);

    // Start step counter
   require("puckjsv2-accel-steps").on();
    Puck.on('accel',function(a) {
      activeMins();  // Handle active minutes on step
    });
}




setupDevice();
