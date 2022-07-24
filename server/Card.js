/**
 * Card model
 * @author Dastan21
 */


class Card {
	constructor(value, color, type){
		this.value = value
		this.color = color
		this.type = type
		this.playable = false
	}

	// check if a card is the card given in parameters
	equals(card) {
		return card.value == this.value && card.color === this.color && card.type === this.type
	}
}

module.exports = Card
