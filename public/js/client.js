/* Index client */
const server = io("http://ldgr.fr", {
	path:'/uno/socket.io',
	reconnection: true,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,
	reconnectionAttempts: 99999
});

server.on('get_names', function(users){
	let user = app.arrayCompare(app.users, users, '_id');
	if (app.game != null) {
		if (app.users.length > users.length)
			alert(user.name + " has disconnected");
		else
			alert(user.name + " has reconnected");
	}
	app.users = users;
});

server.on('update_game', function(game){
	if (game == null) {
		if (app.isMaster) {
			server.emit('update_game', app.game);
		}
	} else {
		if (app.game == null) {
			var players = [];
			app.users.forEach(user => {
				players.push(new Player(user._id, user.name));
			});
			app.game = new Game(app.user.roomId, players)
		}
		app.updateGame(game);
	}
});

server.on('failure', function(errors){
	if (errors != null) {
		errors.forEach(error => {
			alert(error.message);
			window.location = window.location.origin+"/uno";
		});
	} else {
		app.show = 'waiting';
	}
});
