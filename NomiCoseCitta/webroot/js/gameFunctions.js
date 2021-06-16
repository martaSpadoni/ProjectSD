
var host = "http://192.168.1.6:8080";
var gameID = "";
var eventbus_mio;

function getSocketUri(url){
    var startIndex = url.indexOf("/eventbus");
    return url.slice(startIndex);
}

function  registerHandlerForUpdateGame(name, gameID) {
    eventbus_mio = new EventBus(host + '/eventbus');
    eventbus_mio.onopen = function () {
        eventbus_mio.registerHandler('game.' + gameID, function (error, jsonResponse) {
            if (jsonResponse !== "null") {
                console.log(jsonResponse.body);
                var js = JSON.parse(jsonResponse.body);
                var ul = document.getElementById("dynamic-list");
                ul.innerHTML = '';
                js.users.forEach(user => {
                    var li = document.createElement("li");
                    li.setAttribute('id', user);
                    li.appendChild(document.createTextNode(user));
                    ul.appendChild(li);
                });
                if (js.couldStart === true) {
                    document.getElementById("startButton").disabled = false;
                }
            }
        });

        eventbus_mio.registerHandler('game.' + gameID + '/start', function (error, jsonResponse) {
            console.log("inside start eventbus handler");
            if (jsonResponse != null) {
                console.log(jsonResponse.body);
                var js = JSON.parse(jsonResponse.body);
                var span = document.getElementById("categories");
                js.categories.forEach(category => {
                    var label = document.createElement("label");
                    label.setAttribute("for", category);
                    label.appendChild(document.createTextNode(category));

                    var br = document.createElement("br");
                    var br1 = document.createElement("br");

                    var inputElement = document.createElement("input");
                    inputElement.setAttribute("id", category);
                    inputElement.setAttribute("type", "text");
                    inputElement.setAttribute("name", category);

                    span.appendChild(label);
                    span.appendChild(br);
                    span.appendChild(inputElement);
                    span.appendChild(br1);

                });
                document.getElementById("waiting").style.display = "none" ;
                document.getElementById("game").style.display = "inline" ;
            }
        });
        console.log(eventbus_mio);
        joinRequest(name,getSocketUri(eventbus_mio.sockJSConn._transport.url), gameID);
    }

//    eventbus_mio.onclose = function (){
//        var obj = new Object();
//        obj.gameID = gameID;
//        obj.userID  = name;
//        console.log(name + "si è disconnesso");
//        var xmlhttp = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
//        xmlhttp.onreadystatechange = function() {
//            if (this.readyState === 4 && this.status === 200) {
//               console.log("disconnected successfully")
//            }
//        };
//        xmlhttp.open("POST", host + "/api/game/disconnect/" + gameID);
//        xmlhttp.setRequestHeader("Content-Type", "application/json");
//        console.log("in leave");
//        xmlhttp.send(JSON.stringify(obj));
//    }
}

function init(){
//    window.addEventListener('beforeunload', function (e) {
//        e.preventDefault();
//        e.returnValue = '';
//        close1();
//    });
    var url = new URL(document.URL);
    var name = url.searchParams.get("name");
    console.log(name);
    addItem(name);
    gameID = url.searchParams.get("gameID");
    var gameIdParagraph = document.getElementById("gameID").textContent;
    document.getElementById("gameID").innerHTML = gameIdParagraph + gameID;
    registerHandlerForUpdateGame(name, gameID);
    var form = document.querySelector('form');
    form.addEventListener('submit', handleSubmit);
}

function joinRequest(name, address, gameID){
    var req = {};
    req.userID = name;
    req.gameID = gameID;
    req.userAddress = address;
    console.log("In Join address: " + address);
    var xmlhttp = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttp.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
        if(xmlhttp.responseText === "null") {
            alert("You cannot join this game!");
            window.location.href = "index.html";
        }
    }
    };
    xmlhttp.open("POST", host + "/api/game/join/" + gameID);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    console.log("in join " + JSON.stringify(req));
    // la waiting room deve aggiornarsi nel momento in cui entrano altri utenti.
    xmlhttp.send(JSON.stringify(req));
}

function addItem(name){
    var ul = document.getElementById("dynamic-list");
    var li = document.createElement("li");
    li.setAttribute('id',name);
    li.appendChild(document.createTextNode(name));
    ul.appendChild(li);
}

function startGame() {
    var req = {};
    req.gameID = gameID;
    var xmlhttp = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttp.open("POST", host + "/api/game/start/" + gameID);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    console.log("in start");
    xmlhttp.send(JSON.stringify(req));
}

//function close1(){
//    alert("stai per chiudere la pagina");
//    eventbus_mio.close();
//}

function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    const value = Object.fromEntries(data.entries());
    console.log({value});
    // var xmlhttp = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    // xmlhttp.onreadystatechange = function() {
    //     if (this.readyState === 4 && this.status === 200) {
    //     }
    // };
    // xmlhttp.open("POST", host + "/api/game/round");
    // xmlhttp.setRequestHeader("Content-Type", "application/json");
    // console.log("in create");
    // xmlhttp.send(JSON.stringify(value));
}


