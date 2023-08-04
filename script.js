const arrowObject=document.getElementById("line2");
const altitudeObject = document.getElementById("altitude");
const instantSpeedObject = document.getElementById("instantSpeed");
const averageSpeedObject = document.getElementById("averageSpeed");
const distanceObject = document.getElementById("distance");
const directionObject = document.getElementById("direction");
const pilotIdElement = document.getElementById("pilotId");
const timeShiftElement = document.getElementById("timeShift");
const shiftedDateElement = document.getElementById("shiftedDate");
const actualDateElement = document.getElementById("actualDate");
const options = {
    enableHighAccuracy: true
}
const url = "https://lt.flymaster.net/wlb/getLiveData.php";
let averagerArray = new Array();
let stack  = {
    push(speed, heading, time){
        averagerArray.push([speed, heading, time]);
        if (averagerArray.length > 3600){
            averagerArray.shift();
        }
    }
}
let watcherLatitude = 0;
let watcherLongitude = 0;
let position = navigator.geolocation.watchPosition(success,error,options);
/*     let position = {
        coords:{
            longitude: 0,
            latitude: 0,
            speed: 0,
            heading: 0
        },
        timestamp: 0

    } */

    function calculateAverage(){
        let speedSumm5 = 0;
        let headingSumm5 = 0;
        let speedSumm10m = 0;
        let speedSumm1h = 0;
        let currentTime = new Date();
        let count5Watches = 0;
        let count10mWathches = 0;
        let count1hWatches = 0;
        for (let i = averagerArray.length - 1; i >= 0 ; i--){
            if (i > averagerArray.length - 6){
                speedSumm5 += averagerArray[i][0];
                if ((averagerArray[i][1] - headingSumm5) < 180) {
                    headingSumm5 += averagerArray[i][1];
                }
                else {
                    headingSumm5 += averagerArray[i][1] - 360;
                }
                count5Watches++;
            }
            if ((currentTime.getTime() - averagerArray[i][2])<60000){
                speedSumm10m += averagerArray[i][0];
                count10mWathches++;
            }
            if ((currentTime.getTime() - averagerArray[i][2])<600000){
                speedSumm1h += averagerArray[i][0];
                count1hWatches++;
            }
        }
        speedAverage5 = speedSumm5 / count5Watches;
        headingAverage5 = headingSumm5 / count5Watches;
        speedAverage10m = speedSumm10m / count10mWathches;
        speedAverage1h = speedSumm1h / count1hWatches;
        return [speedAverage5, headingAverage5, speedAverage10m, speedAverage1h];
    }
    //rotateRider(250);
    
    function success(position){
        let currentTime = new Date();
        let result = new Array();

        //gpsEmulation();

        //console.log(currentTime);
        //console.log("1!");
        //console.log(position.coords.latitude);
        //console.log("2!");
        /*    position.coords.latitude = Math.random() * 360;
            position.coords.longitude = Math.random() * 360;
            position.coords.speed = Math.random() * 3;
            position.coords.heading = Math.random() * 120;
        */


        //console.log(position.coords.latitude)
        //console.log("intermediate");
        //console.log(position.coords.speed)
        //latObject.innerHTML = position.coords.latitude;
        //longObject.innerHTML = position.coords.longitude;
        //timeObject.innerHTML = currentTime;
        watcherLatitude = position.coords.latitude;
        watcherLongitude = position.coords.longitude;

        console.log(position.coords.speed, position.coords.heading , position.timestamp)
        stack.push(position.coords.speed, position.coords.heading , position.timestamp)
        result = calculateAverage();
        console.log(result)
        speed5 = result[0];
        heading = result[1];
        speed10m = result[2];
        speed1h = result[3];

        //spObject.innerHTML = (speed5 * 3.6).toFixed(1);
        headingObject.innerHTML = Math.round(heading);
        //sp10mObject.innerHTML = (speed10m * 3.6).toFixed(1);
        //sp1hObject.innerHTML = (speed1h * 3.6).toFixed(1);

        rotateRider(Math.round(heading));
   

    }
    function error(){
        /*latObject.innerHTML = "err"
        longObject.innerHTML = "err"
        latObject.className = "errBox"
        longObject.className = "errBox" */
    }
    function rotateRider(angle){
        console.log(angle);
        lineRider.setAttribute('transform','rotate ('+angle+' 150 150)');

    }
    function gpsEmulation(){
        position.coords.latitude = -1;
        position.coords.longitude = -1;
        position.coords.speed = Math.random() + 3;
        let randomDigit = Math.random()
        position.coords.heading = randomDigit * 60 - 30;
        console.log("random: " + randomDigit + ", randomDegree: " + position.coords.heading)
        if (position.coords.heading < 0){
            position.coords.heading  = position.coords.heading + 360;
        }
        console.log("randomDegree after normalize: " + position.coords.heading)
        let tt = new Date();
        position.timestamp = tt.getTime();
    }
    async function  getLiveData(sn,timeStamp){
        urlLocal = url + "?trackers={\"" + String(sn) + "\":" + String(timeStamp) + "}";
        let response = await fetch(urlLocal);
        let liveData = await response.json();
        return liveData;
    }

    function getPilot(){
        let pilotId = pilotIdElement.value;
        let timeShift = timeShiftElement.value * 1000;
        //fillPilotData(data[pilotId]);
        //debugger;
        setInterval(fillPilotData,5000,pilotId,timeShift)

    }

    async function fillPilotData(pilotId, timeShift){
        
        
        let currentTime = new Date().getTime();
        let  requestTime = Math.round((currentTime - Number(timeShift))/1000)
        shiftedDateElement.innerHTML = getShortDate(requestTime);
        let data = await getLiveData(pilotId, requestTime);
        let array = data[pilotId];
        if (array){
            
            array.reverse();
            altitudeObject.innerHTML = array[0].c;
            instantSpeedObject.innerHTML = array[0].v;
            averageSpeedObject.innerHTML  = calculateAverageSpeed(array);
            distanceObject.innerHTML = calculateDistance(array);
            directionObject.innerHTML = calculateDirection(array);
        }
        

    }

    function calculateAverageSpeed(array){
        let speedSumm = 0;
        for (let i = 0; i < 60; i++){
            speedSumm += array[i].v;
        }
        return averageSpeed = speedSumm / 60;
    }

    function calculateDistance(array){
        let pilotLongitude = array[0].oi;
        let pilotLatitude = array[0].ai / 60000;

    }

    function calculateDirection(array){

    }

    function getCurrentCoords(){
        
    }

    function getShortDate(time){
        let longTime =  new Date(time * 1000);
        let date = longTime.getDate();
        let month = longTime.getMonth();
        let year = longTime.getFullYear();
        let hour = longTime.getHours();
        let minute = longTime.getMinutes();
        let seconds = longTime.getSeconds();
        let shortTime = date + " - " + month + " - " + year + " " + hour + ":" + minute + ":" + seconds;
        return shortTime;

    }

    //setInterval(success,1000,position);