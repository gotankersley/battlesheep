import { INVALID } from '../lib/hex-lib.js';
import { Board, MODE_PLACE, MODE_MOVE, MODE_TILE, PLAYER1, PLAYER2 } from '../core/board.js';
import { PLAYER_HUMAN, PLAYER_RANDOM, PLAYER_NETWORK, PLAYER_RAMBO, PLAYER_RAMSES, PLAYER_NICO } from '../players/players.js';
import * as RandomPlayer from '../players/random.js';
import * as NetworkPlayer from '../players/network.js';
import * as NicoPlayer from '../players/nico.js';
import * as RamboPlayer from '../players/rambo.js';
import * as RamsesPlayer from '../players/ramses.js';

//Constants
export const EVENT_INVALID = 'invalid';
export const EVENT_MOVED = 'moved';
export const EVENT_PLACED = 'placed';
export const EVENT_TILED = 'tiled';
export const EVENT_GAME_OVER = 'gameOver';
export const EVENT_MODE_CHANGED = 'modeChanged';
export const EVENT_NO_MOVES = 'noMoves';



export const DEFAULT_BOARD_STR = '0,2|1,1|2,1|1,2|3,1|4,0|5,0|4,1|0,4|1,3|2,3|1,4|4,2|5,1|6,1|5,2|2,4|3,3|4,3|3,4|4,4|5,3|6,3|5,4|0,6|1,5|2,5|1,6|2,6|3,5|4,5|3,6|0,2h16|5,2t16|h';
//http://localhost:8080/battlesheep/#5,0|5,1|4,1|4,0|6,0|6,-1|7,-1|7,0|3,3|2,4|2,3|3,2|4,-1|3,-1|4,-2|5,-2|9,-2|8,-2|9,-3|10,-3|5,2|6,2|5,3|4,3|1,0|0,0|1,-1|2,-1|2,-2|1,-2|2,-3|3,-3|h

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
    
    makeTileSeparate = (tileHexes) => {
        this.board.makeTileSeparate(tileHexes);
        this.onTiled(INVALID, INVALID);
    }

    play = () => {
		
		var board = this.board;
		if (this.players[board.turn] == PLAYER_HUMAN) return; //Ignore
        
        var gameOvers = board.isGameOverForPlayers();
        if (gameOvers[PLAYER1] && gameOvers[PLAYER2]) return this.onGameOver();
        else if (gameOvers[board.turn]) {
            this.gameEvents[EVENT_NO_MOVES](board.turn);   
            board.changeTurn();
            return;
        }                 				
		
		
		//All Async - expect onPlayed callback	
		switch (this.players[board.turn]) {
			case PLAYER_RANDOM: RandomPlayer.getPlay(board, this.onPlayed); break;	//Random			
			case PLAYER_RAMBO: RamboPlayer.getPlay(board, this.onPlayed); break; //Rambo
			case PLAYER_RAMSES: RamsesPlayer.getPlay(board, this.onPlayed); break; //Ramses
			case PLAYER_NETWORK: NetworkPlayer.getPlay(board, this.onPlayed); break; //Network
			case PLAYER_NICO: NicoPlayer.getPlay(board, this.onPlayed); break; //Nico
			default: alert('Invalid player');
		}		
	}
    
	undoMove = () => {
		
		if (this.history.length > 1) {			
			var oldStr = this.history.pop();			
			
			var boardStr = this.history[this.history.length-1];
			
			this.board = Board.fromString(boardStr);
            this.board.changeTurn();
			return true;		
		}
		return false;
	}


	//Event methods	
    addEventListener(name, callback) {	
		this.gameEvents[name] = callback;
	}
    onPlayed = (play) => {
        var mode = this.board.mode;
        if (mode == MODE_TILE) {
            if (play.tileHexes) this.makeTileSeparate(play.tileHexes); 
            else this.makeTile(play.pos, play.rot);
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
        var gameOvers = board.isGameOverForPlayers();
        if (gameOvers[PLAYER1] && gameOvers[PLAYER2]) this.onGameOver(); //Both
        else {
            if (!gameOvers[+(!board.turn)]) {
                board.changeTurn();
            }
            else this.gameEvents[EVENT_NO_MOVES](+(!board.turn));   
            
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
        var board = this.board;
        
        var winner = board.getWinner();        
        var loser = (winner == INVALID)? INVALID : +(!winner);
        
        //var boardStr = this.board.toString();        
		//this.history.push(boardStr);	
		
		//Draw the win and other hoopla...
		this.gameEvents[EVENT_GAME_OVER](winner, loser);
			
	}
    
    changeMode = (mode) => {
        this.board.mode = mode;
        var boardStr = this.board.toString();         
        this.gameEvents[EVENT_MODE_CHANGED](boardStr);            
    }
}
//end class Game