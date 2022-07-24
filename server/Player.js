/**
 * Player model
 * @author Dastan21
 */


class Player {
	constructor(_id, name){
		this._id = _id
		this.name = name
		this.hand = []
		this.score = 0
		this.hasUNO = false
		this.isWinner = false
	}

	// get his hand
	takeCard(card){ this.hand.push(card) }
}

module.exports = Player
