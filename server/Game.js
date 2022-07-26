/**
 * Game model
 * @author Dastan21
 */


const Player = require('./Player')
const Round = require('./Round')
const Rules = require('./Rules')

class Game {
	constructor(_id, players, gamemode, rules) {
		this._id = _id
		this.players = players
		this.gamemode = gamemode.name
		this.rules = new Rules(rules)
		this.round = new Round(this.players, this.rules)
		this.maxRound = gamemode.rounds
		this.maxScore = gamemode.scores
		this.end = false
	}

	checkState() {
		for (var p = 0; p < this.players.length; p++) {
			this.players[p].isWinner = this.players[p].hand.length == 0 ? true : false
			if (this.players[p].isWinner){
				this.round.applyEffects()
				this.addScore(this.players[p])
				Array.from(this.players).forEach(player => {
					if (player.score >= this.maxRound)
						this.end = true
				})
				if (!this.end) {
					let turnCounter = 0
					Array.from(this.players).forEach(player => {
						player.hand = []
						player.hasUNO = false
						player.isWinner = false
						turnCounter += player.score
					})
					this.round = new Round(this.players, this.rules)
					for (var i = 0; i < turnCounter; i++)
						this.round.addTurn()
				}
				break
			}
		}
	}

	// add the score to the winner
	addScore(winner){
		Array.from(this.players).forEach(player => {
			Array.from(player.hand).forEach(card => {
				if (this.gamemode === 'score')
					winner += card.value
				else if (this.gamemode === 'reverse-score')
					player.score += card.value
			})
		})
		winner.score++
	}
}

module.exports = Game
