// read env files
const result = require('dotenv').config();
if (result.error) {
	throw result.error;
}

// http
const express = require('express');
const server = express();
const http = require('http').Server(server);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
server.use(bodyParser.json()); // support json encoded bodies
server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
server.use(express.static('public'));

// local var and functions
var timelog = function() { d = new Date(); return "[" + d.getHours().toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + d.getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + d.getSeconds().toLocaleString(undefined, {minimumIntegerDigits: 2}) + "] "; }
var log = function(msg) { if (typeof msg === "object") console.log(timelog() + JSON.stringify(msg)); else console.log(timelog() + msg); }
// var userslog = function() { log(users.length + " user(s) connected :"); users.forEach(user => { log( "• " + user.name + " - " + user.id) }) }
var indexOf = function(array, name, value) {
	for (var i = 0; i < array.length; i++)
		if (array[i][name] == value)
			return i;
	return -1;
}

// root
server.get('/', (req, res) => {
	res.sendFile(process.env.ROOTDIR + "/index.html", (err, data) => {
	    if (err) {
	      res.writeHead(500);
	      return res.end("Error loading index.html");
	    }
	})
});


io.on("connection", (socket) => {
	// broadcast message
	socket.on("message", function(msg) {
		socket.broadcast.to(socket.user.roomId).emit('message', msg);
	});
	// creating a new room
	socket.on("create_room", function(user) {
		socket.user = user;
		if (Object.keys(io.nsps['/'].adapter.rooms).length < 20){
			socket.join(socket.user.roomId);
			log("Room \"" + socket.user.roomId + "\" has been created");
			log(socket.user.name + " has joined \"" + socket.user.roomId + "\"");
		} else
			socket.emit('failure', [{ message: 'There are already too many rooms.' }]);
	});
	// joining a room
	socket.on("join_room", function(user) {
		socket.user = user;
		let errors = validator(socket);
		if (errors == null) {
			socket.join(socket.user.roomId);
			log(socket.user.name + " has joined \"" + socket.user.roomId + "\"");
			io.sockets.in(socket.user.roomId).emit('get_names', get_users(socket.user.roomId));
		} else {
			socket.user.roomId = null;
		}
		socket.emit('failure', errors);
    });
	// update the game
	socket.on("update_game", function(game) {
		let room = io.nsps['/'].adapter.rooms[socket.user.roomId];
		if (room != undefined && game != null && room.isPlaying != true)
			room.isPlaying = true;
		if (socket.user.roomId != null)
			socket.broadcast.to(socket.user.roomId).emit('update_game', game);
	});
	// leaving a room
	socket.on("disconnect", function(data) {
		if (socket.user != undefined && socket.user.roomId != null){
			log(socket.user.name + " has left \"" + socket.user.roomId + "\"");
			if (io.nsps['/'].adapter.rooms[socket.user.roomId] == undefined) log("Room \"" + socket.user.roomId + "\" has been deleted");
			io.sockets.in(socket.user.roomId).emit('get_names', get_users(socket.user.roomId));
		}
	});
	// get usernames
	function get_users(roomId){
		let sockets = [];
		let room = io.nsps['/'].adapter.rooms[roomId];
		if (room == undefined) return [];
		for (let id in room.sockets)
			sockets.push(id);
		let users = [];
		sockets.forEach((socketId, index) => {
			let user = io.nsps['/'].sockets[socketId].user;
			if (user != null)
				users.push(user);
		});
		return users;
	}
	// validator for joining a room
	function validator(socket) {
		let errors = [];
		let room = io.nsps['/'].adapter.rooms[socket.user.roomId];
		if (room == undefined)
			errors.push({ message: 'This room does not exist.' });
		else {
			if (room.length >= 10)
				errors.push({ message: 'This room is full.' });
			get_users(socket.user.roomId).forEach((user, i) => {
				if (user._id == socket.user._id)
					errors.push({ message: user.name + ' is already connected in this room.' });
			});
			if (socket.game != undefined){
				let i = 0;
				while (i < socket.game.players.length) {
					if (socket.game.players[i]._id == socket.user._id)
						break;
					i++;
				}
				if (i == socket.game.players.length)
					errors.push({ message: 'The game has already started.' })
			}
		}
		return errors.length == 0 ? null : errors;
	}
});


// Errors
server.use(function(req, res, next) {
    res.status(403).send("Sorry, you can't go there :)");
});
server.use(function(req, res, next) {
    res.status(404).send("Sorry, that route doesn't exist. Have a nice day :)");
});
server.use(function(req, res, next) {
	res.status(500).send("Oops! Something blew up :)");
});


http.listen(process.env.PORT, () => { log(`Server listening at http://localhost:${process.env.PORT}`) });
