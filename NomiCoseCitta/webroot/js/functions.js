var counter_games = 1;


function  registerHandlerForUpdateGame(game_id) {
    var eventBus = new EventBus('http://localhost:8080/eventbus');
    eventBus.onopen = function () {
        eventBus.registerHandler('game.' + game_id);
        console.log("game id created")
    }
};



function create(){

 var game_id = counter_games++;
 registerHandlerForUpdateGame(game_id);
 var playerName = document.getElementById('playerName').value;
 document.getElementById("create").style.visibility="visible";

 var xmlhttp = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttp.open("POST", "http://localhost:8080/api/game/" + game_id);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    console.log("in create");
    xmlhttp.send(JSON.stringify({name: playerName}));
}