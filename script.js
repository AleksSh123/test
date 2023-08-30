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
const switchModeButtonElement = document.getElementById("inputModeElement");
const accuracyObject = document.getElementById("accuracy");
//////////////////////////
let debug1 = document.getElementById("gpsH");
let debug2 = document.getElementById("devOriH");
let debug3 = document.getElementById("az");
let debug4 = document.getElementById("toPHGps")
let debug5 = document.getElementById("toPHDevOri");
///////////////////////////
let timerPilotUpdate = 0;
//let azimutTest =0;
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

let pilot = {
    latitude: null,
    longitude: null,
    velocity: null,
    baroAltitude: null,
    gpsAltitude: null,
    groundHeight: null,
    bearing: null,
    timestamp: null,
    averageVelocity60: null,
    receivedData: false,
    id: null,
    timeShift: null,
    _listToClear: ["latitude", "longitude", "velocity", "baroAltitude", "gpsAltitude", "groundHeight", "bearing", "timestamp", "averageVelocity60"],
    clearData(){
        for (let key in this){
            if (this._listToClear.includes(key)){
                this[key] = null;
            }
            if (key == "receivedData"){
                    this[key] = false;
            }
        }
    }
}

let watcher = {
    latitude: null,
    longitude: null,
    gpsHeading: null,
    accuracy: null,
    devOrientationHeading: null,
    requestTime: null,
    noGps: null,
    headingModeDevOri: false,
    angle: null
}

let calculations = {
    distance: null,
    watcherToPilotAzumit: null,
    directionToPilotGps: null,
    directionToPilotOri: null
}

setPointerColor("red");

