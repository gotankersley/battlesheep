import { INVALID, Hex } from '../lib/hex-lib.js';

//Constants
export const PLAYER1 = 0;
export const PLAYER2 = 1;



/* Neighboring sides
   _0_
5 /   \1
4 \___/2
    3
 */
export const DIR_N = 0;
export const DIR_NE = 1;
export const DIR_SE = 2;
export const DIR_S = 3;
export const DIR_SW = 4;
export const DIR_NW = 5;

export const DIR_FLAG_N = 1;
export const DIR_FLAG_NE = 2;
export const DIR_FLAG_SE = 4;
export const DIR_FLAG_S = 8;
export const DIR_FLAG_SW = 16;
export const DIR_FLAG_NW = 32;

const NEIGHBORS_Q = [0,1,1,0,-1,-1]; //By dir
const NEIGHBORS_R = [-1,-1,0,1,1,0];  //By dir 

export const TURN1 = 0;
export const TURN2 = 1;

export const EMPTY = -1;

export const STARTING_COUNT = 16;

export const MODE_TILE = 0;
export const MODE_PLACE = 1;
export const MODE_MOVE = 2;
export const MODE_GAME_OVER = 3;

export const TILE_COUNT = 32; //(4 hexes in a tile quad * 4 * 2)

const PROTOCOL_TURN1 = 'h';
const PROTOCOL_TURN2 = 't';
const PROTOCOL_TO_TURN = [PROTOCOL_TURN1, PROTOCOL_TURN2];

