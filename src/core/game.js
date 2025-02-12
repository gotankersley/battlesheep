import { Board, MODE_PLACE, MODE_MOVE, MODE_TILE } from '../core/board.js';
import { PLAYER_HUMAN, PLAYER_RANDOM, PLAYER_NETWORK } from '../players/players.js';
import * as RandomPlayer from '../players/random.js';
import * as NetworkPlayer from '../players/network.js';

//Constants
export const EVENT_INVALID = 'invalid';
export const EVENT_MOVED = 'moved';
export const EVENT_PLACED = 'placed';
export const EVENT_TILED = 'tiled';
export const EVENT_GAME_OVER = 'gameOver';
export const EVENT_MODE_CHANGED = 'modeChanged';



const DEFAULT_BOARD_STR = '0,2|1,1|2,1|1,2|3,1|4,0|5,0|4,1|0,4|1,3|2,3|1,4|4,2|5,1|6,1|5,2|2,4|3,3|4,3|3,4|4,4|5,3|6,3|5,4|0,6|1,5|2,5|1,6|2,6|3,5|4,5|3,6|0,2h16|5,2t16|h';

export class Game {
	constructor(boardStr) {
        if (boardStr != '') this.board = Board.fromString(boardStr);
        //else this.board = Board.fromString(DEFAULT_BOARD_STR);
        else this.board = new Board();
		boardStr = this.board.toString(); //Update / Sanity check
		
		//Add initial state
		this.history = [boardStr]; //History is for game log		
		this.undoHistory = [];
		
		this.players = [PLAYER_HUMAN, PLAYER_HUMAN];
		
		this.gameEvents = {}; //Callbacks to update UI	
	}



	updateBoard = (newBoard)  => {
		this.board = newBoard;
		this.gameEvents[EVENT_BOARD_UPDATE](newBoard);
	}

    // Action methods
    makeMove = (src, dst, moveCount, override) => {	       
        this.board.makeMove(src, dst, moveCount);            	
        this.onMoved(src, dst, moveCount);        
    }
    
    makePlace = (pos, override) => {	       
        this.board.makePlace(pos);
        this.onPlaced(pos);
    }
    
    makeTile = (initialPos, tileRot) => {
        this.board.makeTile(initialPos, tileRot);
        this.onTiled(initialPos, tileRot);
    }

    play = () => {
		
		var board = this.board;
		var turn = board.turn;
		var player = this.players[turn];
		
        if (board.isGameOver()){            
            return this.onGameOver();
        }
        
		if (player == PLAYER_HUMAN) return; //Ignore
		
		//Handle no-move, and one move
		//var moves = board.getMoves();	
		//if (moves.length == 0) return this.onPlayed();		
		
		
		//All Async - expect onPlayed callback	
		switch (player) {
			case PLAYER_NETWORK: NetworkPlayer.getPlay(board, this.onPlayed); break;	 	//Network
			case PLAYER_RANDOM: RandomPlayer.getPlay(board, this.onPlayed); break;			//Random			
			default: alert('Invalid player');
		}		
	}
    
	undoMove = () => {
		
		if (this.history.length > 1) {			
			var oldStr = this.history.pop();			
			
			var boardStr = this.history[this.history.length-1];
			
			this.board = Board.fromString(boardStr);
			return true;		
		}
		return false;
	}

    /*
	redoMove = () => {
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
    */

	//Event methods	
    addEventListener(name, callback) {	
		this.gameEvents[name] = callback;
	}
    onPlayed = (play) => {
        var mode = this.board.mode;
        if (mode == MODE_TILE) {
            this.makeTile(play.pos, play.rot);
        }
        else if (mode == MODE_PLACE) {
            this.makePlace(play.pos);
        }
        else if (mode == MODE_MOVE) {            
            this.makeMove(play.src, play.dst, play.count);
        }        
    }

    onPlaced = (pos) => {
        var board = this.board;
        
        //History 
        var boardStr = board.toString();        
		this.history.push(boardStr);
        board.changeTurn(); 
        if (board.mode == MODE_MOVE) {
            this.gameEvents[EVENT_MODE_CHANGED](boardStr);            
        }
        else this.gameEvents[EVENT_PLACED](pos, boardStr);            
    }

	onMoved = (src, dst, moveCount) => {        
		
		var board = this.board;
		
        var player = this.players[board.turn];        

        
		//History 
        var boardStr = board.toString();        
		this.history.push(boardStr);	
		
        
		//Check for game over
		if (board.isGameOver()) this.onGameOver();
		else {
            board.changeTurn(); 
            this.gameEvents[EVENT_MOVED](src, dst, boardStr);            
        }
	}

    onTiled = (initialPos, tileRot) => {        
        var board = this.board;
        
        //History 
        var boardStr = board.toString();        
		this.history.push(boardStr);
        board.changeTurn(); 
        if (board.mode == MODE_PLACE) this.gameEvents[EVENT_MODE_CHANGED](boardStr); 
        else this.gameEvents[EVENT_TILED](initialPos, tileRot, boardStr); 

    }
    onGameOver = () => {
		var loser = this.board.turn; //TODO: draws?
		
        var boardStr = this.board.toString();        
		this.history.push(boardStr);	
		
		//Draw the win and other hoopla...
		this.gameEvents[EVENT_GAME_OVER](+(!loser), loser);
			
	}
    
    changeMode = (mode) => {
        this.board.mode = mode;
        var boardStr = this.board.toString();         
        this.gameEvents[EVENT_MODE_CHANGED](boardStr);            
    }
}
//end class Game