let position = navigator.geolocation.watchPosition(successGetGPS,errorGetGPS,options);

    function successGetGPS(position){
        //let resultSpeed = [];
        watcher.noGps = false;
        watcher.latitude = position.coords.latitude;
        watcher.longitude = position.coords.longitude;
        watcher.accuracy = Math.round(Number(position.coords.accuracy));
        if (isDefinedValue(position.coords.speed)){
            speedStack.push(position.coords.speed, position.coords.heading , position.timestamp);
        }
        if (isDefinedValue(position.coords.heading)){
            headingStack.push(position.coords.heading);
        }
        /*
        resultSpeed = calculateSpeedAverage();
        speed5 = resultSpeed[0];
        speed10m = resultSpeed[1];
        */
        calculateHeadingAverage();
        /*
        fillWatcherData();
        if (pilot.receivedData){
            fillCalculatedData();
        }
        */
        updateView();
    }
    function errorGetGPS(){
        //watcher.latitude = null;
        //watcher.longitude = null;
        //watcher.accuracy = null;
        watcher.gpsHeading = null;
        watcher.noGps = true;
        //fillWatcherData("no GPS available");
        updateView();
    }
 
    function updateView(){
        
//////////////////////debug section
        updateData(debug1, watcher.gpsHeading);
        updateData(debug2, watcher.devOrientationHeading);
        updateData(debug3, calculations.watcherToPilotAzumit);
        updateData(debug4, calculations.directionToPilotGps);
        updateData(debug5, calculations.directionToPilotOri);
///////////////////////

        updateData(shiftedDateElement, watcher.requestTime);
        if (!watcher.noGps){
            updateData(accuracyObject,watcher.accuracy);
        } else{
            updateData(accuracyObject,"no GPS available");
        }
        if (pilot.receivedData){
            updateData(altitudeObject, pilot.baroAltitude);
            updateData(groundHeightObject, pilot.groundHeight);
            updateData(instantSpeedObject, pilot.velocity);
            updateData(averageSpeedObject, pilot.averageVelocity60)
            updateData(actualDateElement,convertToShortDate(pilot.timestamp))

        } else {
            updateData(altitudeObject, null);
            updateData(groundHeightObject, null);
            updateData(instantSpeedObject, null);
            updateData(averageSpeedObject, null);
            updateData(actualDateElement,null);
            updateData(distanceObject, null);
            setNoDirection();
        }
        if ((!watcher.noGps) && (pilot.receivedData)){
            calculateDistance();
            calculateWatcherToPilotAzimut();
            updateData(distanceObject, calculations.distance);
            if ((watcher.gpsHeading != null) && (!watcher.headingModeDevOri)) {
                calculateDirectionsToPilot();
                updateData(directionObject, calculations.directionToPilotGps);
                rotateRider(calculations.directionToPilotGps);
                setPointerColor("#4aa8dc");
            } else if ((watcher.devOrientationHeading != null) && (watcher.headingModeDevOri)){
                calculateDirectionsToPilot();
                updateData(directionObject, calculations.directionToPilotOri);
                rotateRider(calculations.directionToPilotOri);
                setPointerColor("#4aa8dc");
            } else {
                setNoDirection();
            }





        }
 

    }



    function inputPilot(){
        pilot.id = pilotIdElement.value;
        pilot.timeShift = timeShiftElement.value * 1000;
        inputButtonElement.classList.add("inputButtonClassPressed");
        
        if (timerPilotUpdate){
            clearInterval(timerPilotUpdate);
        }
        pilot.clearData();
        
        fillPilotData();
        timerPilotUpdate = setInterval(fillPilotData,5000);

    }

    async function fillPilotData(){ 
        let pilotData = await getPilotData(pilot.id, pilot.timeShift);
        updateView();
        /*
        let noDataMessage = "no data";
        if (pilotData){
            updateData(altitudeObject, pilot.baroAltitude);
            updateData(groundHeightObject, pilot.groundHeight);
            updateData(instantSpeedObject, pilot.velocity);
            updateData(averageSpeedObject, pilot.averageVelocity60)
            updateData(actualDateElement,convertToShortDate(pilot.timestamp));

        } else{
            updateData(altitudeObject, noDataMessage); //переделать на сохранение последних полученных данных в течении суток
            updateData(groundHeightObject, noDataMessage);
            updateData(instantSpeedObject, noDataMessage);
            updateData(averageSpeedObject, noDataMessage)
            updateData(actualDateElement,noDataMessage);
            updateData(distanceObject,noDataMessage);
        }
        */
    }

    async function getPilotData(pilotId, timeShift){
        
        
        let currentTime = new Date().getTime();
        let  requestTime = Math.round((currentTime - Number(timeShift))/1000)
        watcher.requestTime = convertToShortDate(requestTime);
        
        let data = await getLiveData(pilotId, requestTime);
        let array = data[pilotId];
        if (array){
            
            array.reverse();
            pilot.baroAltitude = array[0].c;
            pilot.gpsAltitude = array[0].h;
            pilot.velocity = array[0].v;
            pilot.groundHeight = array[0].s;
            pilot.bearing = array[0].b;
            pilot.timestamp = array[0].d;
            pilot.latitude = array[0].ai / 60000;
            pilot.longitude = array[0].oi / 60000;
            pilot.averageVelocity60 = calculateAverageSpeed60(array);
            pilot.receivedData = true;
            let result = [pilot.timestamp, pilot.latitude, pilot.longitude, pilot.baroAltitude,
                 pilot.gpsAltitude, pilot.velocity, pilot.averageVelocity60, pilot.bearing, pilot.groundHeight]

            return result;
        } else {
            pilot.receivedData = false;
            return false;
        }
    }

    async function  getLiveData(sn,timeStamp){
        urlLocal = url + "?trackers={\"" + String(sn) + "\":" + String(timeStamp) + "}";
        let response = await fetch(urlLocal);
        let liveData = await response.json();
        return liveData;
    }

    /*
    function fillWatcherData(){
        
        if (array[2]!=0 && array[3]!=0 && array[4]!=0){
            updateData(distanceObject, calculateDistance(array));
            let directionToPilot = calculateDirection(array);
            updateData(directionObject,directionToPilot);
            setPointerColor("#4aa8dc");
            rotateRider(directionToPilot);
        } 
       
        updateData(accuracyObject,watcher.accuracy);
        updateData(shiftedDateElement, watcher.requestTime);
    }
        */

        /*
    function fillCalculatedData(){
        //0,1 -watcher coords, 2,3 - pilot coords, 4,5 - watcher gps and devOri heading
        calculateDistance();
        calculateWatcherToPilotAzimut();
        calculateDirectionsToPilot();
        updateData(distanceObject, pilot.distance);
        updateData(directionObject, calculations.directionToPilotGps);
        rotateRider(calculations.directionToPilotGps);
        setPointerColor("#4aa8dc");
        /*
        let pilotAzimut = calculateWatcherToPilotAzimut(array);
        let watcherHeading = array[4];
        if (watcherHeading != null){
            let directionToPilot = getDirectionsDelta(pilotAzimut, watcherHeading);
            updateData(directionObject,directionToPilot);
            setPointerColor("#4aa8dc");
            rotateRider(directionToPilot);
        } else {
            updateData(directionObject,"---");
        }
      
    }
      */

    function calculateAverageSpeed60(array){ 
        let speedSumm = 0;
        let speedEntryCount = 0;
        if (array.length < 60) {
            speedEntryCount = array.length;
        } else {
            speedEntryCount = 60;
        }
        for (let i = 0; i < speedEntryCount; i++){
            speedSumm += array[i].v;
        }
        let averageSpeed = speedSumm / speedEntryCount;
        return Math.round(averageSpeed,1);
    }

    function calculateDistance(){
        const latitudeDegDist = 111.321377778;
        const longitudeDegDist = 111.134861111;
        /*
        let latitudeA  = array[0];
        let longitudeA = array[1];
        let latitudeB = array[2];
        let longitudeB = array[3];
        */
        let latitudeA  = watcher.latitude;
        let longitudeA = watcher.longitude;
        let latitudeB = pilot.latitude;
        let longitudeB = pilot.longitude;
        let deltaLatitude = latitudeB - latitudeA;
        let deltaLongitude = longitudeB - longitudeA;
        let distanceLatitudeKm = deltaLatitude * latitudeDegDist * Math.cos(latitudeA);
        let distanceLongitudeKm = deltaLongitude * longitudeDegDist;
        let distance = Math.hypot(distanceLatitudeKm, distanceLongitudeKm);
        let result = distance.toFixed(3);
        calculations.distance = result;
        return result;
    }
    /*
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

        let directionToPilot = z - externalDirection;
        return  -Math.round(directionToPilot);
    }
    */
    function calculateWatcherToPilotAzimut(){
        /*
        let latitudeA  = degToRad(array[0]);
        let longitudeA = degToRad(array[1]);
        let latitudeB = degToRad(array[2]);
        let longitudeB = degToRad(array[3]);
        */
        let latitudeA  = watcher.latitude;
        let longitudeA = watcher.longitude;
        let latitudeB = pilot.latitude;
        let longitudeB = pilot.longitude;

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
        let result = radToDeg(z); //to degree
        calculations.watcherToPilotAzumit = result;
        return result;
    }

    /*
    function getDirectionsDelta(angle1, angle2){
        let result = Math.round(angle2 - angle1);
        return result;
    }
    */

    function calculateDirectionsToPilot(){
        calculations.directionToPilotGps = Math.round(calculations.watcherToPilotAzumit - watcher.gpsHeading);
        calculations.directionToPilotOri = Math.round(calculations.watcherToPilotAzumit - watcher.devOrientationHeading);
        console.log(calculations.directionToPilotOri);
    }

    /*
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
    */

    function calculateHeadingAverage(){
        if (headingStack.array.length == 0) {
            watcher.gpsHeading = null;
            return false;
        }
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
        watcher.gpsHeading = radToDeg(headingAverageRad);
        return true;
    }


    function getDevOrientationHeading(){
                
    }

    function convertToShortDate(time){
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
        
        if (data === null){
            element.innerHTML = "---";
            element.classList.add("noDataClass");
        } else if(Number.isNaN(data)){
            element.innerHTML = "NaN";
            element.classList.add("noDataClass");
        } else{
        element.innerHTML = data;
        element.classList.remove("noDataClass");
        }
    }

    function setNoDirection(){
        updateData(directionObject, null);
        rotateRider(0);
        setPointerColor("red");
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

    function isDefinedValue(value){
        if ((value === null ) || (Number.isNaN(value))){
            return false;
        } else{
            return true;
        }
    }

    function rotateRider(angle){
        lineRider.setAttribute('transform','rotate ('+angle+' 150 150)');

    }

    function switchToDevori(){
        if (watcher.headingModeDevOri){
            window.removeEventListener("deviceorientation", handleOrientation);
            watcher.headingModeDevOri = false;
            switchModeButtonElement.classList.remove("inputButtonClassPressed");
        } else{
            if (
                DeviceMotionEvent &&
                typeof DeviceMotionEvent.requestPermission === "function"
                ) {
                     DeviceMotionEvent.requestPermission();
                };
                window.addEventListener("deviceorientation", handleOrientation);
                watcher.headingModeDevOri = true;
                switchModeButtonElement.classList.add("inputButtonClassPressed");
        }
        
    }
    
    function handleOrientation(event){
        //console.log("devOriEvent");
        let  angle = - Math.round(event.webkitCompassHeading);
        if (angle != watcher.angle){
            let transformedAngle = 0;
        
            if (angle <= 180){
                transformedAngle =  - angle;
            } else {
                transformedAngle =  360 - angle;
            }
            watcher.devOrientationHeading = transformedAngle;
            updateView();
            watcher.angle = angle;
        }

        
        //transformedAngle = angle - 180;
        //if (transformedAngle != calculations.directionToPilotOri){
        //    calculations.directionToPilotOri = transformedAngle;

        //}



    };
    
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