const PROTOCOL_DELIM1 = ',';
const PROTOCOL_DELIM2 = '|';
const MAX_TRAVERSAL = 100;

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
        this.turn = INVALID; 
        this.tokens = []; //All tokens
        this.playerTokens = [[], []]; //Tokens by player                
        this.mode = MODE_MOVE;   
	}
	
    defaultBoard() {
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
    }
    
	clone() {
		var newBoard = new Board();
        
        //Tiles
        newBoard.tiles = {};
        var tileKeys = Object.keys(this.tiles);
        for (var t = 0; t < tileKeys.length; t++) {
            var tileKey = tileKeys[t];
            var tile = this.tiles[tileKey];		
            var newTile = new Tile(tile.pos.q, tile.pos.r);
            newTile.tokenId = tile.tokenId;
			newBoard.tiles[tileKey] = newTile;
		}
        
        //Tokens
        newBoard.tokens = [];
        newBoard.playerTokens = [];
        for (var tokenId = 0; tokenId < this.tokens.length; tokenId++) {
            var token = this.tokens[tokenId];
            var newToken = new Token( token.id, token.player, token.count, new Pos(token.pos.q, token.pos.r));
            newBoard.tokens.push(newToken);    
            newBoard.playerTokens[token.player] = token.id;
            
        }
        
        //Turn				
		newBoard.turn = this.turn;
	}

    isGameOver() {
        var curPlayer = this.turn;
        var oppPlayer = +(!this.turn);
        if (this.isGameOverForPlayer(curPlayer)) return true;
        //    if (this.isGameOverForPlayer(oppPlayer)) return true;
        //    
        //}
        //return false;
    }
    
	isGameOverForPlayer(player) {
        //See if moves available
        var tokenIds = this.playerTokens[player];
        for (var t = 0; t < tokenIds.length; t++) {
            var tokenId = tokenIds[t];
            var token = this.tokens[tokenId];
            if (token.count <= 1) continue; //Token can't be split further
            
            //Check neighbors to verify that at least one move is available            
            for (var dir = 0; dir < 6; dir++) {
                var neighQ = token.pos.q + NEIGHBORS_Q[dir];
                var neighR = token.pos.r + NEIGHBORS_R[dir];
                var neighKey = neighQ + ',' + neighR;
                if (this.tiles[neighKey] && this.tiles[neighKey].tokenId == EMPTY) {
                    return false;
                }
            }
            
        }
		return true; //No moves available
	}
	
    makeMove(srcPos, dstPos, moveCount) { 
        //Higher-level validatation done in isValidMove function
        var srcKey = srcPos.q + ',' + srcPos.r;
        var dstKey = dstPos.q + ',' + dstPos.r;
                        
		var srcTokenId = this.tiles[srcKey].tokenId;
        if (srcToken == EMPTY) throw('No token at source tile: ' + srcKey); 
        var srcToken = this.tokens[srcTokenId];
        var dstTile = this.tiles[dstKey]; 
        if (dstTile.tokenId != EMPTY) throw('Destination tile not empty: ' + dstKey);  
                   
        //Make the move
        srcToken.count -= moveCount; //Decrement existing
        var newToken = new Token(this.tokens.length, srcToken.player, moveCount, new Pos(dstPos.q, dstPos.r));
        this.tokens.push(newToken);
        this.playerTokens[srcToken.player].push(newToken.id);
        dstTile.tokenId = newToken.id;        
                		                      
	} 
    
    makePlace(pos) {
        var tileKey = pos.q + ',' + pos.r;
        if (!this.tiles[tileKey]) throw('Must place on tile - invalid coord: ' + tileKey);
        var tile = this.tiles[tileKey];
        var newToken = new Token(this.tokens.length, this.turn, STARTING_COUNT, new Pos(pos.q, pos.r));
        this.tokens.push(newToken);
        this.playerTokens[this.turn].push(newToken.id);
        
        tile.tokenId = newToken.id;
        
        
    }
		
	
	changeTurn() {
		this.turn = +(!this.turn);
	}

	inBounds(posKey) {
        if (this.tiles[posKey]) return true;		
		else return false;
	}
	
    isValidMove(src, dst, moveCount) {
        var srcKey = src.q + ',' + src.r;
        var dstKey = dst.q + ',' + dst.r;        
        
		if (!this.inBounds(srcKey)) return {status: false, msg:'Source out of bounds'};
		if (!this.inBounds(dstKey)) return {status: false, msg:'Dest out of bounds'};
        
        var srcTokenId = this.tiles[srcKey].tokenId;        
        if (srcToken == EMPTY) return {status: false, msg:'No token at source tile: ' + srcKey};
        
        var srcToken = this.tokens[srcTokenId];
		if (srcToken.player != this.turn) return {status: false, msg:'Not your token'};
        
        var dstTile = this.tiles[dstKey];          
        if (dstTile.tokenId != EMPTY) return {status: false, msg:'Destination tile not empty'};
        
        var srcCube = Hex(src.q, src.r); //Cube coordinates
        var dstCube = Hex(dst.q, dst.r); //Cube coordinates
        
        var dirQ = 0;
        var dirR = 0;
        
        //If any one of the cube coordinates is the same, then it has to lie on a straight line
        if (srcCube.q == dstCube.q) {            
            dirR = Math.sign( dstCube.r - srcCube.r);
        }
        else if (srcCube.r == dstCube.r) {
            dirQ = Math.sign( dstCube.q - srcCube.q);            
        }
        else if (srcCube.s == dstCube.s) {
            dirQ = Math.sign( dstCube.q - srcCube.q);
            dirR = Math.sign( dstCube.r - srcCube.r);
        }
        else return {status: false, msg:'Must move in a straight line'};

        //Verify no gaps or obstacles between src and dst
        var deltaCube = {
            q: Math.abs(srcCube.q - dstCube.q),
            r: Math.abs(srcCube.r - dstCube.r),
            s: Math.abs(srcCube.s - dstCube.s),
        };
    	var dist = (deltaCube.q + deltaCube.r + deltaCube.s)/2;
        var pos = new Pos(src.q, src.r);
        for (var d = 0; d < dist; d++) {
            pos.q += dirQ;
            pos.r += dirR;
            var posKey = pos.q + ',' + pos.r;
            if (!this.tiles[posKey]) return {status: false, msg:'Can not move over gaps'};
            var tile = this.tiles[posKey];
            if (tile.tokenId != EMPTY) return {status: false, msg:'Can not jump over other tokens'};
        }
        var moves = this.getMoves();
        
		return {status:true, msg:''};
	}
    
    getMoves() {
        var moves = [];
        
        var tokenIds = this.playerTokens[this.turn];
        for (var t = 0; t < tokenIds.length; t++) {
            var tokenId = tokenIds[t];
            var token = this.tokens[tokenId];
            if (token.count <= 1) continue; //Token can't be split further
            
            //Check neighbors to verify that at least one move is available            
            for (var dir = 0; dir < 6; dir++) {
                var neighQ = token.pos.q + NEIGHBORS_Q[dir];
                var neighR = token.pos.r + NEIGHBORS_R[dir];
                var neighKey = neighQ + ',' + neighR;
                
                var stepCount = 1;
                while (stepCount < MAX_TRAVERSAL && this.tiles[neighKey] && this.tiles[neighKey].tokenId == EMPTY){
                    var move = {
                        src:new Pos(token.pos.q, token.pos.r),
                        dst:new Pos(neighQ, neighR),
                        count:token.count-1, //The represents the max available
                    };
                    moves.push(move);
                    
                    neighQ += NEIGHBORS_Q[dir];
                    neighR += NEIGHBORS_R[dir];
                    neighKey = neighQ + ',' + neighR;
                    stepCount++;
                }
            }
            
        }        
        return moves;
    }
	
	
	toString() { //Spec: https://docs.google.com/document/d/11V8NxOIwUgfSfK_NEgoLcNuuDWOa7xfyxKEMnZwvppk/edit?tab=t.0
        //Example: 0,2|1,1|2,1|1,2|3,1|4,0|5,0|4,1|0,4|1,3|2,3|1,4|4,2|5,1|6,1|5,2|2,4|3,3|4,3|3,4|4,4|5,3|6,3|5,4|0,6|1,5|2,5|1,6|2,6|3,5|4,5|3,6|0,2h16|5,2t16|h        
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
            boardStr += PROTOCOL_TO_TURN[token.player]; //Player turn
            boardStr += token.count + PROTOCOL_DELIM2; //Stack count
        }
        
        //Turn 
        if (this.turn == PLAYER1) boardStr += PROTOCOL_TURN1;
        else boardStr += PROTOCOL_TURN2;
		return boardStr;
	}
	
	static fromString = (boardStr) => { //Parse
		var board = new Board();
        boardStr = boardStr.toLowerCase();
        if (!boardStr || boardStr == '') throw('Invalid board str: ' + boardStr);
        var pairs = boardStr.split(PROTOCOL_DELIM2);
        if (pairs.length < TILE_COUNT) throw('Invalid board str: ' + boardStr);
        		
        //Turn - Should be last
        var turnStr = pairs[pairs.length-1];
        if (turnStr == PROTOCOL_TURN1) board.turn = PLAYER1;
        else if (turnStr == PROTOCOL_TURN2) board.turn = PLAYER2;
        else throw('Invalid board turn: ' + turnStr);
        
        
        //Tiles - Expect 32
        var t;
        for (t = 0; t < TILE_COUNT; t++) {
            var pair = pairs[t];
            if (!pair || pair == '') throw('Invalid board coordinate: ' + pair);
            var posArr = pair.split(PROTOCOL_DELIM1);
            var posKey = posArr[0] + ',' + posArr[1];
            var tile = new Tile(Number.parseInt(posArr[0]), Number.parseInt(posArr[1]));
            board.tiles[posKey] = tile;
            //NOTE: token id added after it's parsed in next step
        }
        
        //Tokens - Expect minimum of 2
        //Example: 0,2h
        if ((pairs.length - t) <= 2) throw('Invalid board tokens: ' + boardStr);
        for (var p = t; p < pairs.length-1; p++) { //Pairs length minus 1 to account for turn at the end
            var pair = pairs[p];
            if (!pair || pair == '') throw('Invalid board token: ' + pair);            
            
            var turnIndex = pair.indexOf(PROTOCOL_TURN1);
            var player;            
            if (turnIndex >= 0) {  //Player 1
                player = PLAYER1;                
            }
            else { //Not player 1
                turnIndex = pair.indexOf(PROTOCOL_TURN2);
                if (turnIndex < 0) throw('Invalid board token - player turn not found: ' + pair);
                player = PLAYER2;
            }
            var posStr = pair.substr(0, turnIndex);
            var posArr = posStr.split(PROTOCOL_DELIM1);
            var posKey = posArr[0] + ',' + posArr[1];            
            var count = Number.parseInt(pair.substr(turnIndex+1));
            var pos = new Pos(Number.parseInt(posArr[0]), Number.parseInt(posArr[1]))
            
            var token = new Token(board.tokens.length, player, count, pos);
            board.tokens.push(token);
            board.playerTokens[player].push(token.id);
            board.tiles[posKey].tokenId = token.id;
        }
		
        this.mode = MODE_PLACE;
        
        //TODO: Normalize
        //TODO: Sanity check all tiles are connected
		return board;
	}
    
    static parseMove = (moveStr) => { //Example: 2,1|6|4,-1
        var pairs = moveStr.split(PROTOCOL_DELIM2);
        if (pairs.length != 3) throw('Invalid move str: ' + moveStr);
        
        //Source
        var srcStr = pairs[0];
        var srcArr = srcStr.split(PROTOCOL_DELIM1);
        if (srcArr.length != 2) throw('Invalid move source coordinates: ' + moveStr);
        var src = new Pos(Number.parseInt(srcArr[0]), Number.parseInt(srcArr[1]));
        
        //Count
        var count = Number.parseInt(pairs[1]);
        
        
        //Dest
        var dstStr = pairs[0];
        var dstArr = dstStr.split(PROTOCOL_DELIM1);
        if (dstArr.length != 2) throw('Invalid move dest coordinates: ' + moveStr);
        var dst = new Pos(Number.parseInt(dstArr[0]), Number.parseInt(dstArr[1])); 
            
        return {src:src, dst:dst, count:count};
    }
}