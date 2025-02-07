import { Board } from '../core/board.js';
import { PLAYER_HUMAN } from '../players/players.js';

//Constants
var GAME_REPEAT_WINDOW = 8; //Check for repeats this far back


export const EVENT_INVALID = 'invalid';
export const EVENT_MOVED = 'moved';
export const EVENT_GAME_OVER = 'gameOver';




export class Game {
	constructor(boardStr) {
		//this.board = new Board(boardStr); //The main (current) board instance		
        //this.board = Board.fromString(boardStr);
        this.board = Board.fromString('0,2|1,1|2,1|1,2|3,1|4,0|5,0|4,1|0,4|1,3|2,3|1,4|4,2|5,1|6,1|5,2|2,4|3,3|4,3|3,4|4,4|5,3|6,3|5,4|0,6|1,5|2,5|1,6|2,6|3,5|4,5|3,6|0,2h16|5,2t16|h');
		boardStr = this.board.toString(); //Update
		
		//Add initial state
		this.history = [boardStr]; //History is for game log		
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
		var loser = this.board.turn; //TODO: draws?
		
		this.logCurrentState(this.board);
		
		//Draw the win and other hoopla...
		this.gameEvents[EVENT_GAME_OVER](+(!loser), loser);
			
	}
    
    makeMove = (src, dst, moveCount, override) => {	
        if (override || true) {//|| this.hive.canMove(src, dst)) {
            this.board.makeMove(src, dst, moveCount);
            //this.save();		
            this.onMoved(src, dst);
        }	
    }

	undoMove () {
		
		if (this.history.length > 1) {			
			var oldStr = this.history.pop();
			this.undoHistory.push(oldStr);
			
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
	}
	
	

	//Player functions
	play () {
		
		var board = this.board;
		var turn = board.turn;
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

	onMoved(move) {        
		
		var board = this.board;
		
        var player = this.players[board.turn];        
		/*
		//TODO: Validate move?
		if (!move) { //No moves available
			alert ('No moves available - skipping player');
			this.board.skip();
			return this.gameEvents[EVENT_PLAYED]();
		}
		
		var mode = board.getMode();

		*/
        
		//History 
		this.logCurrentState(board);	
		
        
		//Check for game over
		if (board.isGameOver()) this.onGameOver();
		else this.gameEvents[EVENT_MOVED](player, move);
	}

}
//end class Game