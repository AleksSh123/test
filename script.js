const arrowObject=document.getElementById("line2");
const altitudeObject = document.getElementById("altitude");
const groundHeightObject = document.getElementById("groundHeight");
const instantSpeedObject = document.getElementById("instantSpeed");
const averageSpeedObject = document.getElementById("averageSpeed");
const distanceObject = document.getElementById("distance");
const directionObject = document.getElementById("direction");
const pilotIdElement = document.getElementById("pilotId");
const timeShiftElement = document.getElementById("timeShift");
const shiftedDateElement = document.getElementById("shiftedDate");
const actualDateElement = document.getElementById("actualDate");
const lineRider = document.getElementById("line2");
const inputButtonElement = document.getElementById("inputButtonElement");
const accuracyObject = document.getElementById("accuracy");
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
let watcherHeading = 0;
let watcherAccuracy = 0;
let pilotLatitude = 0;
let pilotLongitude = 0;

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
        watcherAccuracy = position.coords.accuracy;

        //console.log(position.coords.speed, position.coords.heading , position.timestamp)
        stack.push(position.coords.speed, position.coords.heading , position.timestamp)
        result = calculateAverage();
        //console.log(result)
        speed5 = result[0];
        heading = result[1];
        watcherHeading = heading;
        speed10m = result[2];
        speed1h = result[3];
        let dataArray = [watcherLatitude, watcherLongitude, pilotLatitude, pilotLongitude, watcherHeading, watcherAccuracy];
        fillWatcherData(dataArray);

        //spObject.innerHTML = (speed5 * 3.6).toFixed(1);
        //headingObject.innerHTML = Math.round(heading);
        //sp10mObject.innerHTML = (speed10m * 3.6).toFixed(1);
        //sp1hObject.innerHTML = (speed1h * 3.6).toFixed(1);

        //rotateRider(Math.round(heading));

        
   

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
        inputButtonElement.classList.add("inputButtonClassPressed");
        //fillPilotData(data[pilotId]);
        //debugger;
        setInterval(fillPilotData,5000,pilotId,timeShift)

    }

    async function fillPilotData(pilotId, timeShift){
        let pilotData = await getPilotData(pilotId, timeShift);
        if (pilotData){
            //noData(false);
            //altitudeObject.innerHTML = pilotData[3];
            updateData(altitudeObject, pilotData[3]);
            //groundHeightObject.innerHTML = pilotData[8];
            updateData(groundHeightObject, pilotData[8]);
            //instantSpeedObject.innerHTML = pilotData[5];
            updateData(instantSpeedObject, pilotData[5]);
            //averageSpeedObject.innerHTML = pilotData[6];
            updateData(averageSpeedObject, pilotData[6])
            //actualDateElement.innerHTML = getShortDate(pilotData[0]);
            updateData(actualDateElement,getShortDate(pilotData[0]));
            pilotLatitude = pilotData[1];
            pilotLongitude = pilotData[2];
        } else{
            //noData(true);
        }
    }

    async function getPilotData(pilotId, timeShift){
        
        
        let currentTime = new Date().getTime();
        let  requestTime = Math.round((currentTime - Number(timeShift))/1000)
        //shiftedDateElement.innerHTML = getShortDate(requestTime);
        updateData(shiftedDateElement, getShortDate(requestTime))
        let data = await getLiveData(pilotId, requestTime);
        let array = data[pilotId];
        if (array){
            
            array.reverse();
            let pilotBarometricAltitude = array[0].c;
            let pilotGpsAltitude = array[0].h;
            let pilotVelocity = array[0].v;
            let groundHeight = array[0].s;
            let pilotBearing = array[0].b;
            let pilotTimestamp = array[0].d;
            let pilotLatitude = array[0].ai / 60000;
            let pilotLongitude = array[0].oi / 60000;
            let pilotAverageVelocity60 = calculateAverageSpeed60(array);
            let result = [pilotTimestamp, pilotLatitude, pilotLongitude, pilotBarometricAltitude,
                 pilotGpsAltitude, pilotVelocity, pilotAverageVelocity60, pilotBearing, groundHeight]

            return result;
            /*altitudeObject.innerHTML = array[0].c;
            instantSpeedObject.innerHTML = array[0].v;
            actualDateElement.innerHTML = getShortDate(array[0].d);
            averageSpeedObject.innerHTML  = calculateAverageSpeed(array);
            distanceObject.innerHTML = calculateDistance(array);
            let heading = calculateDirection(array);
            directionObject.innerHTML = heading;
            rotateRider(heading); */

        } else {
            return false;
        }
        

    }

    function fillWatcherData(array){
        //distanceObject.innerHTML = calculateDistance(array);
        if (array[2]!=0 && array[3]!=0 && array[4]!=0){
            updateData(distanceObject, calculateDistance(array));
            //updateData(distanceObject,array)
            let directionToPilot = calculateDirection(array);
            //directionObject.innerHTML = directionToPilot;
            updateData(directionObject,directionToPilot);
            rotateRider(directionToPilot);
        }
        updateData(accuracyObject,array[5]);
    }

    function calculateAverageSpeed60(array){
        let speedSumm = 0;
        for (let i = 0; i < 60; i++){
            speedSumm += array[i].v;
        }
        let averageSpeed = speedSumm / 60;
        return Math.round(averageSpeed,1);
    }

    function calculateDistance(array){
        const latitudeDegDist = 111.321377778;
        const longitudeDegDist = 111.134861111;
        //let watcherLatitude = 56;
        //let watcherLongitude = 92;
        let latitudeA  = array[0];
        let longitudeA = array[1];
        let latitudeB = array[2];
        let longitudeB = array[3];
        let deltaLatitude = latitudeB - latitudeA;
        let deltaLongitude = longitudeB - longitudeA;
        let distanceLatitudeKm = deltaLatitude * latitudeDegDist * Math.cos(latitudeA);
        let distanceLongitudeKm = deltaLongitude * longitudeDegDist;
        let distance = Math.hypot(distanceLatitudeKm, distanceLongitudeKm);
        let result = distance.toFixed(3);
        return result;
    }

    function calculateDirection(array){
        //let watcherLatitude = 55;
        //let watcherLongitude = 93;
        //let watcherHeading = 300;

        let latitudeA  = array[0];
        let longitudeA = array[1];
        let latitudeB = array[2];
        let longitudeB = array[3];

        //let pilotLongitude = array[0].oi / 60000;
        //let pilotLatitude = array[0].ai / 60000;
        //watcherLatitude = watcherLatitude * Math.PI / 180;
        //watcherLongitude = watcherLongitude * Math.PI / 180;
        //pilotLatitude = pilotLatitude * Math.PI / 180;
        //pilotLongitude = pilotLongitude * Math.PI / 180;

        const deltaLongitudeRad = degToRad(longitudeB) - degToRad(longitudeA);
        //const deltaLongitude = pilotLongitude - watcherLongitude;
        const aLatCos = Math.cos(latitudeA);
        //const wLatCos = Math.cos(watcherLatitude);
        const aLatSin = Math.sin(latitudeA);
        //const wLatSin = Math.sin(watcherLatitude);
        const bLatCos = Math.cos(latitudeB);
        //const pLatCos = Math.cos(pilotLatitude);
        const bLatSin = Math.cos(latitudeB)
        //const pLatSin = Math.sin(pilotLatitude);
        const deltaCos = Math.cos(deltaLongitudeRad);
        const deltaSin = Math.sin(deltaLongitudeRad);
        const x = (aLatCos * bLatSin) - (aLatSin * bLatCos * deltaCos);
        const y = deltaSin * bLatCos;
        //const arg = (-y / x)
        z = Math.atan2(-y, x);
        z = z * 180 / Math.PI; //to degree
        if (z > 0){
            azimut = 360 - z;
        } else{
            azimut = -z;
        }
        let externalDirection = array[4];
        let directionToPilot = azimut - externalDirection;
        if (directionToPilot < 0) {
            directionToPilot = 360 + directionToPilot;
        }

        return Math.round(directionToPilot);
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
        month++;
        let shortTime = twoDigits(date) + "-" + twoDigits(month) + "-" + year + " " + twoDigits(hour) + ":" + twoDigits(minute) + ":" + twoDigits(seconds);
        return shortTime;

    }

    function twoDigits(value){
        if (value<10){
            value = "0" + String(value);
        }
        return value;
    }

    function noData(value){
        if (value){
            altitudeObject.classList.add("noDataClass");
            groundHeightObject.classList.add("noDataClass");
            instantSpeedObject.classList.add("noDataClass");
            averageSpeedObject.classList.add("noDataClass");
            actualDateElement.classList.add("noDataClass");
        } else{
            altitudeObject.classList.remove("noDataClass");
            groundHeightObject.classList.remove("noDataClass");
            instantSpeedObject.classList.remove("noDataClass");
            averageSpeedObject.classList.remove("noDataClass");
            actualDateElement.classList.remove("noDataClass");
        }
    }

    function updateData(element,data){
        element.classList.remove("noDataClass");
        element.innerHTML = data;
    }

    function degToRad(angle){
        return angle * Math.PI / 180;
    }
    //setInterval(success,1000,position);