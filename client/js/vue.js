/**
 * Vue client-side
 * @author Dastan21
 */

/* Socket */
const socket = io()

/* Index vue */
new Vue({
	el: "#uno",
	data: {
		username: '',
		show: 'room-create',
		showInput: 'create',
		user: {
			_id: '',
			name: '',
			roomId: ''
		},
		users: [],
		draggingCard: null,
		colors: colors,
		options: options,
		gamemode: "quick",
		maxRound: 3,
		maxScore: 500,
		rulesList: {},
		// rules: null,
		game: null,
		saidUno: false,
		contestedUno: false,
		end_modal: false,
		changelogs_modal: false,
		changelogs: changelogs,
		language: 'english',
		translate: language
	},
	created() {
		/* Index client */
		socket.on('get_users', (users) => {
			if (this.show === 'room-play')
				this.show = 'game-waiting'
			if (this.isLeader) {
				let gamemode = {
					name: this.gamemode,
					rounds: this.maxRound,
					scores: this.maxScore
				}
				socket.emit('game_options', gamemode, this.rulesList)
			}
			let user = this.arrayCompare(this.users, users, '_id')
			if (this.game != null) {
				if (this.users.length > users.length)
					this.$refs.chatComponent.chat.push({ username: user.name, message: " " + this.translate[this.language].room_disconnect, debug: true, weight: "normal" })
				else
					this.$refs.chatComponent.chat.push({ username: user.name, message: " " + this.translate[this.language].room_reconnect, debug: true, weight: "normal" })
			}
			this.users = users
		})

		socket.on('start_game', (game, rulesList) => {
			// this.rules = new Rules(rulesList)
			this.game = game
			this.show = 'game-playing'
		})

		socket.on('game_options', (gamemode, rulesList) => {
			this.gamemode = gamemode.name
			this.maxRound = gamemode.rounds
			this.maxScore = gamemode.scores
			this.rulesList = rulesList
		})

		socket.on('update_game', (game) => {
			this.game = game
			if (game.end)
				this.show = 'game-end'
		})

		socket.on('said_uno', (bool) => {
			this.saidUno = bool
		})

		socket.on('contested_uno', (bool) => {
			this.contestedUno = bool
		})

		socket.on('end_modal', (bool) => {
			this.end_modal = bool
			this.show = 'game-waiting'
		})

		socket.on('failure', (errors) => {
			if (errors != null) {
				errors.forEach(error => {
					alert(error.message)
					window.location = window.location.origin + "/"
				})
			}
		})
	},
	watch: {
		show: function() {
			if (this.show === 'room-play')
				this.showInput = 'join'
			else
				this.showInput = 'create'
		},
		rulesList: {
			handler() {
				this.updateOptions()
			},
			deep: true
		},
		gamemode: function() { this.updateOptions() }, maxRound: function() { this.updateOptions() },
		"game.end": function(isGameover) {
			if (isGameover)
				this.end_modal = true
		},
		language: function(newValue) {
			this.setCookie("language", newValue)
		}
	},
	computed: {
		isLeader: function() {
			return this.indexOf(this.users, this.user, '_id') == 0
		},
		roomURL: function() {
			return window.location.origin + "/?" + this.user.roomId
		}
	},
	methods: {
		setUsername() { this.setCookie("username", this.username) },
		getUsername() {
			let name = this.username
			if (name === '')
				name = defaultUsernames[Math.floor(Math.random() * defaultUsernames.length)]
			return name
		},
		setCookie(name, value) { document.cookie = name+"="+encodeURIComponent(value) },
		getCookie(name) {
			var cookieArr = document.cookie.split("; ")

			var cookiePair = ""
			for (let i = 0; i < cookieArr.length; i++) {
				cookiePair = cookieArr[i].split("=")
				if (cookiePair[0] === name)
					return decodeURIComponent(cookiePair[1])
			}
			return null
		},
		indexOf(array, obj, key) {
			for (let i = 0; i < array.length; i++) {
				if (array[i][key] === obj[key]) return i
			}
			return -1
		},
		chooseUsername() {
			if (this.show === 'room-create')
				this.createRoom()
			else
				this.joinRoom()
		},
		createRoom() {
			this.setUsername()
			this.user.roomId = Math.random().toString(36).slice(2,15)
			this.user.name = this.getUsername()
			this.users.push(this.user)
			socket.emit('create_room', this.user)
			this.users = [ this.user ]
			this.show = 'game-waiting'
			if (history.pushState) {
				window.history.pushState(null, "title", "/?" + this.user.roomId)
			} else {
				window.history.replaceState(null, "title", "/?" + this.user.roomId)
			}
		},
		joinRoom() {
			this.setUsername()
			this.user.name = this.getUsername()
			socket.emit('join_room', this.user)
		},
		updateOptions() {
			if (this.isLeader) {
				let gamemode = {
					name: this.gamemode,
					rounds: this.maxRound,
					scores: this.maxScore
				}
				socket.emit('game_options', gamemode, this.rulesList)
			}
		},
		startGame() {
			let gamemode = {
				name: this.gamemode,
				rounds: this.maxRound,
				scores: this.maxScore
			}
			socket.emit('start_game', gamemode, this.rulesList)
		},
		arrayCompare(oldArray, newArray, key) {
			let i = 0
			if (oldArray.length == newArray.length)
				return null
			while (i < oldArray.length && i < newArray.length && oldArray[i][key] == newArray[i][key]) {
				i++
			}
			if (oldArray.length > newArray.length)
				return oldArray[i]
			return newArray[i]
		},
		/* Playing datas */
		canEndTurn() {
			return (this.game.round.hasPlayed || this.game.round.drawed > 0) && this.playerTurn() && !this.game.round.choosing
		},
		play(card, indexPlayer) {
			if (!this.game.end && this.cardPlayable(card, indexPlayer))
				socket.emit('update_game', { type: 'play', card: card })
		},
		cardPlayable(card, indexPlayer) {
			return this.playerTurn() && card.playable
			// return !this.game.end && this.rules.canPlay(card, this.game.round.deck.discardtop, this.game.round.hasPlayed, this.game.round.drawCount, this.game.round.drawed, this.game.players[this.game.round.turn].hand, this.game.round.choosing) && indexPlayer == this.game.round.turn && this.playerTurn()
		},
		playerTurn() {
			return this.game.players[this.game.round.turn]._id == this.user._id
		},
		canDraw() {
			return this.playerTurn() && !this.game.round.hasPlayed
			// return !this.game.end && this.playerTurn() && this.rules.canDraw(this.game.round.hasPlayed, this.game.round.drawed, this.game.round.choosing)
		},
		drawCards() {
			// this.rules.canDraw(this.game.round.hasPlayed, this.game.round.drawed, this.game.round.choosing)
			if (!this.game.end && this.canDraw())
				socket.emit('update_game', { type: 'draw-card' })
		},
		choosing() {
			return this.game.round.choosing && this.playerTurn()
		},
		choose(what, thing) {
			socket.emit('update_game', { type: 'choose', what: what, thing: thing })
		},
		endTurn() {
			socket.emit('update_game', { type: 'end-turn' })
		},
		/* CSS datas */
		getTableData(indexPlayer) {
			return {
				a: -90 + 360.0 / this.game.players.length * (indexPlayer - this.indexOf(this.game.players, this.user, '_id')),
				dx: -32
			}
		},
		getCardImgData(player, card) {
			let data = {
				src: 'img/cards/back.svg',
				alt: 'UNO Card'
			}
			if (player._id == this.user._id) {
				data.src = 'img/cards/'+card.type+'_'+card.color+'_'+card.value+'.svg'
				data.alt = card.type+' - '+card.value+' - '+card.color
			}
			return data
		},
		getCardPosData(n, i, p) {
			let data = {
				dx: 0,
				dy: 0,
				a: 0
			}
			let angle = 48.0/26.0*(0.5*n-1)+12
			if (angle > 50) angle = 50
			if (this.game.players[p]._id != this.user._id) angle = 12
			angle = Math.PI*angle/180.0
			let h = 2000
			data.a = -angle/2+angle/(n+1)*(i+1)
			data.dx = h*Math.sin(0.5*data.a)
			data.dy = -h*(Math.cos(0.5*data.a)-1)
			return data
		},
		canSayUno() {
			return !this.game.end && !this.choosing() && this.playerTurn() && this.canEndTurn() && !this.saidUno
		},
		sayUno() {
			socket.emit('say_uno', this.indexOf(this.users, this.user, '_id'))
		},
		canContestUno() {
			return !this.game.end && !this.choosing() && !this.contestedUno && !this.game.round.hasPlayed
		},
		contestUno(indexPlayer) {
			socket.emit('contest_uno', this.indexOf(this.users, this.user, '_id'), indexPlayer)
		},
		dragStart(card, indexPlayer) {
			if (this.cardPlayable(card, indexPlayer))
				this.draggingCard = card
		},
		dragEnd() {
			this.draggingCard = null
		},
		drop() {
			if (this.draggingCard != null)
				this.play(this.draggingCard)
		}
	},
	mounted() {
		let language = this.getCookie("language")
		if (language == null) this.setCookie("language", this.language)
		else this.language = language
		this.user._id = this.getCookie("_id")
		if (this.user._id == null) {
			const userId = Math.random().toString(36).slice(2,15)
			this.user._id = userId
			this.setCookie("_id", userId)
		}
		this.username = this.getCookie("username")
		if (this.username == null) this.username = ''
		this.user.roomId = window.location.search.slice(1)
		if (this.user.roomId != '') this.show = 'room-play'
	}
})


