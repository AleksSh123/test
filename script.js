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
let azimutTest =0;
const options = {
    enableHighAccuracy: true
}
const url = "https://lt.flymaster.net/wlb/getLiveData.php";

let speedStack  = {  
    array: new Array(), //will be [speed,heading,timestamp]
    push(speed, heading, time){
        this.array.push([speed, heading, time]);
        if (this.array.length > 3600){
            this.array.shift();
        }
    }
}
let headingStack = {
    array: new Array(), //will be [heading]
    push(heading){
        this.array.push([heading]);
        if (this.array.length > 5){
            this.array.shift();
        }
    }   
}

let watcherLatitude = 0;
let watcherLongitude = 0;
let watcherHeading = 0;
let watcherAccuracy = 0;
let pilotLatitude = 0;
let pilotLongitude = 0;
let timerPilot = 0;

setPointerColor("red");

let position = navigator.geolocation.watchPosition(success,error,options);


    function calculateSpeedAverage(){
        if (speedStack.array.length == 0) return [null,null];
        let speedSumm5 = 0;
        let speedSumm10m = 0;
        let currentTime = new Date();
        let countSpeed5Watches = 0;
        let count10mWathches = 0;
    
        for (let i = speedStack.array.length - 1; i >= 0 ; i--){
            if (i > (speedStack.array.length - 6)){
                speedSumm5 += Number(speedStack.array[i][0]);
                countSpeed5Watches++;
            }
            if ((currentTime.getTime() - speedStack.array[i][2])<60000){
                speedSumm10m += Number(speedStack.array[i][0]);
                count10mWathches++;
            }
        }
        speedAverage5 = speedSumm5 / countSpeed5Watches;
        speedAverage10m = speedSumm10m / count10mWathches;
        return [speedAverage5, speedAverage10m];
    }

    function calculateHeadingAverage(){
        if (headingStack.array.length == 0) return null;
        let headingResultCount = 0;
        let headingSummCos = 0;
        let headingSummSin = 0;
        let headingAverageSummCos = 0;
        let headingAverageSummSin = 0;
        let headingAverageRad = 0;
        for (let i = headingStack.array.length - 1; i >= 0 ; i--){
            headingSummCos += Math.cos(degToRad(Number(headingStack.array[i])));
            headingSummSin += Math.sin(degToRad(Number(headingStack.array[i])));
            headingResultCount++
        }
        headingAverageSummCos = headingSummCos / headingResultCount;
        headingAverageSummSin = headingSummSin / headingResultCount;
        headingAverageRad = Math.atan2(-headingAverageSummSin, headingAverageSummCos);
        return radToDeg(headingAverageRad);
    }

    function success(position){
        let currentTime = new Date();
        let result = new Array();
        let resultSpeed = [];

        watcherLatitude = position.coords.latitude;
        watcherLongitude = position.coords.longitude;
        watcherAccuracy = Math.round(Number(position.coords.accuracy));
        if (definedValue(position.coords.speed)){
            speedStack.push(position.coords.speed, position.coords.heading , position.timestamp);
        }
        if (definedValue(position.coords.heading)){
            headingStack.push(position.coords.heading);
        }
        resultSpeed = calculateSpeedAverage();
        speed5 = resultSpeed[0];
        speed10m = resultSpeed[1];
        watcherHeading = calculateHeadingAverage();
        let dataArray = [watcherLatitude, watcherLongitude, pilotLatitude, pilotLongitude, watcherHeading, watcherAccuracy];
        fillWatcherData(dataArray);
    }
    function error(){
        updateData(accuracyObject,"no GPS available");
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
        
        if (timerPilot){
            clearInterval(timerPilot);
        }   
        fillPilotData(pilotId,timeShift);
        timerPilot = setInterval(fillPilotData,5000,pilotId,timeShift);

    }

    async function fillPilotData(pilotId, timeShift){ 
        let pilotData = await getPilotData(pilotId, timeShift);
        let noDataMessage = "no data";
        if (pilotData){
            updateData(altitudeObject, pilotData[3]);
            updateData(groundHeightObject, pilotData[8]);
            updateData(instantSpeedObject, pilotData[5]);
            updateData(averageSpeedObject, pilotData[6])
            updateData(actualDateElement,getShortDate(pilotData[0]));
            pilotLatitude = pilotData[1];
            pilotLongitude = pilotData[2];
        } else{
            updateData(altitudeObject, noDataMessage);
            updateData(groundHeightObject, noDataMessage);
            updateData(instantSpeedObject, noDataMessage);
            updateData(averageSpeedObject, noDataMessage)
            updateData(actualDateElement,noDataMessage);
        }
    }

    async function getPilotData(pilotId, timeShift){
        
        
        let currentTime = new Date().getTime();
        let  requestTime = Math.round((currentTime - Number(timeShift))/1000)
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
        } else {
            return false;
        }
    }

    function fillWatcherData(array){
        if (array[2]!=0 && array[3]!=0 && array[4]!=0){
            updateData(distanceObject, calculateDistance(array));
            let directionToPilot = calculateDirection(array);
            updateData(directionObject,directionToPilot);
            setPointerColor("#4aa8dc");
            rotateRider(directionToPilot);
        }   
        updateData(accuracyObject,array[5]);
    }

    function calculateAverageSpeed60(array){ 
        let speedSumm = 0;
        let speedEntryCount = 0;
        if (array.length < 60) speedEntryCount = array.length;
        for (let i = 0; i < speedEntryCount; i++){
            speedSumm += array[i].v;
        }
        let averageSpeed = speedSumm / speedEntryCount;
        return Math.round(averageSpeed,1);
    }

    function calculateDistance(array){
        const latitudeDegDist = 111.321377778;
        const longitudeDegDist = 111.134861111;
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
        let azimut = NaN;
        let externalDirection = array[4];
        let latitudeA  = degToRad(array[0]);
        let longitudeA = degToRad(array[1]);
        let latitudeB = degToRad(array[2]);
        let longitudeB = degToRad(array[3]);
        const deltaLongitude = longitudeB - longitudeA;
        const aLatCos = Math.cos(latitudeA);
        const aLatSin = Math.sin(latitudeA);
        const bLatCos = Math.cos(latitudeB);
        const bLatSin = Math.sin(latitudeB)
        const deltaCos = Math.cos(deltaLongitude);
        const deltaSin = Math.sin(deltaLongitude);
        const x = (aLatCos * bLatSin) - (aLatSin * bLatCos * deltaCos);
        const y = deltaSin * bLatCos;
        let z = Math.atan2(-y, x);
        z = radToDeg(z); //to degree
        updateData(azimutO, z);
        let directionToPilot = z - externalDirection;
        return  -Math.round(directionToPilot);
    }

    function getDevOrientationHeading(){
                
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

    function updateData(element,data){
        element.classList.remove("noDataClass");
        if (data === null){
            element.innerHTML = "null";
        } else if(Number.isNaN(data)){
            element.innerHTML = "NaN";
        } else{
        element.innerHTML = data;
        }
    }

    function degToRad(angle){
        return angle * Math.PI / 180;
    }

    function radToDeg(angle){
        return angle * 180 / Math.PI;
    }
    
    //setInterval(success,1000,position);
    function setPointerColor(color){
        let markerObject = document.getElementById("riderArrow");
        let lineObject = document.getElementById("line2");
        let circleObject = document.getElementById("circle");
        markerObject.setAttribute("stroke",color);
        markerObject.setAttribute("fill",color);
        lineObject.setAttribute("stroke",color);
        circleObject.setAttribute("stroke",color);
    }

    function definedValue(value){
        if ((value === null ) || (Number.isNaN(value))){
            return false;
        } else{
            return true;
        }
    }

    function rotateRider(angle){
        lineRider.setAttribute('transform','rotate ('+angle+' 150 150)');

    }
    /*
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
    } */