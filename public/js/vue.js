/* Index vue */
var defaultUsernames = ["Adrien","Albin","Alexandrin","Ancelin","Antonin","Aubin","Augustin","Baptistin","Benjamin","Cassien","Celestin","Cesarin","Colin","Corentin","Constantin","Crispin","Fabien","Faustin","Firmin","Florentin","Gabin","Honorin","Hugolin","Jasmin","Josquin","Julien","Justin","Leontin","Lubin","Lucien","Marcellin","Marin","Martin","Mathurin","Maximin","Merlin","Paulin","Quentin","Robin","Saturnin","Seraphin","Severin","Valentin","Zephyrin"];

var app = new Vue({
	el: "#game",
	data: {
		username: '',
		show: 'create',
		selectedCursor: 'auto',
		user: {
			_id: '',
			name: '',
			roomId: ''
		},
		users: [],
		isMaster: false,
		colors: colors,
		game: null
	},
	watch: {
		game: function() {
			if (this.game != null)
				this.show = 'playing';
		},
		"users.length": function() {
			this.isMaster = this.indexOf(this.users, this.user, '_id') == 0;
			this.selectedCursor = !this.isMaster || this.users.length < 2 ? 'not-allowed' : 'auto';
		}
	},
	computed: {
		roomURL: function() {
			return window.location.origin + "/uno/?" + this.user.roomId;
		},
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
