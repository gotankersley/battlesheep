import { INVALID } from '../lib/hex-lib.js';

//Constants
export const PLAYER1 = 0;
export const PLAYER2 = 1;



/* Neighboring sides
   _0_
5 /   \1
4 \___/2
    3
 */
export const DIR_N = 1;
export const DIR_NE = 2;
export const DIR_SE = 4;
export const DIR_S = 8;
export const DIR_SW = 16;
export const DIR_NW = 32;

export const TURN1 = 0;
export const TURN2 = 1;

export const STARTING_STACK = 16;

export function Tile(q, r) { 
	return {						
		stack : null,
		pos : {q:q, r:r},        
	};
}

export function Stack( player) {
    return {
        tokens : [0],
        player : +(player),        
    };
}

export class Board {
	constructor() {
		this.grid = {}; //Hash of 'board' - allows for irregular shapes			
		this.turn = TURN1;

		//Player
        var tile1 = new Tile(0, 0); 
        tile1.stack = new Stack(PLAYER2);
        this.grid['0,0'] = tile1;

        var tile2 = new Tile(1, 1); 
        tile2.stack = new Stack(PLAYER1);
        this.grid['1,1'] = tile2;
        
        
        this.grid['0,1'] = new Tile(0,1);
        this.grid['1,0'] = new Tile(1,0);
		
	}
	
	clone() {
		var newBoard = new Board();
		for (var i = 0; i < BOARD_NUM; i++) {
			newBoard.grid[i] = this.grid[i];			
		}
		newBoard.pinCounts[TURN1] = this.pinCounts[TURN1];
		newBoard.pinCounts[TURN2] = this.pinCounts[TURN2];
		
		newBoard.turn = this.turn;
	}

	isGameOver() {
        //See if moves available
		return false;
	}
	
    makeMove(srcPos, destPos) {
		this.grid[destPos] = this.grid[srcPos];
		this.grid[srcPos] = PIN_EMPTY;
	} 
		
	
	changeTurn() {
		this.turn = +(!this.turn);
	}

	inBounds(pos) {
		if (pos >= 0 && pos < BOARD_NUM) return true;
		else return false;
	}
	
    isValidMove(src, dest) {
		
		if (!this.inBounds(src)) return {status: false, msg:'Source out of bounds'};
		else if (!this.inBounds(dest)) return {status: false, msg:'Dest out of bounds'};
		else if (this.grid[src]-1 != this.turn) return {status: false, msg:'Not your pin'};
		else if (this.grid[dest] != PIN_EMPTY) {
			
			if (this.isValidCapture(src, dest, DIR_N)) { //North
				return {status: true, msg:'', dir:DIR_N};
			}
			
			else if (this.isValidCapture(src, dest, DIR_S)) { //South
				return {status: true, msg:'', dir:DIR_S};
			}
			
			else if (this.isValidCapture(src, dest, DIR_E)) { //East
				return {status: true, msg:'', dir:DIR_E};
			}
			
			else if (this.isValidCapture(src, dest, DIR_W)) { //West
				return {status: true, msg:'', dir:DIR_W};
			}
						
			else return {status: false, msg:'Invalid capture'};
		}
		else if (DESTS_BY_POS[src].indexOf(dest) < 0) return {status: false, msg:'Invalid move'};		
		else return {status:true, msg:''};
	}

	
	
	toString() {
		var boardStr = '';
		//for (var pid = 0; pid < BOARD_NUM; pid++) {
		//	boardStr += this.grid[pid];
		//}
		boardStr += this.turn;
		return boardStr;
	}
	
	static fromString = (boardStr) => { //Parse
		var board = new Board();
		if (boardStr.length != (BOARD_NUM+1)) throw('Invalid board str: ' + boardStr);
		var pid = 0;
		var pinCount1 = 0;
		var pinCount2 = 0;
		for (var r = 0; r < COUNT_ROW; r++) {
			for (var c = 0; c < COUNT_ROW; c++) {
				var c = boardStr[pid];
				if (c == PIN_EMPTY) board.grid[pid] = PIN_EMPTY;
				else if (c == PIN_PLAYER1) {
					board.grid[pid] = PIN_PLAYER1;
					pinCount1++;
				}
				else if (c == PIN_PLAYER2) {
					board.grid[pid] = PIN_PLAYER1;
					pinCount2++;
				}
				else throw('Invalid pin type: ' + c);				
			}			
		}		
		var turn = boardStr[BOARD_NUM];
		if (turn == TURN1 || turn == TURN2) board.turn = turn;
		else throw('Invalid turn type: ' + turn);
		
		//Set pin counts
		board.pinCounts = [pinCount1, pinCount2];
		return board;
	}
}