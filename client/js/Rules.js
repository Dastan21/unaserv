/**
 * Rules model
 * @author Dastan21
 */


class Rules {
	constructor(rules) {
		this.rules = rules;
	}

	// check if can play depending on the rules
	canPlay(card, cardTop, hasPlayed, drawCount, drawed, hand, choosing) {
		return this.normal(card, cardTop, hasPlayed, drawCount, drawed, hand, choosing) || this.progressiveUno(card, cardTop, hasPlayed, hand, choosing);
	}

	// check if can draw card(s)
	canDraw(hasPlayed, drawed, choosing) {
		return !hasPlayed && !choosing && this.stackingDraw(drawed);
	}

	// standard rules
	normal(card, cardTop, hasPlayed, drawCount, drawed, hand, choosing) {
		return ((card.value == cardTop.value && card.value < 10) ||
			(card.color == cardTop.color) ||
			(card.type == cardTop.type && card.type !== "normal" && card.type !== "wild-draw-four") ||
			(card.type === "wild-draw-four" && !this.hasColor(cardTop.color, hand)) ||
			(card.type === "wild")) &&
			!hasPlayed && !choosing && drawCount == 0 &&
			this.drawedCard(card, hand, drawed);
	}

	// check if the player has drawed
	drawedCard(card, hand, drawed) {
		return drawed == 0 || drawed > 0 && this.equals(card, hand[hand.length-1]);
	}

	equals(card, cardInHand) {
		return card.value == cardInHand.value && card.color === cardInHand.color && card.type === cardInHand.type;
	}

	// check if a card color is in a hand
	hasColor(color, hand) {
		for (let i = 0; i < hand.length; i++) {
			if (hand[i].color === color)
				return true;
		}
		return false;
	}

	/* Variants rules */
	twoPlayer(card) {
		if (this.rules['two-player']) return true; // temp
		return false;
	}

	stackingDraw(drawed) {
		return drawed == 0 && !this.rules["stacking-draw"] ||
			drawed < 3 && this.rules["stacking-draw"];
	}

	progressiveUno(card, cardTop, hasPlayed, hand, choosing) {
		return this.rules["progressive-uno"] && !hasPlayed && !choosing &&
			((card.type === 'draw-two' && cardTop.type === 'draw-two') ||
			(card.type === 'wild-draw-four' && cardTop.type === 'wild-draw-four' && !this.hasColor(cardTop.color, hand)));
	}

	sevenO(card) {
		if (this.rules['seven-o']) return true; // temp
		return false;
	}

	jumpIn(card) {
		if (this.rules['jump-in']) return true; // temp
		return false;
	}

	row(card) {
		if (this.rules['row']) return true; // temp
		return false;
	}

	timeLimit(card) {
		if (this.rules['time-limit']) return true; // temp
		return false;
	}
}
