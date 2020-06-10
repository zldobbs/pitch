// index.js 

const auth = require("./auth.json");
const express = require("express");
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());

app.io = io;

// Models 
const Game = require('./model/Game');
const Player = require('./model/Player');
const Room = require('./model/Room');
const Team = require('./model/Team');
const User = require('./model/User');

// Route definitions
const GameRoute = require('./routes/api/game'); 
const LoginRoute = require('./routes/api/login'); 
const PlayerRoute = require('./routes/api/player');
const RegisterRoute = require('./routes/api/register');
const RoomRoute = require('./routes/api/room');
const TeamRoute = require('./routes/api/team');
app.use('/api/game', GameRoute); 
app.use('/api/login', LoginRoute); 
app.use('/api/player', PlayerRoute); 
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

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('pitch-client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'pitch-client', 'build', 'index.html'));
  })
}

// socket.io setup
io.on('connection', (socket) => {
    // Joins the given socket to the given room
    socket.on('join-room', (room) => {
        console.log('User joining room: ' + room);
        socket.join(room);
        // To check whos in the room: 
        // console.log(io.sockets.adapter.rooms[room]);
    });
});