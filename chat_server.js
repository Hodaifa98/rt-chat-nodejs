const express = require("express");
const app = express();
//A server which will communicate with Socket.io.
const server = require("http").Server(app);
const io = require("socket.io")(server);

//Declare an object to hold rooms.
const rooms = {};

//Setup express server.
app.set("views", "./views");
app.set("view engine", "ejs");
//Where we'll be serving files from (js directory).
app.use(express.static("public"));
//Allow app to use URL encoded parameters inside the body of a form.
app.use(express.urlencoded({extended: true}))

//Define index route.
app.get("/", (request, response) => {
    response.render("index", {rooms: rooms});
});

//Define GET route for rooms (room is a parameter).
app.get("/:room",  (request, response) => {
    //Only redirect to room if it exists.
    if(rooms[request.params.room] != null)
        response.render("room", {roomName: request.params.room});
    else
        return response.redirect("/");
});

//Define POST route for creating a room.
app.post("/room",  (request, response) => {
    //If the room already exist, redirect the user to the index page.
    if(rooms[request.body.room] != null)
        return response.redirect("/");
    rooms[request.body.room] = {users: {}};
    response.redirect(request.body.room);
    //Send message that the new room is created.
    io.emit("room-created", request.body.room);
});

//Specify port.
server.listen(3000);

//
io.on("connection", socket => {
    socket.on("new-user", (room, name) => {
        //Add user to a specifc room. Then socket.to() will target this and other users in the same room.
        socket.join(room);
        rooms[room].users[socket.id] = name;
        //socket.broadcast.emit("user-connected", name);
        socket.to(room).broadcast.emit("user-connected", name);
    });
    socket.on("send-chat-message", (room, message) => {
        //Send to all other users in the room except this socket.
        socket.to(room).broadcast.emit("chat-message", {
            message: message,
            name: rooms[room].users[socket.id]
        });
    })
    socket.on("disconnect", () => {
        //Delete user from all rooms.
        getUserRooms(socket).forEach(room => {
            socket.to(room).broadcast.emit("user-disconnected", rooms[room].users[socket.id]);
            delete rooms[room].users[socket.id]; 
        });
        //Note: The user is automatically removed from their room when they disconnect.
    })
});

//Return the name of the rooms which the user is a part of.
function getUserRooms(socket){
    //Convert rooms to iterable key values.
    return Object.entries(rooms).reduce((names, [name, room]) => {
        if(room.users[socket.id] != null)
            names.push(name);
        return names; //To use in the next iteration.
    }, []); //Default to empty array.
}