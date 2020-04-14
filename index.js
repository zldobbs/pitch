// index.js 

const auth = require("./auth.json");
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, { origins: `${auth.client.ipaddr}:${auth.client.port}` });

app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());

app.io = io;

// Route definitions
const GameRoute = require('./routes/api/game'); 
const LoginRoute = require('./routes/api/login'); 
const RegisterRoute = require('./routes/api/register');
const RoomRoute = require('./routes/api/room');
const TeamRoute = require('./routes/api/team');
app.use('/api/game', GameRoute); 
app.use('/api/login', LoginRoute); 
app.use('/api/register', RegisterRoute);
app.use('/api/room', RoomRoute);
app.use('/api/team', TeamRoute);

// database
const db = require('./model/database');

const port = process.env.PORT || "8000";
server.listen(port, () => {
  // TODO Create a new function to cleanup any rooms w/o games associated with them when server starts 
  console.log(`Listening to requests on http://localhost:${port}`);
});

// socket.io setup
io.on('connection', (socket) => {
    console.log("New user connected");

    // Joins the given socket to the given room
    socket.on('join-room', (room) => {
        console.log('User joining room: ' + room);
        socket.join(room);
        // To check whos in the room: 
        console.log(io.sockets.adapter.rooms[room]);
    });
});