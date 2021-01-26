const socket = io();

const message_form = document.getElementById("send-container");
const message_input = document.getElementById("message-input");
const message_container = document.getElementById("message-container");
const room_container = document.getElementById("room-container");

//Only prompt for a name and add submit event when we have a form.
if(message_form != null){
    let name = prompt("What is your name?");
    appendMessage("You joined the chat!");
    if(!name || name.trim() === "")
        name = "Unknown";
    socket.emit("new-user",roomName, name);

    //Add submit event.
    message_form.onsubmit = e => {
        e.preventDefault();
        const message = message_input.value;
        appendMessage(`You: ${message}`);
        socket.emit("send-chat-message", roomName, message);
        message_input.value = "";
    };
}

socket.on("room-created", room => {
    const roomElement = document.createElement("div");
    roomElement.innerText = room;
    const roomLink = document.createElement("a");
    roomLink.href = `/${room}`;
    roomLink.innerText = "Join";
    room_container.append(roomElement);
    room_container.append(roomLink);
});

socket.on("chat-message", data => {
    appendMessage(`${data.name}: ${data.message}`);
});

socket.on("user-connected", name => {
    appendMessage(`${name} connected to the chat!`);
});

socket.on("user-disconnected", name => {
    appendMessage(`${name} disconnected from the chat!`);
});

function appendMessage(message){
    const message_element = document.createElement("div");
    message_element.innerText = message;
    message_container.append(message_element);
}