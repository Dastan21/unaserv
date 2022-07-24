/**
 * Deck model
 * @author Dastan21
 */

const colors = [ "red", "green", "yellow", "blue" ]
const types = [ "normal", "reverse", "skip", "draw-two", "wild", "wild-draw-four" ]
const Card = require('./Card')

class Deck {
	constructor() {
		// create the cards
		this.cards = []
		this.discardpile = []
		this.discardtop = null
		colors.forEach(color => {
			this.cards.push(new Card(0, color, "normal"))
			for (let i = 0; i < 2; i++) {
				for (let j = 1; j < 10; j++)
					this.cards.push(new Card(j, color, "normal"))
				for (let j = 1; j < 4; j++)
					this.cards.push(new Card(20, color, types[j]))
			}
			for (let i = 4; i < 6; i++)
				this.cards.push(new Card(50, "black", types[i]))
		})
		this.shuffle(this.cards)
	}

	// shuffle the deck
	shuffle(cards) {
		var j, x
		for (let i = cards.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1))
			x = cards[i]
			cards[i] = cards[j]
			cards[j] = x
		}
	}

	// pick card from deck
	pickCard() { return this.cards.splice(0,1)[0] }

	isColor(color) {
		let bool = false
		colors.forEach((c, i) => {
			if (c == color) {
				bool = true
				return
			}
		})
		return bool
	}

	renewDiscardPile() {
		if (this.cards.length == 0) {
			this.shuffle(this.discardpile)
			this.cards = this.discardpile
			this.discardpile = []
		}
	}
}

module.exports = Deck
