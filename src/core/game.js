import { Board } from '../core/board.js';
import { PLAYER_HUMAN } from '../players/players.js';

//Constants
var GAME_REPEAT_WINDOW = 8; //Check for repeats this far back


var EVENT_INVALID = 0;
var EVENT_PLAYED = 1;
var EVENT_GAME_OVER = 2;

var INFINITY = 1000000;
var INVALID = -1;

export class Game {
	constructor(boardStr) {
		this.board = new Board(boardStr); //The main (current) board instance		
		boardStr = this.board.toString(); //Update
		
		//Add initial state
		this.history = [boardStr]; //History is for game log
		this.memory = {}; //Memory is for detecting repeats
		this.memory[boardStr] = true;
		this.undoHistory = [];
		
		this.players = [PLAYER_HUMAN, PLAYER_HUMAN];
		
		this.gameEvents = {}; //Callbacks to update UI	
	}



	updateBoard (newBoard) {
		this.board = newBoard;
		this.gameEvents[EVENT_BOARD_UPDATE](newBoard);
	}

	//Event methods
	addEventListener(name, callback) {	
		this.gameEvents[name] = callback;
	}


	onGameOver () {
		var loser = this.board.getTurn(); //TODO: draws?
		
		//this.logCurrentState(boardCopy);
		
		//Draw the win and other hoopla...
		this.gameEvents[EVENT_GAME_OVER](+(!loser), loser);
			
	}
    
    makeMove = (src, dst, moveCount, override) => {	
        if (override || true) {//|| this.hive.canMove(src, dst)) {
            this.board.makeMove(src, dst, moveCount);
            //this.save();		
            //this.onMoved(src, dst);
        }	
    }

	undoMove () {
		
		if (this.history.length > 1) {			
			var oldStr = this.history.pop();
			this.undoHistory.push(oldStr);
			delete this.memory[oldStr];
			var boardStr = this.history[this.history.length-1];
			
			this.board = new Board(boardStr);
			return true;		
		}
		return false;
	}

	redoMove() {
		if (this.undoHistory.length > 0) {	
			var savedStr = this.undoHistory.pop();
			this.history.push(savedStr);
			this.memory[savedStr] = true;
			this.board = new Board(savedStr);					
			
			//Check for Game over		
			if (this.board.isGameOver()) this.onGameOver();				
			return true;
		}
		return false;
	}



	//Helper function keep track of game history
	logCurrentState(board) {
		var boardStr = board.toString();
		this.history.push(boardStr);
		//if (this.memory[boardStr]) {
			//if (this.history.slice(-GAME_REPEAT_WINDOW).indexOf(boardStr) >= 0) this.gameEvents['repeat']();
		//}
		this.memory[boardStr] = true;
	}
	
	load() {}
	save() {}

	//Player functions
	play () {
		
		var board = this.board;
		var turn = board.getTurn();
		var player = this.players[turn];
		
		if (player == PLAYER_HUMAN) return; //Ignore
		
		//Handle no-move, and one move
		var plays = board.getPlays();	
		if (plays.length == 0) return this.onPlayed();
		else if (plays.length == 1) return this.onPlayed(plays[0]);
		
		
		//All Async - expect onPlayed callback	
		switch (player) {
			case PLAYER_NETWORK: NetworkPlayer.getPlay(board, this.onPlayed); break;	 	//Network
			case PLAYER_RANDOM: RandomPlayer.getPlay(board, this.onPlayed); break;			//Random			
			default: alert('Invalid player');
		}		
	}

	onPlayed(move) {
		var self = game;	
		
		//TODO: Validate move?
		if (!move) { //No moves available
			alert ('No moves available - skipping player');
			self.board.skip();
			return self.gameEvents[EVENT_PLAYED]();
		}
		
		var board = self.board;
		var mode = board.getMode();
		var turn = board.getTurn();
		var player = self.players[turn];
		
		//Update board
		if (mode == MODE_PLACE) board.place(move.pr, move.pc);					
		else if (mode & (MODE_MOVE | MODE_FLY)) board.move(move.sr, move.sc, move.dr, move.dc);
			
		//Removes, or combined moves -(e.g. place followed by remove)
		if (move.hasOwnProperty('rr') && move.hasOwnProperty('rc')) {
			board.remove(move.rr, move.rc);
		}
		
		//History and Memory
		self.logCurrentState(board);	
		
		//Check for game over
		if (board.isGameOver()) self.onGameOver();
		else self.gameEvents[EVENT_PLAYED](player, move);
	}

}
//end class Game