/**
 * Data javascript file
 * @author Dastan21
 */


const colors = [ "red", "green", "yellow", "blue" ];

var defaultUsernames = ["Adrien","Albin","Alexandrin","Ancelin","Antonin","Aubin","Augustin","Baptistin","Benjamin","Cassien","Celestin","Cesarin","Colin","Corentin","Constantin","Crispin","Fabien","Faustin","Firmin","Florentin","Gabin","Honorin","Hugolin","Jasmin","Josquin","Julien","Justin","Leontin","Lubin","Lucien","Marcellin","Marin","Martin","Mathurin","Maximin","Merlin","Paulin","Quentin","Robin","Saturnin","Seraphin","Severin","Valentin","Zephyrin"];

const options = {
	gamemodes: {
		"quick": {
			english: {
				id: "quick",
				name: "Quick match",
				description: "UNA game with limited rounds. The player who has won the highest number of rounds win the game."
			},
			french: {
				id: "quick",
				name: "Match rapide",
				description: "Partie de UNA avec un nombre limité de manches. Le joueur ayant gagné le plus de manche remporte la partie."
			}
		},
		// "score": {
		// 	id: "score",
		// 	name: "Score",
		// 	description: "Score gamemode."
		// },
		// "reverse-score": {
		// 	id: "reverse-score",
		// 	name: "Reverse score",
		// 	description: "Reverse score gamemode."
		// },
		// "team": {
		// 	id: "team",
		// 	name: "Team",
		// 	description: "Team gamemode."
		// }
	},
	rules: {
		"stacking-draw": {
			english: {
				id: "stacking-draw",
				name: "Stacking Draw",
				description: "Stacking Draw rule."
			},
			french: {
				id: "stacking-draw",
				name: "Multiples piochages",
				description: "Règles des multiples piochages."
			}
		},
		"progressive-uno": {
			english: {
				id: "progressive-uno",
				name: "Progressive UNA",
				description: "Progressive UNA rule."
			},
			french: {
				id: "progressive-uno",
				name: "UNA progressif",
				description: "Règles du UNA progressif."
			}
		},
		// "seven-o": {
		// 	id: "seven-o",
		// 	name: "Seven-O",
		// 	description: "Seven-O rule."
		// },
		// "jump-in": {
		// 	id: "jump-in",
		// 	name: "Jump-In",
		// 	description: "Jump-In rule."
		// },
		// "row": {
		// 	id: "row",
		// 	name: "Row",
		// 	description: "Row rule."
		// },
		// "time-limit": {
		// 	id: "time-limit",
		// 	name: "Time Limit",
		// 	description: "Time limite rule."
		// }
	}
};


const changelogs = [
	{
		version: "1.0.0",
		date: {
			english: "2020-08-04",
			french: "04/08/2020"
		},
		logs: {
			title: {
				english: "Official release of UNA v1.0.0!",
				french: "Sortie officielle de UNA v1.0.0 !"
			},
			features: {
				english: [],
				french: []
			},
			bugs: {
				english: [],
				french: []
			},
		},
	},
	{
		version: "1.0.1",
		date: {
			english: "2020-08-04",
			french: "04/08/2020"
		},
		logs: {
			title: {
				english: "Littles bugfixes.",
				french: "Petites corrections de bugs."
			},
			features: {
				english: [
					"Added 'Report bugs' button (linked to github issues page)"
				],
				french: [
					"Ajouté un bouton 'Report bugs' (lié à la page des problèmes sur github)"
				]
			},
			bugs: {
				english: [
					"Player could see which card his opponents could play when he was playing while hovering opponents' cards"
				],
				french: [
					"Un joueur pouvait voir les cartes jouables de son adversaire lors de son tour en passant sa souris sur les cartes adverses"
				]
			},
		},
	}
];


const language = {
	english: {
		// Room
		room_usernamePlaceholder: "Username",
		room_create: "Create room",
		room_join: "Join room",
		room_leader: "Leader",
		room_start: "Start",
		room_playersList: "Players list",
		room_invite: "Copy invite link",
		room_disconnect: "has disconnected",
		room_reconnect: "has reconnected",
		// Options
		options_title: "Game settings",
		options_gamemode: "Select a gamemode:",
		options_rounds: "Number of rounds:",
		// Chat
		chat_title: "Chat",
		chat_send: "Send",
		chat_placeholder: "Chat here",
		message_uno: "says UNA!",
		message_gameover: "The game is over",
		message_contestContests: "contests",
		message_contestAnd: "and",
		message_contestBut: "but",
		message_contestWin: "wins contest!",
		message_contestLose: "loses the contest!",
		// Scoreboard
		scoreboard_title: "Scoreboard",
		// Changelogs
		changelogs_title: "Changelogs",
		changelogs_feature: "Features",
		changelogs_bugs: "Bugs",
		changelogs_report: "Report bugs",
		// Endgame
		endgame_winMessage: "has won the game!",
		endgame_playAgain: "Play again",
		// Game
		game_endTurn: "End turn",
		game_chooseColor: "Choose color:",
		game_contest: "Contest",
		// Copyright
		source_code: "Source code",
	},
	french: {
		// Room
		room_usernamePlaceholder: "Pseudo",
		room_create: "Créer une salle",
		room_join: "Rejoindre la salle",
		room_leader: "Chef",
		room_start: "Commencer",
		room_playersList: "Liste des joueurs",
		room_invite: "Copier le lien d'invitation",
		room_disconnect: "s'est déconnecté",
		room_reconnect: "s'est reconnecté",
		// Options
		options_title: "Options",
		options_gamemode: "Sélectionner un mode de jeu :",
		options_rounds: "Nombre de manches :",
		// Chat
		chat_title: "Tchat",
		chat_send: "Envoyer",
		chat_placeholder: "Écrire ici",
		message_uno: "dit UNA!",
		message_gameover: "La partie est terminée !",
		message_contestContests: "tente de contrer",
		message_contestAnd: "et",
		message_contestBut: "mais",
		message_contestWin: "gagne le contre-UNA !",
		message_contestLose: "perd le contre-UNA!",
		// Scoreboard
		scoreboard_title: "Tableau des scores",
		// Changelogs
		changelogs_title: "Journal des modifications",
		changelogs_feature: "Fonctionnalités",
		changelogs_bugs: "Bugs",
		changelogs_report: "Signaler un bug",
		// Endgame
		endgame_winMessage: "a gagné la partie !",
		endgame_playAgain: "Rejouer",
		// Game
		game_endTurn: "Terminer le tour",
		game_chooseColor: "Choix de couleur :",
		game_contest: "Contre-UNA",
		// Copyright
		source_code: "Code source.",
	}
};
