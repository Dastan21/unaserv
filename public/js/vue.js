const server = io("http://ldgr.fr", {
	path:'/uno/socket.io',
	reconnection: true,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,
	reconnectionAttempts: 99999
});
// const server = io();

/* Index vue */
var vue = new Vue({
	el: "#uno",
	data: {
		username: '',
		show: 'create',
		showInput: 'Create room',
		user: {
			_id: '',
			name: '',
			roomId: ''
		},
		users: [],
		isMaster: false,
		colors: colors,
		game: null,
		message: '',
		chat: []
	},
	created() {
		/* Index client */
		server.on('message', (msg) => {
			this.chat.push(JSON.parse(msg));
		});

		server.on('get_names', (users) => {
			let user = this.arrayCompare(this.users, users, '_id');
			if (this.game != null) {
				if (this.users.length > users.length)
					this.chat.push({ username: user.name, message: " has disconnected", debug: true, weight: "normal" });
				else
					this.chat.push({ username: user.name, message: " has reconnected", debug: true, weight: "normal" });
			}
			this.users = users;
		});

		server.on('update_game', (game) => {
			if (game == null) {
				if (this.isMaster) {
					server.emit('update_game', this.game);
				}
			} else {
				if (this.game == null) {
					var players = [];
					this.users.forEach(user => {
						players.push(new Player(user._id, user.name));
					});
					this.game = new Game(this.user.roomId, players)
				}
				this.updateGame(game);
			}
		});

		server.on('failure', (errors) => {
			if (errors != null) {
				errors.forEach(error => {
					alert(error.message);
					window.location = window.location.origin + "/uno/";
				});
			} else {
				this.show = 'waiting';
			}
		});
	},
	watch: {
		show: function() {
			if (this.show == 'play')
				this.showInput = 'Play';
			else
				this.showInput = 'Create room';
		},
		game: function() {
			if (this.game != null)
				this.show = 'playing';
		},
		"users.length": function() {
			this.isMaster = this.indexOf(this.users, this.user, '_id') == 0;
		}
	},
	computed: {
		roomURL: function() {
			return window.location.origin + "/uno/?" + this.user.roomId;
		}
	},
	methods: {
		setUsername() { this.setCookie("username", this.username); },
		getUsername() {
			let name = this.username;
			if (name == '')
				name = defaultUsernames[Math.floor(Math.random() * defaultUsernames.length)];
			return name;
		},
		setCookie(name, value) { document.cookie = name+"="+encodeURIComponent(value); },
		getCookie(name) {
			var cookieArr = document.cookie.split("; ");

			var cookiePair = "";
			for (let i = 0; i < cookieArr.length; i++) {
				cookiePair = cookieArr[i].split("=");
				if (cookiePair[0] == name)
					return decodeURIComponent(cookiePair[1]);
			}
			return null;
		},
		indexOf(array, obj, key) {
			for (let i = 0; i < array.length; i++) {
				if (array[i][key] == obj[key]) return i;
			}
			return -1;
		},
		chooseUsername() {
			if (this.show == 'create')
				this.createRoom();
			else
				this.joinRoom();
		},
		createRoom() {
			this.setUsername();
			this.user.roomId = Math.random().toString(36).slice(2,15);
			this.user.name = this.getUsername();
			this.users.push(this.user);
			server.emit('create_room', this.user);
			this.users = [ this.user ];
			this.show = 'waiting';
		},
		joinRoom() {
			this.setUsername();
			this.user.name = this.getUsername();
			server.emit('join_room', this.user);
			server.emit('update_game', this.game);
		},
		startGame() {
			let players = [];
			this.users.forEach(user => {
				players.push(new Player(user._id, user.name));
			});
			this.game = new Game(this.user.roomId, players);
			this.shareGame();
		},
		updateGame(game) {
			for (var keyGame in game) {
				if (game.hasOwnProperty(keyGame)) {
					if (keyGame == "players") {
						this.game.players.forEach((player, i) => {
							for (var keyPlayer in player) {
								if (player.hasOwnProperty(keyPlayer)) {
									player[keyPlayer] = game.players[i][keyPlayer];
								}
							}
						});
					} else if (keyGame == "round") {
						for (var keyRound in game.round) {
							if (game.round.hasOwnProperty(keyRound)) {
								if (keyRound == "deck") {
									for (var keyDeck in game.round.deck) {
										if (game.round.deck.hasOwnProperty(keyDeck)) {
											this.game.round.deck[keyDeck] = game.round.deck[keyDeck];
										}
									}
								} else if (keyRound == "players") {
									this.game.round.players = this.game.players;
								} else
									this.game.round[keyRound] = game.round[keyRound];
							}
						}
					} else {
						this.game[keyGame] = game[keyGame];
					}
				}
			}
		},
		shareGame() {
			server.emit('update_game', this.game);
		},
		arrayCompare(oldArray, newArray, key) {
			let i = 0;
			if (oldArray.length == newArray.length)
				return null;
			while (i < oldArray.length && i < newArray.length && oldArray[i][key] == newArray[i][key]) {
				i++;
			}
			if (oldArray.length > newArray.length)
				return oldArray[i]
			return newArray[i];
		},
		sendMessage() {
			if (this.message != '') {
				let msg = {
					username: "<"+this.user.name+"> ",
					message: this.message,
					debug: false,
					weight: "normal"
				}
				server.emit('message', JSON.stringify(msg));
				msg.weight = "bold"
				this.chat.push(msg);
			}
			this.message = '';
		},
		isPlayable(card, i) {
			return this.game.round.allowedCard(card) && this.game.round.turn == this.indexOf(this.game.players, this.user, '_id') && this.game.round.turn == i;
		},
		cardData(player, card) {
			let data = {
				src: 'img/cards/back.png',
				alt: 'UNO Card'
			};
			if (player._id == this.user._id) {
				data.src = 'img/cards/'+card.type+'_'+card.color+'_'+card.value+'.png';
				data.alt = card.type+' - '+card.value+' - '+card.color;
			}
			return data;
		},
		altCard(player) {
			if (player._id == this.user._id)
				return 'img/cards/'+card.type+'_'+card.color+'_'+card.value+'.png';
			return 'img/cards/back.png';
		},
		drawCards() {
			if (!this.game.round.switchcolor && this.game.players[this.game.round.turn]._id == this.user._id) {
				if (this.game.round.drawtwo > 0)
					this.game.round.drawTwoCards();
				else {
					this.game.round.drawCard();
					this.game.round.drawed = true;
				}
				this.shareGame();
			}
		},
		getCardDatas(n, i, p) {
			let data = {
				dx: 0,
				dy: 0,
				a: 0
			};
			let angle = 48.0/26.0*(0.5*n-1)+12;
			if (angle > 50) angle = 50;
			// console.log(this.game.players[i]);
			if (this.game.players[p]._id != this.user._id) angle = 12;
			angle = Math.PI*angle/180.0;
			let h = 2000;
			data.a = -angle/2+angle/(n+1)*(i+1);
			data.dx = h*Math.sin(0.5*data.a);
			data.dy = -h*(Math.cos(0.5*data.a)-1);
			return data;
		}
	},
	mounted() {
		this.user._id = this.getCookie("_id");
		if (this.user._id == undefined) this.setCookie("_id", Math.random().toString(36).slice(2,15));
		this.username = this.getCookie("username");
		if (this.username == null) this.username = '';
		this.user.roomId = window.location.search.slice(1);
		if (this.user.roomId != '') this.show = 'play';
		// history.pushState('', '', window.location.origin + "/?coucou");
	}
});
