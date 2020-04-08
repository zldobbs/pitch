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
const LoginRoute = require('./routes/api/login'); 
const RegisterRoute = require('./routes/api/register');
const RoomRoute = require('./routes/api/room');
app.use('/api/login', LoginRoute); 
app.use('/api/register', RegisterRoute);
app.use('/api/room', RoomRoute);

// database
const db = require('./model/database');

const port = process.env.PORT || "8000";
server.listen(port, () => {
  // TODO Create a new function to cleanup any rooms w/o games associated with them when server starts 
  console.log(`Listening to requests on http://localhost:${port}`);
});