Vue.component("scoreboard", {
	props: [ 'game', 'show', 'language', 'translate' ],
	template: `
	<div>
		<h1>{{translate[language].scoreboard_title}}</h1>
		<div class="scoreboard-box">
			<ul class="scoreboard-list" v-if="show === 'game-playing' || show === 'game-end'">
				<li v-for="player in game.players">{{player.name}} | {{player.score}}</li>
			</ul>
		</div>
	</div>
	`,
	methods: {
	}
})


Vue.component("chat", {
	data: function() {
		return {
			chat: [],
			message: ''
		}
	},
	props: [ 'user', 'language', 'translate' ],
	template: `
	<div>
		<h1>{{translate[language].chat_title}}</h1>
		<div class="messages" ref="autoscroll_chat">
			<ul class="unordered-list">
				<li class="list" :class="{ debug: msg.debug }" v-for="msg in chat"><span :style="{ fontWeight: msg.weight }">{{msg.username}}</span>{{msg.message}}</li>
			</ul>
		</div>
		<form class="chat-form" @submit.prevent="sendMessage()"><input class="chat-input" type="text" :placeholder="translate[language].chat_placeholder" v-model="message"></input><input class="button chat-button" type="submit" :value="translate[language].chat_send"></input></form>
	</div>
	`,
	created() {
		socket.on('message', (msg) => {
			msg = JSON.parse(msg)
			let message = {
				username: msg.username,
				message: msg.message,
				debug: msg.debug,
				weight: msg.weight
			}
			if (message.debug) {
				if (message.message.type === "contest") {
					if (message.message.status === "Win")
						message.message = message.message.source + " " + this.translate[this.language].message_contestContests + " " + message.message.target + "... " + this.translate[this.language].message_contestAnd + " " + message.message.source + " " + this.translate[this.language].message_contestWin
					else if (message.message.status === "Lose")
						message.message = message.message.source + " " + this.translate[this.language].message_contestContests + " " + message.message.target + "... " + this.translate[this.language].message_contestBut + " " + message.message.source + " " + this.translate[this.language].message_contestLose
				} else if (message.message.type === "uno")
					message.message = message.message.source + " " + this.translate[this.language]['message_'+message.message.type]
				else
					message.message = this.translate[this.language]['message_'+message.message.type]
			}
			this.chat.push(message)
		})
	},
	watch: {
		chat: function() {
			this.$refs.autoscroll_chat.scrollBy({
				top: this.$refs.autoscroll_chat.scrollHeight,
				left: 0,
				behavior: 'smooth'
			})
		}
	},
	methods: {
		sendMessage() {
			if (this.message != '') {
				let msg = {
					username: "<"+this.user.name+"> ",
					message: this.message,
					debug: false,
					weight: "normal"
				}
				socket.emit('message', JSON.stringify(msg))
				msg.weight = "bold"
				this.chat.push(msg)
			}
			this.message = ''
		}
	}
})


