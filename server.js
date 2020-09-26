// read env files
const result = require('dotenv').config();
if (result.error) throw result.error;

// http
const express = require('express');
const server = express();
const http = require('http').Server(server);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
server.use(bodyParser.json()); // support json encoded bodies
server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
server.use(express.static('client'));

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

// model
const Game = require('./server/Game');
const Player = require('./server/Player');

// root
server.get('/', (req, res) => {
	res.sendFile(__dirname + "/views/index.html", (err, data) => {
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
			io.nsps['/'].adapter.rooms[socket.user.roomId]._id = socket.user.roomId;
			// log("Room \"" + socket.user.roomId + "\" has been created");
			// log(socket.user.name + " has joined \"" + socket.user.roomId + "\"");
		} else
			socket.emit('failure', [{ message: 'There are already too many rooms.' }]);
	});
	// joining a room
	socket.on("join_room", function(user) {
		socket.user = user;
		let errors = validator(socket);
		if (errors == null) {
			socket.join(socket.user.roomId);
			// log(socket.user.name + " has joined \"" + socket.user.roomId + "\"");
			io.nsps['/'].to(socket.user.roomId).emit('get_users', getUsers(socket.user.roomId));
			let room = io.nsps['/'].adapter.rooms[socket.user.roomId];
			if (room.game != undefined)
				socket.emit('start_game', room.game, room.game.rules.rules);
		} else {
			socket.user.roomId = null;
		}
		if (errors != null)
			socket.emit('failure', errors);
	});
	// creating and starting the game
	socket.on("start_game", function(gamemode, rulesList) {
		let room = io.nsps['/'].adapter.rooms[socket.user.roomId];
		let players = [];
		getUsers(socket.user.roomId).forEach((user, i) => {
			players.push(new Player(user._id, user.name));
		});
		if (room != undefined) {
			room.game = new Game(socket.user.roomId, players, gamemode, rulesList);
			io.nsps['/'].to(socket.user.roomId).emit('start_game', room.game, rulesList);
		} else
			socket.emit('failure', [{ message: 'The game cannot start. Please create a new one.' }]);
	});
	// updating rules
	socket.on("game_options", function(gamemode, rulesList) {
		socket.broadcast.to(socket.user.roomId).emit('game_options', gamemode, rulesList);
    });
	// update the game
	socket.on("update_game", function(data) {
		let room = io.nsps['/'].adapter.rooms[socket.user.roomId];
		if (room != undefined) {
			if (room.game == undefined || room.game == null)
				socket.emit('failure', [{ message: 'The game does not exist.' }]);
			else if (socket.user._id === room.game.players[room.game.round.turn]._id && !room.game.end) {
				let stateChanged = true;
				switch (data.type) {
					case 'play':
						room.game.round.play(data.card);
						break;
					case 'draw-card':
						room.game.round.drawCards();
						break;
					case 'choose':
						room.game.round.choose(data.what, data.thing);
						break;
					case 'end-turn':
						room.game.round.endTurn();
						io.nsps['/'].to(socket.user.roomId).emit('said_uno', false);
						socket.emit('contested_uno', false);
						break;
					default:
						stateChanged = false;
				}
				if (stateChanged) {
					room.game.checkState();
					if (room.game.end)
						io.nsps['/'].to(socket.user.roomId).emit('message', JSON.stringify({ username: "", message: { type: "gameover" }, debug: true, weight: "normal" }));
					io.nsps['/'].to(socket.user.roomId).emit('update_game', room.game);
				}
			}
		}
	});
	// announce UNO!
	socket.on("say_uno", function(source) {
		let room = io.nsps['/'].adapter.rooms[socket.user.roomId];
		if (room != undefined && source == room.game.round.turn && room.game.round.hasPlayed) {
			if (!room.game.players[room.game.round.turn].hasUNO && room.game.players[room.game.round.turn].hand.length == 1) {
				room.game.players[room.game.round.turn].hasUNO = true;
				io.nsps['/'].to(socket.user.roomId).emit('message', JSON.stringify({ username: "", message: { type: "uno", source: socket.user.name }, debug: true, weight: "normal" }));
			} else {
				room.game.round.drawPenalties(source);
				room.game.round.endTurn();
			}
			socket.emit('said_uno', true);
			io.nsps['/'].to(socket.user.roomId).emit('update_game', room.game);
		}
    });
	// contest an UNO
	socket.on("contest_uno", function(source, target) {
		let room = io.nsps['/'].adapter.rooms[socket.user.roomId];
		if (room != undefined && !room.game.round.hasPlayed) {
			if (room.game.players[target].hand.length == 1 && !room.game.players[target].hasUNO) {
				room.game.round.drawPenalties(target);
				io.nsps['/'].to(socket.user.roomId).emit('message', JSON.stringify({ username: "", message: { type: "contest", status: "Win" , source: socket.user.name, target: room.game.players[target].name }, debug: true, weight: "normal" }));
				if (target == room.game.round.turn && room.game.round.drawCount == 0)
					room.game.round.endTurn();
			} else {
				room.game.round.drawPenalties(source);
				io.nsps['/'].to(socket.user.roomId).emit('message', JSON.stringify({ username: "", message: { type: "contest", status: "Lose" , source: socket.user.name, target: room.game.players[target].name }, debug: true, weight: "normal" }));
				if (source == room.game.round.turn && room.game.round.drawCount == 0)
					room.game.round.endTurn();
			}
			socket.emit('contested_uno', true);
			io.nsps['/'].to(socket.user.roomId).emit('update_game', room.game);
		}
    });
	// close the end modal
	socket.on("end_modal", function(bool) {
		io.nsps['/'].to(socket.user.roomId).emit('end_modal', bool);
    });
	// leaving a room
	socket.on("disconnect", function(data) {
		if (socket.user != undefined && socket.user.roomId != null){
			// log(socket.user.name + " has left \"" + socket.user.roomId + "\"");
			// if (io.nsps['/'].adapter.rooms[socket.user.roomId] == undefined)
				// log("Room \"" + socket.user.roomId + "\" has been deleted");
			io.nsps['/'].to(socket.user.roomId).emit('get_users', getUsers(socket.user.roomId));
		}
	});
	// get usernames
	function getUsers(roomId){
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
			getUsers(socket.user.roomId).forEach((user, i) => {
				if (user._id === socket.user._id)
					errors.push({ message: user.name + ' is already connected in this room.' });
			});
			if (socket.game != undefined){
				let i = 0;
				while (i < socket.game.players.length) {
					if (socket.game.players[i]._id === socket.user._id)
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
