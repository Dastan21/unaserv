/**
 * Round model for client side
 * @author Dastan21
 */


const Deck = require('./Deck');
const Player = require('./Player');
const Rules = require('./Rules');

class Round {
	constructor(players, rules){
		this.deck = new Deck();
		this.players = players;
		this.rules = rules;
		this.turn = 0;
		this.order = 1;
		this.drawCount = 0;
		this.choosing = false;
		this.drawed = 0;
		this.skip = 0;
		this.hasPlayed = false;
		this.dealingCards();
	}

	// deal 7 cards for each player
	dealingCards(){
		this.players.forEach(player => {
			for (var i = 0; i < 7; i++)
				player.takeCard(this.deck.pickCard());
		});
		let firstcard = this.deck.pickCard();
		while (firstcard.type === "wild-draw-four"){
			this.deck.cards.push(firstcard);
			this.deck.shuffle(this.deck.cards);
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
			case "draw-two":
				this.drawCount += 2;
				break;
			case "wild":
				this.choosing = true;
		}
	}

	// play a card
	play(card){
		card = this.getCardInHand(card);
		if (card == null) return;
		if (this.drawed > 0 && this.hasPlayed) {
			this.endTurn();
			return;
		}
		if (this.rules.canPlay(card, this.deck.discardtop, this.hasPlayed, this.drawCount, this.drawed, this.players[this.turn].hand, this.choosing)){
			this.players[this.turn].hand.splice(this.players[this.turn].hand.indexOf(card),1);
			this.deck.discardpile.push(this.deck.discardtop);
			if (this.deck.discardtop.type.includes("wild"))
				this.deck.discardtop.color = "black";
			this.deck.discardtop = card;
			this.deck.renewDiscardPile();
			switch(card.type){
				case "skip":
					this.skip++;
					break;
				case "reverse":
					if (this.players.length == 2)
						this.skip++;
					else
						this.order *= -1;
					break;
				case "draw-two":
					this.drawCount += 2;
					break;
				case "wild":
					this.choosing = true;
					break;
				case "wild-draw-four":
					this.choosing = true;
					this.drawCount += 4;
			}
			this.hasPlayed = true;
		}
		this.updateCards();
	}

	// verify if the card exists in the hand
	getCardInHand(cardIn) {
		let cardOut = null;
		Array.from(this.players[this.turn].hand).forEach((card, i) => {
			if (card.equals(cardIn)) {
				cardOut = card;
				return;
			}
		});
		return cardOut;
	}

	// add a turn to the round
	addTurn(){ this.turn = (this.turn + this.players.length + this.order) % this.players.length; }

	// end the current turn of the round
	endTurn() {
		for (var i = 0; i < this.skip+1; i++)
			this.addTurn();
		this.drawed = 0;
		this.skip = 0;
		this.hasPlayed = false;
		this.updateCards();
	}

	// draw card from the deck
	drawCard(){ this.players[this.turn].takeCard(this.deck.pickCard()); }

	// draw some cards from the deck
	drawCards(){
		if (this.rules.canDraw(this.hasPlayed, this.drawed, this.choosing)) {
			let drawCount = this.drawCount == 0 ? 1 : this.drawCount;
			for (var i = 0; i < drawCount; i++) {
				this.drawCard();
				this.deck.renewDiscardPile();
				this.drawed++;
			}
			if (drawCount > 1) {
				this.drawCount = 0;
				this.endTurn();
			}
			this.updateCards();
			this.players[this.turn].hasUNO = false;
		}
	}

	drawPenalties(indexPlayer){
		for (var i = 0; i < 2; i++) {
			this.players[indexPlayer].takeCard(this.deck.pickCard());
			this.deck.renewDiscardPile();
		}
	}

	// choose something
	choose(what, thing) {
		switch (what) {
			case 'color':
				if (this.deck.isColor(thing))
					this.chooseColor(thing);
				break;
			case 'hand':
				// do smth
				break;
		}
		this.updateCards();
	}

	// choose the color of the wild card
	chooseColor(color){
		this.deck.discardtop.color = color;
		this.choosing = false;
		this.hasPlayed = true;
	}

	// set every cards in hands to playable or not
	updateCards() {
		this.players.forEach((player, i) => {
			player.hand.forEach(card => {
				if (i == this.turn && this.rules.canPlay(card, this.deck.discardtop, this.hasPlayed, this.drawCount, this.drawed, this.players[this.turn].hand, this.choosing))
					card.playable = true;
				else
					card.playable = false;
			});
		});
	}

	// apply the effect of the last card of the round
	applyEffects() {
		let cardTop = this.deck.discardtop;
		if (cardTop.type.includes("wild"))
			this.chooseColor("red");
		if (cardTop.type.includes("draw"))
			this.drawCards();
		if (this.hasPlayed)
			this.endTurn();
	}
}

module.exports = Round