Vue.component("endgame", {
	props: [ 'show', 'players', 'isLeader', 'language', 'translate' ],
	template: `
	<div class="modal-background">
		<div class="modal-content">
			<p>{{winner}} {{translate[language].endgame_winMessage}}</p>
			<div class="scoreboard-box">
				<ul class="scoreboard-list" v-if="show === 'game-playing' || show === 'game-end'">
					<li v-for="player in players">{{player.name}} | {{player.score}}</li>
				</ul>
			</div>
			<button class="button" @click="playAgain()" :disabled="!isLeader">{{translate[language].endgame_playAgain}}</button>
		</div>
	</div>
	`,
	computed: {
		winner: function() {
			let winner = 'No one'
			Array.from(this.players).forEach(player => {
				if (player.isWinner)
					winner = player.name
			})
			return winner
		}
	},
	methods: {
		playAgain() {
			this.$emit('update:show', 'game-waiting')
			socket.emit('end_modal', false)
		}
	}
})


Vue.component("changelogs", {
	props: [ 'changelogs_modal', 'changelogs', 'language', 'translate' ],
	template: `
	<div class="modal-background">
		<div class="modal-content changelogs">
		<span class="modal-close" @click="$emit('update:changelogs_modal', false)">&times</span>
			<h2 class="changelogs-title">{{translate[language].changelogs_title}}</h2>
			<div v-for="(changelog, i) in changelogs">
				<h2>v{{changelog.version}} <span class="changelogs-version-date">({{changelog.date[language]}})</span></h2>
				<span class="logs-title">{{changelog.logs.title[language]}}</span>
				<h3 v-if="changelog.logs.features[language].length > 0">{{translate[language].changelogs_feature}}</h3>
				<ul class="changelogs-list">
					<li class="log-element" v-for="log in changelog.logs.features[language]">{{log}}</li>
				</ul>
				<h3 v-if="changelog.logs.bugs[language].length > 0">{{translate[language].changelogs_bugs}}</h3>
				<ul class="changelogs-list">
					<li class="log-element" v-for="log in changelog.logs.bugs[language]">{{log}}</li>
				</ul>
				<hr v-if="i < changelogs.length-1">
			</div>
		</div>
	</div>
	`
})
