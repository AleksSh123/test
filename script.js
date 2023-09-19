const arrowObject=document.getElementById("line2");
const altitudeObject = document.getElementById("altitude");
const groundHeightObject = document.getElementById("groundHeight");
const instantSpeedObject = document.getElementById("instantSpeed");
const averageSpeedObject = document.getElementById("averageSpeed");
const distanceObject = document.getElementById("distance");
const directionObject = document.getElementById("direction");
const pilotIdElement = document.getElementById("pilotId");
const timeShiftElement = document.getElementById("timeShift");
const requestDateElement = document.getElementById("requestDate");
const lastSeenDateElement = document.getElementById("lastSeenDate");
const lastSeenAgoElement = document.getElementById("lastSeenAgo");
const lineRider = document.getElementById("line2");
const accuracyObject = document.getElementById("accuracy");
const inputPilotButtonElement = document.getElementById("inputPilotButton");
const inputPilotButtonTextElement = document.getElementById("inputPilotButtonText")
const inputPilotButtonSpinnerElement = document.getElementById("inputButtonSpinner");
const inputModeButtonElement = document.getElementById("inputModeButton");
const inputModeButtonTextElement = document.getElementById("modeButtonText");
const linkToGoogleMapElement = document.getElementById("linkToGoogleMap");
const linkToVeloMapElement = document.getElementById("linkToMapVelo");
let noDataModal = new bootstrap.Modal(document.getElementById("modalDialog"));
let controller = new AbortController();

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


        
        if (!watcher.noGps){
            updateData(accuracyObject,watcher.accuracy);
        } else{
            updateData(accuracyObject,"no GPS available");
        }
        if (pilot.receivedData){
            updateData(altitudeObject, pilot.baroAltitude);
            updateData(groundHeightObject, pilot.groundHeight);
            updateData(instantSpeedObject, pilot.velocity);
            updateData(averageSpeedObject, pilot.averageVelocity60);
            updateData(requestDateElement, convertToShortDate(watcher.requestTime));
            updateData(lastSeenDateElement,convertToShortDate(pilot.timestamp));
            updateData(lastSeenAgoElement, getLivedataLatency(pilot.timestamp));
            //linkToGoogleMapElement.setAttribute("href","https://www.openstreetmap.org/?mlat=" + pilot.latitude + "&mlon=" + pilot.longitude + "&zoom=13");
            //http://maps.google.com/maps?z=12&t=m&q=loc:56.041173%2C92.614961
            //linkToGoogleMapElement.setAttribute("href","http://maps.google.com/maps?z=12&t=h&q=loc:" + pilot.latitude + "+" + pilot.longitude);
            https://www.google.com/maps/search/?api=1&query=56.041173%2C92.614961
            http://maps.google.com/?q=MY%20LOCATION@lat,long
            linkToGoogleMapElement.setAttribute("href","http://maps.google.com/?q=MY%20LOCATION@" + pilot.latitude + "," + pilot.longitude + "&t=h&z=5");
            linkToGoogleMapElement.setAttribute("target","blank");
            linkToVeloMapElement.setAttribute("href","https://www.openstreetmap.org/?mlat=" + pilot.latitude + "&mlon=" + pilot.longitude + "&zoom=13&layers=C");
            linkToVeloMapElement.setAttribute("target","blank");
        } else {
            updateData(altitudeObject, null);
            updateData(groundHeightObject, null);
            updateData(instantSpeedObject, null);
            updateData(averageSpeedObject, null);
            updateData(requestDateElement, convertToShortDate(watcher.requestTime));
            updateData(lastSeenDateElement, null);
            updateData(lastSeenAgoElement, null);
            updateData(distanceObject, null);
            setNoDirection();
        }
        if ((!watcher.noGps) && (pilot.receivedData)){
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
        let requestTimestamp;
        if ((pilot.id == 0) || (!Number.isInteger(Number(pilot.id)))) {
            alert("не числовое или нулевое значение ID!");
            return;
        }
        if ((pilot.maxDays == 0) || (!Number.isInteger(Number(pilot.maxDays)))){
            alert("не числовое или нулевое значение окна наблюдения!");
            return;
        } 
        if (timerPilotUpdate){
            pilotIdElement.disabled = false;
            timeShiftElement.disabled = false;
            setPilotButtonCaption("initial");
            clearInterval(timerPilotUpdate);
            timerPilotUpdate = 0;
        } else {

            pilotIdElement.disabled = true;
            timeShiftElement.disabled = true;
            pilot.clearData();
            pilot.earliestDate =  maxDaysToData(pilot.maxDays);
            setPilotButtonCaption("loading");
            inputPilotButtonElement.setAttribute("onclick","stopFetching()");
            try {
                requestTimestamp =  await getTimeShift(pilot.earliestDate);
            } catch(error){
                if (error.name == "AbortError"){
                    pilotIdElement.disabled = false;
                    timeShiftElement.disabled = false;
                    setPilotButtonCaption("initial");
                    return;

                } else {
                    alert(error);
                    pilotIdElement.disabled = false;
                    timeShiftElement.disabled = false;
                    setPilotButtonCaption("initial");
                    return;
                }
            } finally{
                inputPilotButtonElement.setAttribute("onclick","inputPilot()");
            }


             if (requestTimestamp == -1){
                noDataModal.show();
                fillPilotNoData();
                pilotIdElement.disabled = false;
                timeShiftElement.disabled = false;
                setPilotButtonCaption("initial");
                return;
            } else {
                //await getPilotData(pilot.id, requestTimestamp); //инициирующий запрос данных (pilot.timestamp) пилота после обнаружения времени входа
                fillPilotData();
                timerPilotUpdate = setInterval(fillPilotData,5000);
                setPilotButtonCaption("watching");

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
                inputPilotButtonTextElement.innerHTML = "Отменить";
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

    async function getTimeShift(earliestDate){
        let currentUnixTime = new Date().getTime();
        let requestTimestamp = Math.round((currentUnixTime - pilot.initialShift)/1000)
        //pilot.timeShift = pilot.initialShift;
        let response = null;
        let pilotData = null;
        response = await getLiveData(pilot.id, requestTimestamp);
        if (response === false) return -2;
        pilotData = response[pilot.id];
        if (pilotDataIsValid(pilotData) == "ok"){
            getPilotData(pilot.id, requestTimestamp);
            return requestTimestamp;
        } 
        let firstPoint = requestTimestamp;
        //let currentUnixTime = new Date().getTime();
        requestTimestamp = Math.round(earliestDate / 1000);
        response = null;
        pilotData = null;
        response = await getLiveData(pilot.id, requestTimestamp);
        pilotData = response[pilot.id];
        if (pilotDataIsValid(pilotData) == "no data") return -1;
        let secondPoint = requestTimestamp;
        while (pilotDataIsValid(pilotData) != "ok"){
            requestTimestamp = Math.round((secondPoint + firstPoint) / 2);
            response = null;
            pilotData = null;
            response = await getLiveData(pilot.id, requestTimestamp);
            pilotData = response[pilot.id];
            if (pilotData){ 
                secondPoint = requestTimestamp;
            } else {
                firstPoint = requestTimestamp;
            }
            console.log (pilot.timeShift);
            if (pilotData){
                console.log (pilotData.length);
            } else{
                console.log("no data");
            }
            
        }
        await getPilotData(pilot.id, requestTimestamp);
        return requestTimestamp;
    }

    function pilotDataIsValid(array){
        if (!array) return "no data"; 
        let result = (array.length < 900) ? "ok" : "exceed";
        return result;
    }


    function getRequestTime(shift){
        let currentTime = new Date().getTime();
        let  requestUnixTime = Math.round(currentTime - Number(shift));
        return Math.round (requestUnixTime / 1000);
    }

    async function fillPilotData(){ 
        const pilotData = await getPilotData(pilot.id, 0);
        updateView();
    }

    function fillPilotNoData(){
        updateView();
        updateData(altitudeObject, "no data");
    }


    async function getPilotData(pilotId, timeStamp){ 
/*         let currentTime = new Date().getTime();
        let  requestTime = Math.round((currentTime - Number(timeShift))/1000)
        watcher.requestTime = convertToShortDate(requestTime); */
        let requestTime;        
        if (timeStamp != 0){
            requestTime = timeStamp
        } else{
            requestTime = pilot.timestamp - 70;
        }
        watcher.requestTime = requestTime;
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
        let liveData;
        try{
            let response = await fetch(urlLocal,{
                signal: controller.signal
              });
            liveData = await response.json();
        }
        catch(error){
            throw(error);
        }
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
        if (time == null) return null;
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
        let days = calculatedDate.getDate() - 1 ;
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
            inputModeButtonTextElement.innerHTML = "включить компас";
            //inputModeButtonElement.classList.remove("inputButtonClassPressed");

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
                inputModeButtonTextElement.innerHTML = "выключить компас";
                //inputModeButtonElement.classList.add("inputButtonClassPressed");
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

    function stopFetching(){
        controller.abort();
        controller = new AbortController();
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

