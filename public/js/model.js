/* Model.js */
// https://fr.wikipedia.org/wiki/Uno
// https://en.wikipedia.org/wiki/Uno_(card_game)

const colors = [ "red", "green", "yellow", "blue" ];
const types = [ "normal", "reverse", "skip", "draw-two", "wild", "wild-draw-four" ];
var defaultUsernames = ["Adrien","Albin","Alexandrin","Ancelin","Antonin","Aubin","Augustin","Baptistin","Benjamin","Cassien","Celestin","Cesarin","Colin","Corentin","Constantin","Crispin","Fabien","Faustin","Firmin","Florentin","Gabin","Honorin","Hugolin","Jasmin","Josquin","Julien","Justin","Leontin","Lubin","Lucien","Marcellin","Marin","Martin","Mathurin","Maximin","Merlin","Paulin","Quentin","Robin","Saturnin","Seraphin","Severin","Valentin","Zephyrin"];

class Card {
	constructor(value, color, type){
		this.value = value;
		this.color = color;
		this.type = type;
	}
}

class Deck {
	constructor(){
		// create the cards
		this.cards = [];
		this.discardpile = [];
		this.discardtop = null;
		colors.forEach(color => {
			this.cards.push(new Card(0, color, "normal"));
			for (let i = 0; i < 2; i++) {
				for (let j = 1; j < 10; j++)
					this.cards.push(new Card(j, color, "normal"));
				for (let j = 1; j < 4; j++)
					this.cards.push(new Card(20, color, types[j]));
			}
			for (let i = 4; i < 6; i++)
				this.cards.push(new Card(50, "black", types[i]));
		});
		this.shuffle();
	}

	// shuffle the deck
	shuffle(){
		var j, x;
		for (let i = this.cards.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = this.cards[i];
			this.cards[i] = this.cards[j];
			this.cards[j] = x;
		}
	}

	// pick card from deck
	pickCard(){ return this.cards.splice(0,1)[0]; }
}

class Player {
	constructor(_id, name){
		this._id = _id;
		this.name = name;
		this.hand = [];
	}

	// get his hand
	takeCard(card){ this.hand.push(card); }

	// test if the player has at least one card in his hand which has the color passed in parameter
	hasColor(color){
		for (let i = 0; i < this.hand.length; i++) {
			if (this.hand[i].color == color)
				return true;
		}
		return false;
	}

	static fromObject(obj) { return new Player(obj._id, obj.name); }
}

class Round {
	constructor(players){
		this.deck = new Deck();
		this.players = players;
		this.turn = 0;
		this.order = 1;
		this.drawtwo = 0;
		this.switchcolor = false;
		this.drawed = false;
		this.dealingCards();
	}

	// dealing 7 cards for each player
	dealingCards(){
		this.players.forEach(player => {
			for (var i = 0; i < 7; i++)
				player.takeCard(this.deck.pickCard());
		});
		let firstcard = this.deck.pickCard();
		while (firstcard.type == "wild draw four"){
			this.deck.cards.push(firstcard);
			this.deck.shuffle();
			firstcard = this.deck.pickCard();
		}
		this.deck.discardpile.push(firstcard);
		this.deck.discardtop = firstcard;
		switch(firstcard.type){
			case "skip":
				this.addTurn();
				break;
			case "reverse":
				this.order *= -1;
				break;
			case "draw two":
				this.drawtwo += 2;
				break;
			case "wild":
				this.switchcolor = true;
		}
	}

	// play the current player's card
	play(card){
		if (this.allowedCard(card)){
			this.drawed = false;
			this.players[this.turn].hand.splice(this.players[this.turn].hand.indexOf(card),1);
			this.deck.discardpile.push(card);
			if (this.deck.discardtop.type.startsWith("wild")) this.deck.discardtop.color = "black";
			this.deck.discardtop = this.deck.discardpile[this.deck.discardpile.length-1];
			switch(card.type){
				case "skip":
					this.addTurn();
					break;
				case "reverse":
					if (this.players.length == 2)
						this.addTurn();
					else
						this.order *= -1;
					break;
				case "draw two":
					this.drawtwo += 2;
					break;
				case "wild":
					this.switchcolor = true;
					break;
				case "wild draw four":
					this.switchcolor = true;
					this.drawtwo += 4;
			}
		} else
			return alert("You can't play this card !");
	}

	// test if the card can be played
	allowedCard(card){
		if ((card.type != "draw two" && card.type != "wild draw four" && this.drawtwo > 0) || (card.type == "draw two" && this.deck.discardtop.type == "wild draw four")) return false;
		if ((card.value == this.deck.discardtop.value && card.value < 10) ||
			(card.color == this.deck.discardtop.color) ||
			(card.type == this.deck.discardtop.type && card.type != "normal") ||
			(card.type == "wild draw four" && !this.players[this.turn].hasColor(this.deck.discardtop.color)) ||
			(card.type == "wild")) return true;
		return false;
	}

	addTurn(){ this.turn = (this.turn + this.players.length + this.order) % this.players.length; }

	// draw card from the deck
	drawCard(){ this.players[this.turn].takeCard(this.deck.pickCard()); }

	drawTwoCards(){
		for (var i = 0; i < this.drawtwo; i++)
			this.drawCard();
		this.drawtwo = 0;
		this.addTurn();
	}

	chooseColor(color){
		this.deck.discardtop.color = color;
		this.switchcolor = false;
		this.addTurn();
	}

	// check if a player has only 1 card left
	hasUno(){
		if (this.players[this.turn].hand.length == 1)
			return this.turn;
		return -1;
	}

	// check if a player has won the round
	hasWon(){
		if (this.players[this.turn].hand.length == 0)
			return this.turn;
		return -1;
	}
}

class Game {
	constructor(_id, players) {
		this._id = _id;
		this.players = players;
		this.round = new Round(this.players);
		this.scores = [];
		players.forEach(player => {
			this.scores.push(0);
		});
	}

	play(card){
		this.round.play(card);
		let uno = this.round.hasUno();
		let won = this.round.hasWon();
		if (uno > -1)
			alert("UNO !");
		if (won > -1){
			alert(this.round.players[won].name + " has won the round !");
			this.addScore(won);
			this.players.forEach(player => {
				player.hand = [];
			});
			this.round = new Round(this.players);
		} else if (!this.round.switchcolor)
			this.round.addTurn();
	}

	addScore(){
		this.round.players.forEach(player => {
			player.hand.forEach(card => {
				this.scores[this.round.turn] += card.value;
			});
		});
	}

	static fromObject(obj) { return new Game(obj._id, obj.players); }
}


/****** TESTING ******/
var testPlayers = [ new Player(null, "Honorin"), new Player(null, "Saturnin"), new Player(null, "Marcellin") ];
var testGame = new Game(null, testPlayers);
