let intervalId;

document.getElementById('logButton').addEventListener('click', function() {
    var btn = this;
    if(intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        Puck.disconnect(function() {
            btn.innerText = 'Start Logging';
        });
        return;
    }

    Puck.connect(function(err) {
        if (err) {
            console.log("Connection error: " + err);
            return;
        }

        let code = `
            let logInterval;
            function startLogging() {
                console.log('started logging');
                logInterval = setInterval(function() {
                    let temp = E.getTemperature();
                    let logEntry = "Temperature: " + temp.toFixed(2) + "°C at " + Date().toString() + "\\n";
                    let currentData = require("Storage").read('tempLog.txt');
                    require("Storage").write('tempLog.txt', currentData + logEntry);
                }, 1 * 60 * 1000); // 5 minutes in milliseconds
            }

            function stopLogging() {
                if(logInterval) {
                    clearInterval(logInterval);
                    logInterval = null;
                }
            }

            startLogging();
        `;

        Puck.eval(code, function() {
            intervalId = setInterval(function() {
                Puck.eval("require('Storage').read('tempLog.txt')", function(data) {
                    console.log(data);
                });
            }, 5 * 60 * 1000); // 5 minutes in milliseconds

            btn.innerText = 'Stop Logging';
            console.log('logging stopped');
        });
    });
});
