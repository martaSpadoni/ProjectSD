var createdGames = 0;
var name = "";
function  registerHandlerForUpdateGame(game_id) {
    var eventBus = new EventBus('http://localhost:8080/eventbus');
    eventBus.onopen = function () {
        eventBus.registerHandler('game.' + game_id);
        console.log("game id created")
    }
}

function init() {
   var url = new URL(document.URL);
   name = url.searchParams.get("name");
   document.getElementById("userID").value = name;
    var xmlhttp = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
           createdGames = xmlhttp.responseText;
           registerHandlerForUpdateGame(createdGames);
           document.getElementById("gameID").value = createdGames;
        }
    };
    xmlhttp.open("GET", "http://localhost:8080/api/game/create");
    xmlhttp.send();
   var form = document.querySelector('form');
   form.addEventListener('submit', handleSubmit);
}

function addItem(){
    var span = document.getElementById("categoriesSpan");
    var candidate = document.getElementById("candidate");
    var checkbox = document.createElement("input");
    checkbox.setAttribute("type","checkbox");
    checkbox.setAttribute("name","categories");
    checkbox.setAttribute("id",candidate.value);
    checkbox.setAttribute("value",candidate.value);
    checkbox.checked = true;

    var label = document.createElement("label");
    label.setAttribute("for",candidate.value);
    label.innerText = candidate.value;
    span.appendChild(checkbox);
    span.appendChild(label);

    document.getElementById("candidate").value = "";

}

function removeItem(){
    var ul = document.getElementById("dynamic-list");
    var candidate = document.getElementById("candidate");
    var item = document.getElementById(candidate.value);
    ul.removeChild(item);
}

function handleSubmit(event) {
    // il problema è che quando io vorrei aggiungere le categorie, per qualche motivo scatta questo handler.
    //Bisognerebbe riuscire a differenziare gli eventi.
       event.preventDefault();
       const data = new FormData(event.target);
       const value = Object.fromEntries(data.entries());
       value.categories = data.getAll("categories");
       console.log({value});
       var xmlhttp = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
       xmlhttp.open("POST", "http://localhost:8080/api/game/" + createdGames);
       xmlhttp.setRequestHeader("Content-Type", "application/json");
       console.log("in create");
       window.location.href = "waitingRoom.html?name=" + name + "&gameID=" + createdGames;
       xmlhttp.send(JSON.stringify(value));
}
