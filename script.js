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
//const inputButtonElement = document.getElementById("inputButtonElement");
//const switchModeButtonElement = document.getElementById("inputModeElement");
const accuracyObject = document.getElementById("accuracy");
const inputPilotButtonElement = document.getElementById("inputPilotButton");
const inputPilotButtonTextElement = document.getElementById("inputPilotButtonText")
const inputPilotButtonSpinnerElement = document.getElementById("inputButtonSpinner");
//const inputPilotButtonLabelElement = document.getElementById("inputPilotLabel");
const inputModeButtonElement = document.getElementById("inputModeButton");
//const inputModeButtonLabelElement = document.getElementById("inputModeLabel");
/* //////////////////////////
let debug1 = document.getElementById("gpsH");
let debug2 = document.getElementById("devOriH");
let debug3 = document.getElementById("az");
let debug4 = document.getElementById("toPHGps")
let debug5 = document.getElementById("toPHDevOri");
///////////////////////////  */
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
    maxDays: null,
    earliestDate: null,
    initialShift: 30000,
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
        calculateHeadingAverage();
        updateView();
    }
    function errorGetGPS(){
        watcher.gpsHeading = null;
        watcher.noGps = true;
        updateView();
    }
 
    function updateView(){
        /*
//////////////////////debug section
        updateData(debug1, watcher.gpsHeading);
        updateData(debug2, watcher.devOrientationHeading);
        updateData(debug3, calculations.watcherToPilotAzumit);
        updateData(debug4, calculations.directionToPilotGps);
        updateData(debug5, calculations.directionToPilotOri);
///////////////////////
*/

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
            //updateData(actualDateElement,convertToShortDate(pilot.timestamp))
            updateData(actualDateElement,getLivedataLatency(pilot.timestamp))

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
            //calculateDistance();
            //calculateWatcherToPilotAzimut();
            calculateDistanceBearing();
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

    async function inputPilot(){
        pilot.id = pilotIdElement.value;
        pilot.maxDays = timeShiftElement.value;
        if ((pilot.id == 0) || (!Number.isInteger(Number(pilot.id)))) {
            alert("не числовое или нулевое значение ID!");
            return;
        }
        if ((pilot.maxDays == 0) || (!Number.isInteger(Number(pilot.maxDays)))){
            alert("не числовое или нулевое значение окна наблюдения!");
            return;
        } 
        //pilot.timeShift = timeShiftElement.value * 1000;
        //inputButtonElement.classList.add("inputButtonClassPressed");
        if (timerPilotUpdate){
            pilotIdElement.disabled = false;
            timeShiftElement.disabled = false;
            setPilotButtonCaption("initial");
            //inputPilotButtonElement.classList.remove("btn-success");
            //inputPilotButtonElement.classList.remove("inputButtonClassPressed");
            clearInterval(timerPilotUpdate);
            timerPilotUpdate = 0;
        } else {

            pilotIdElement.disabled = true;
            timeShiftElement.disabled = true;
            pilot.clearData();
            pilot.earliestDate =  maxDaysToData(pilot.maxDays);
            setPilotButtonCaption("loading");
            pilot.timeShift =  await getTimeShift(pilot.earliestDate);
            if (pilot.timeShift == -1){
                fillPilotNoData();
                pilotIdElement.disabled = false;
                timeShiftElement.disabled = false;
                setPilotButtonCaption("initial");
                return;
            } else {
                fillPilotData();
                timerPilotUpdate = setInterval(fillPilotData,5000);
                setPilotButtonCaption("watching");
                //inputPilotButtonElement.classList.add("btn-success");
                //inputPilotButtonElement.classList.add("inputButtonClassPressed");
            }

        }        
    }

    function maxDaysToData(daysCount){
        if ((daysCount == 0)|| Number.isInteger(daysCount)){
            console.log("Error in day count watching window");
            throw new TypeError("Error in day count watching window");
            return false;
        }
        if (daysCount > 30) daysCount = 30;
        let currentDate = new Date();
        let beginDayDateUnix = currentDate.setHours(00,00,00,00);
        result = beginDayDateUnix - (86400000 * (daysCount - 1));
        pilot.earliestDate = result;
        return result;
    }

    function setPilotButtonCaption(mode){
        switch(mode){
            case "initial":
                inputPilotButtonElement.classList.remove("btn-success");
                inputPilotButtonTextElement.innerHTML = "запустить слежку";
                inputPilotButtonSpinnerElement.classList.add("visually-hidden");
                break;
            case "loading":
                inputPilotButtonElement.classList.remove("btn-success");
                inputPilotButtonTextElement.innerHTML = "грузим...";
                inputPilotButtonSpinnerElement.classList.remove("visually-hidden");
                break;
            case "watching":
                inputPilotButtonElement.classList.add("btn-success");
                inputPilotButtonTextElement.innerHTML = "остановить слежку";
                inputPilotButtonSpinnerElement.classList.add("visually-hidden");
                break;
            default:
                alert("ошибка в обработке статуса кнопки!")
        }
        return;
    }

    async function getTimeShift(date){
        pilot.timeShift = pilot.initialShift;
        let response = null;
        let pilotData = null;
        response = await getLiveData(pilot.id, getRequestTime(pilot.timeShift));
        pilotData = response[pilot.id];
        if (pilotDataIsValid(pilotData) == "ok") return pilot.timeShift;
        let firstPoint = pilot.timeShift;
        let currentUnixTime = new Date().getTime();
        pilot.timeShift = currentUnixTime - date;
        response = null;
        pilotData = null;
        response = await getLiveData(pilot.id, getRequestTime(pilot.timeShift));
        pilotData = response[pilot.id];
        if (pilotDataIsValid(pilotData) == "no data") return -1;
        let secondPoint = pilot.timeShift;
        while (pilotDataIsValid(pilotData) != "ok"){
            pilot.timeShift = Math.round((secondPoint + firstPoint) / 2);
            response = null;
            pilotData = null;
            response = await getLiveData(pilot.id, getRequestTime(pilot.timeShift));
            pilotData = response[pilot.id];
            if (pilotData){ 
                secondPoint = pilot.timeShift;
            } else {
                firstPoint = pilot.timeShift;
            }
            console.log (pilot.timeShift);
            if (pilotData){
                console.log (pilotData.length);
            } else{
                console.log("no data");
            }
            
        }
        return pilot.timeShift;
    }

/*         while ((getRequestUnixTime(pilot.timeShift) > date) && (!data)){
            response = await getLiveData(pilot.id, getRequestTime(pilot.timeShift));
            data = response[pilot.id];
            if (!data){
                pilot.timeShift += 9000000;
            }
        }
        if (!data) pilot.timeShift = -1;
        return pilot.timeShift; */
    



    function pilotDataIsValid(array){
        if (!array) return "no data"; 
        let result = (array.length < 301) ? "ok" : "exceed";
        return result;
    }


    function getRequestTime(shift){
        let currentTime = new Date().getTime();
        let  requestUnixTime = Math.round(currentTime - Number(shift));
        return Math.round (requestUnixTime / 1000);
    }

    async function fillPilotData(){ 
        const pilotData = await getPilotData(pilot.id, pilot.timeShift);
        updateView();
    }

    function fillPilotNoData(){
        updateView();
        updateData(altitudeObject, "no data");
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

    function calculateDistanceBearing(){
        const radius = 6372795;
        const latitudeA  = degToRad(watcher.latitude);
        const longitudeA = degToRad(watcher.longitude);
        const latitudeB = degToRad(pilot.latitude);
        const longitudeB = degToRad(pilot.longitude);0
        const aLatCos = Math.cos(latitudeA);
        const aLatSin = Math.sin(latitudeA);
        const bLatCos = Math.cos(latitudeB);
        const bLatSin = Math.sin(latitudeB);
        const deltaLongitude = longitudeB - longitudeA;
        const deltaCos = Math.cos(deltaLongitude);
        const deltaSin = Math.sin(deltaLongitude);
        //distance
        let y = Math.sqrt(Math.pow((bLatCos*deltaSin),2) + Math.pow((aLatCos*bLatSin-aLatSin*bLatCos*deltaCos),2))
        let x = aLatSin * bLatSin + aLatCos * bLatCos * deltaCos;
        const ad = Math.atan2(y, x);
        const distance = ((ad * radius) / 1000).toFixed(3);
        // bearing 
        x = (aLatCos * bLatSin) - (aLatSin * bLatCos * deltaCos);
        y = deltaSin * bLatCos;
        const z = Math.atan2(y, x);
        const bearing = (z * 180/Math.PI + 360) % 360;
        calculations.distance = distance;
        calculations.watcherToPilotAzumit = bearing;
    }



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
        headingAverageRad = Math.atan2(headingAverageSummSin, headingAverageSummCos);
        watcher.gpsHeading = (headingAverageRad * 180 / Math.PI + 360) % 360;
        return true;
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

    function getLivedataLatency(time){
        const currentUnixTime = new Date().getTime();
        const livedataUnixTime = time * 1000;
        const latency = currentUnixTime - livedataUnixTime;
        const calculatedDate = new Date(latency);
        let days = calculatedDate.getDate();
        let hours = calculatedDate.getHours();
        let minutes = calculatedDate.getMinutes();
        let seconds = calculatedDate.getSeconds();
        (days!= 0) ? days += "d " : days = "";
        (hours!= 0) ? hours += "h " : hours = "";
        (minutes!= 0) ? minutes += "m " : minutes = "";
        seconds = seconds += "s"; 
        return days + hours + minutes + seconds;
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
            inputModeButtonElement.classList.remove("btn-success");
            inputModeButtonElement.classList.remove("inputButtonClassPressed");

        } else{
            if (
                DeviceMotionEvent &&
                typeof DeviceMotionEvent.requestPermission === "function"
                ) {
                     DeviceMotionEvent.requestPermission();
                };
                window.addEventListener("deviceorientation", handleOrientation);
                watcher.headingModeDevOri = true;
                inputModeButtonElement.classList.add("btn-success");
                inputModeButtonElement.classList.add("inputButtonClassPressed");
        }
        
    }
    
    function handleOrientation(event){
        let  angle = Math.round(event.webkitCompassHeading);
        if (angle != watcher.angle){
            watcher.devOrientationHeading = angle;
            updateView();
            watcher.angle = angle;
        }
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

