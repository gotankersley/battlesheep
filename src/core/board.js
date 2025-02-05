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

export const EMPTY = -1;

export const STARTING_COUNT = 16;
export const MODE_TILE = 0;
export const MODE_PLACE = 1;
export const MODE_MOVE = 2;
export const MODE_GAME_OVER = 3;

const PROTOCOL_P1 = 'h';
const PROTOCOL_P2 = 't';
const PROTOCOL_PLAYER = [PROTOCOL_P1, PROTOCOL_P2];

const PROTOCOL_DELIM1 = ',';
const PROTOCOL_DELIM2 = '|';


export function Pos(q, r) {
    return {q:q, r:r};
}

export function Tile(q, r) { 
	return {						
		tokenId : EMPTY,
		pos : {q:q, r:r},        
	};
}

export function Token( id, player, count, pos) {
    return {
        id : id,
        player : +(player),        
        count : count,
        pos : pos,
    };
}

export class Board {
	constructor() {
		this.tiles = {}; //Hash of 'board' - allows for irregular shapes			
		this.turn = TURN1;
        this.mode = MODE_MOVE;        
  
        //Default tiles
        this.tiles['0,2'] = new Tile(0,2);
        this.tiles['1,1'] = new Tile(1,1);
        this.tiles['2,1'] = new Tile(2,1);
        this.tiles['1,2'] = new Tile(1,2);
        
        this.tiles['3,1'] = new Tile(3,1);
        this.tiles['4,0'] = new Tile(4,0);
        this.tiles['5,0'] = new Tile(5,0);
        this.tiles['4,1'] = new Tile(4,1);
        
        this.tiles['0,4'] = new Tile(0,4);
        this.tiles['1,3'] = new Tile(1,3);
        this.tiles['2,3'] = new Tile(2,3);
        this.tiles['1,4'] = new Tile(1,4);
        
        this.tiles['4,2'] = new Tile(4,2);
        this.tiles['5,1'] = new Tile(5,1);
        this.tiles['6,1'] = new Tile(6,1);
        this.tiles['5,2'] = new Tile(5,2);
        
        this.tiles['2,4'] = new Tile(2,4);
        this.tiles['3,3'] = new Tile(3,3);
        this.tiles['4,3'] = new Tile(4,3);
        this.tiles['3,4'] = new Tile(3,4);
        
        this.tiles['4,4'] = new Tile(4,4);
        this.tiles['5,3'] = new Tile(5,3);
        this.tiles['6,3'] = new Tile(6,3);
        this.tiles['5,4'] = new Tile(5,4);
        
        this.tiles['0,6'] = new Tile(0,6);
        this.tiles['1,5'] = new Tile(1,5);
        this.tiles['2,5'] = new Tile(2,5);
        this.tiles['1,6'] = new Tile(1,6);
        
        this.tiles['2,6'] = new Tile(2,6);
        this.tiles['3,5'] = new Tile(3,5);
        this.tiles['4,5'] = new Tile(4,5);
        this.tiles['3,6'] = new Tile(3,6);
        
        //Tokens        
        var token1 = new Token(0, PLAYER1, STARTING_COUNT, new Pos(0, 2));
        var token2 = new Token(1, PLAYER1, STARTING_COUNT, new Pos(5, 2));
        this.tokens = [token1, token2]; //All tokens
        this.playerTokens = [ //Tokens by player
            [0], //Player1
            [1], //Player2
        ];
        
        this.tiles['0,2'].tokenId = 0;
        this.tiles['5,0'].tokenId = 1;
        
        console.log(this.toString());
	}
	
	clone() {
		var newBoard = new Board();
		for (var i = 0; i < BOARD_NUM; i++) {
			newBoard.grid[i] = this.tiles[i];			
		}
		newBoard.pinCounts[TURN1] = this.pinCounts[TURN1];
		newBoard.pinCounts[TURN2] = this.pinCounts[TURN2];
		
		newBoard.turn = this.turn;
	}

	isGameOver() {
        //See if moves available
		return false;
	}
	
    makeMove(srcPos, destPos, moveCount) { //Split stack
        var srcKey = srcPos.q + ',' + srcPos.r;
        var destKey = destPos.q + ',' + destPos.r;
        
        //Verify sanity check
		var srcStack = this.tiles[srcKey].stack;
        srcStack.count -= moveCount;
        var destTile = new Tile(destPos.q, destPos.r);
        destTile.stack = new Stack(srcStack.player, moveCount)
		this.tiles[destKey] = destTile;
        this.changeTurn();
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
		else if (this.tiles[src]-1 != this.turn) return {status: false, msg:'Not your pin'};
		else if (this.tiles[dest] != PIN_EMPTY) {
			
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

	
	
	toString() { //Spec: https://docs.google.com/document/d/11V8NxOIwUgfSfK_NEgoLcNuuDWOa7xfyxKEMnZwvppk/edit?tab=t.0
        
		var boardStr = '';
        
        //Tiles
        var tileKeys = Object.keys(this.tiles);
        for (var t = 0; t < tileKeys.length; t++) {
            var tileKey = tileKeys[t];
            var tile = this.tiles[tileKey];
            boardStr += tile.pos.q + PROTOCOL_DELIM1 + tile.pos.r + PROTOCOL_DELIM2;
        }
        
        //Tokens
        for (var tokenId = 0; tokenId < this.tokens.length; tokenId++) {
            var token = this.tokens[tokenId];
            boardStr += token.pos.q + PROTOCOL_DELIM1 + token.pos.r; //Coordinates
            boardStr += PROTOCOL_PLAYER[token.player] + PROTOCOL_DELIM2 //Player id
        }
        
        //Turn 
        if (this.turn == PLAYER1) boardStr += PROTOCOL_P1;
        else boardStr += PROTOCOL_P2;
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