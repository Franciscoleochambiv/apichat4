const express = require('express'); //no important statements since we are in the node and we import it via require
const socketio = require('socket.io');
const fs = require("fs");
const http = require('http');
const cors = require('cors'); //we used cors since heroku is used for backend, netlify is used for frontend, we need to connect them
//we need cors in this file or else some of our requests(sockets) will be ignored and or  not accepted
//when we deploy the website sometimes it restricts the resources that are being sent
const https = require("https");
const path = require('path');

const { addUser, removeUser, getUser, getUsersInRoom } = require ('./users.js');

const PORT = process.env.PORT || 8006;  //5000 is for local to try it out
const router = require('./router'); //since we created our router and router, we can require router

const app = express();


const httpsOptions = {
    cert:fs.readFileSync(path.join(__dirname,'ctr','cert1.pem')),
    key:fs.readFileSync(path.join(__dirname,'ctr','privkey1.pem'))
 }


const server = https.createServer(httpsOptions,app)

//http.createServer(app);
const io = socketio(server);  //this is an instance of the socketio

app.use(router);
app.use(cors());


//This part is for socket.io

/*The socket will be connected as a client side socket
    and we manage this socket that is just connected in here as well hence why we also have the disconnection in here.
    It is an instance of a socket that we use. 
  On Join
    When the socket reads the string join, it calls a call back function.
    The call back function's parameters is an object with name and room.
    We are access on the backend here for name& room
    Theres a callback in the socket.on event that triggers a response whenver the socket.on event is emmitted
 ERROR HANDELING
    user joined- passes data- do somelogic on backend- pass in a call back that socket.io has gave us 
    if there is an error we handle it with an alert on the front end
MESSAGES
    Admin generated ones are 'message'
    USer generated are 'sendMessage'
    
*/

//usually its server.on('request(event name)', requestListener( a function))
io.on('connection', (socket) => {
    socket.on('join', ({name, room}, callback) => {
        console.log("usuario conectado "+ name+"  "+room)
        const { error, user } = addUser({ id: socket.id, name, room}); //add user function can only return 2 things a user with error property or user property
        
        if(error) return callback(error); //error handeling
        //no errors
        //emit an event from the backend to the front end with a payload in {} part
        socket.emit('message', { user: 'admin', text: `${user.name}, Bienvenido a sala  ${user.room}` }); // welcomes user to chat
        //broadcast sends a message to everyone besides that specific user
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, Se ha unido!`});//lets everyone know except user that they joined 

        socket.join(user.room);
        //emit to the room that the user belongs too, hence why we pass in user.room to get the users in that room
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        callback();
    });

    //gets an event from the front end, frontend emits the msg, backends receives it
    socket.on('sendMessage', (message, callback) =>{
        const user = getUser(socket.id); //we havve access to socket from above
        //when the user leaves we send a new message to roomData
        //we also send users since we need to know the new state of the users in the room

        console.log("eminimos el mensaje en esta sala de cosnulta"+ user.room+"  "+user.name+" "+message)
        io.to(user.room).emit('message', { user: user.name, text: message });
        callback();

    })

    //does not take any parameters since we are just unmounting here
    socket.on('disconnect', () => {
         
        const user = removeUser(socket.id); //remove user when they disconnect
        //admin sends a message to users in the room that _ user has left

        console.log("desconectameo al usuario  " )
        if(user) {
            io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        }
    })
})

/*
 https.createServer(httpsOptions,server)
  .listen( PORT,function(){
   console.log(`Server running on port https ${PORT}`)      
      })


*/


server.listen(PORT, () => console.log(`Server has started on puerto ${PORT}`));





