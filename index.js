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

// database
const db = require('./model/database');

const port = process.env.PORT || "8000";
server.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});