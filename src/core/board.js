import { INVALID } from '../lib/hex-lib.js';

//Constants
export const PLAYER1 = 0;
export const PLAYER2 = 1;

export const BOARD_NUM = 36;
export const COUNT_ROW = 6;
const STARTING_PIN_COUNT = 16;

//Enums
export const PIN_EMPTY = 0;
export const PIN_PLAYER1 = 1;
export const PIN_PLAYER2 = 2;

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

export function Tile(tileType, player) { //Node class
	return {			
		type : tileType,		
		player : +(player),
		pos : {q:INVALID, r:INVALID},		
        count : INVALID,
	};
}

export class Board {
	constructor() {
		this.grid = {}; //Hash of 'board' - allows for irregular shapes	
		this.pinCounts = [STARTING_PIN_COUNT, STARTING_PIN_COUNT];		
		this.turn = TURN1;

		//Player
        var tile = new Tile(0, PLAYER1);
        tile.pos.q = 0;
        tile.pos.r = 0;
        this.grid['0,0'] = tile;
		
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
		for (var pid = 0; pid < BOARD_NUM; pid++) {
			boardStr += this.grid[pid];
		}
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