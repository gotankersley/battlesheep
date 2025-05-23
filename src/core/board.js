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
export const DIRECTIONS = 6;

export const NEIGHBORS_Q = [0,1,1,0,-1,-1]; //By dir
export const NEIGHBORS_R = [-1,-1,0,1,1,0];  //By dir 
//export const NEIGHBORS_S = [1,0,-1,-1,0,1];  //By dir 

const TILE_QUADS_BY_ROT = [ //By rotation
    [DIR_SE, DIR_S, DIR_SW],
    [DIR_S, DIR_SW, DIR_NW],
    [DIR_SW, DIR_NW, DIR_N],
    [DIR_NW, DIR_N, DIR_NE],
    [DIR_N, DIR_NE, DIR_SE],
    [DIR_NE, DIR_SE, DIR_S],
];
export const TILE_ROTATIONS = 6;
export const TILE_QUAD = 4;
export const TILE_COUNT = 32; //(4 hexes in a tile quad * 4 * 2)

export const TURN1 = 0;
export const TURN2 = 1;

export const EMPTY = -1;

export const STARTING_COUNT = 16;

export const MODE_TILE = 0;
export const MODE_PLACE = 1;
export const MODE_MOVE = 2;
export const MODE_GAME_OVER = 3;

export const INITIAL_TOKENS = 2;


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
        this.turn = PLAYER1; 
        this.tokens = []; //All tokens
        this.playerTokens = [[], []]; //Tokens by player                
        this.mode = MODE_TILE;   
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
        newBoard.playerTokens = [[], []];
        for (var tokenId = 0; tokenId < this.tokens.length; tokenId++) {
            var token = this.tokens[tokenId];
            var newToken = new Token( token.id, token.player, token.count, new Pos(token.pos.q, token.pos.r));
            newBoard.tokens.push(newToken);    
            newBoard.playerTokens[token.player].push(token.id);
            
        }
        
        //Turn				
		newBoard.turn = this.turn;
        newBoard.mode = this.mode;
        return newBoard;
	}

    isGameOverForPlayers() {
        if (this.mode != MODE_MOVE) return [false, false];

        var gameOvers = [false, false];
        if (this.isGameOverForPlayer(PLAYER1)) gameOvers[PLAYER1] = true;            
        if (this.isGameOverForPlayer(PLAYER2)) gameOvers[PLAYER2] = true;            

        //Return if game is over for each player respectively
        return gameOvers;
    }
    
	isGameOverForPlayer(player) {
        //See if moves available
        var tokenIds = this.playerTokens[player];
        for (var t = 0; t < tokenIds.length; t++) {
            var tokenId = tokenIds[t];
            var token = this.tokens[tokenId];
            if (token.count <= 1) continue; //Token can't be split further
            
            //Check neighbors to verify that at least one move is available            
            for (var dir = 0; dir < DIRECTIONS; dir++) {
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
	
    getWinner() {
        //To be used after the game is over
        var curPlayer = this.turn;
        var oppPlayer = +(!curPlayer);
        
        var curTileCount = this.playerTokens[curPlayer].length;
        var oppTileCount = this.playerTokens[oppPlayer].length;
                    
        if (curTileCount > oppTileCount) return curPlayer; //Easy victory
        else if (oppTileCount > curTileCount) return oppPlayer;
        
        //Else Tie - Have to see which has longest connected section
        var playerMaxConnected = [0, 0];
        var checkedTokens = {};
        for (var t = 0; t < this.tokens.length; t++) {
            var token = this.tokens[t];
            if (checkedTokens[token.id]) continue;
            else checkedTokens[token.id] = true;
            
            var breadcrumbs = {};
            breadcrumbs[token.id] = true;
            var countRef = [1]; //Pass-by-reference
            this.connectedTokenCountBFS(token.pos, token.player, countRef, breadcrumbs); //BFS - Recursive
            var connectedCount = countRef[0];
            
            //Consider all breadcrumbs as having already been checked
            var breadcrumbKeys = Object.keys(breadcrumbs);
            for (var b = 0; b < breadcrumbKeys.length; b++) {
                var breadcrumbKey = breadcrumbKeys[b];
                checkedTokens[breadcrumbKey] = true;
            }
            
            var currentMax = playerMaxConnected[token.player];
            playerMaxConnected[token.player] = Math.max(currentMax, connectedCount);
        }
        
        if (playerMaxConnected[curPlayer] > playerMaxConnected[oppPlayer]) return curPlayer;
        else if (playerMaxConnected[curPlayer] < playerMaxConnected[oppPlayer]) return oppPlayer;
        else return INVALID; //Is this even possible?
        
    }
    
    connectedTokenCountBFS(pos, player, countRef, breadcrumbs) { //Recursive Breadth-First-Search
        //Find the neighboring tokens
        for (var dir = 0; dir < DIRECTIONS; dir++) {
            var neighQ = pos.q + NEIGHBORS_Q[dir];
            var neighR = pos.r + NEIGHBORS_R[dir];            
            var neighKey = neighQ + ',' + neighR;
            if (this.tiles[neighKey]) {
                var tile = this.tiles[neighKey];
                if (tile.tokenId != EMPTY) {
                    var token = this.tokens[tile.tokenId];
                    if (!breadcrumbs[token.id]) {
                        if (token.player == player) {
                            breadcrumbs[token.id] = true;
                            countRef[0]++;
                            this.connectedTokenCountBFS(token.pos, player, countRef, breadcrumbs); //Recurse
                        }
                    }
                }                                
            }
        }        
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
        if (this.tokens.length == INITIAL_TOKENS) this.mode = MODE_MOVE;
    }
    
    makeTile(initialPos, tileRot) {
        var quadSplit = this.splitTileQuad(initialPos, tileRot);
        if (quadSplit.intersects) throw('Tiles must not intersect existing tiles');
        var hexes = quadSplit.hexes;
        for (var h = 0; h < hexes.length; h++) {
            var hex = hexes[h];
            var tileKey = hex.q + ',' + hex.r;
            this.tiles[tileKey] = new Tile(hex.q, hex.r);
        }
        var tileKeys = Object.keys(this.tiles);
        if (tileKeys.length == TILE_COUNT) this.mode = MODE_PLACE;
    }
    
    makeTileSeparate(tileHexes) {        
        for (var h = 0; h < tileHexes.length; h++) {
            var hex = tileHexes[h];
            var tileKey = hex.q + ',' + hex.r;
            if (this.tiles[tileKey]) throw('Tiles must not intersect existing tiles');
            this.tiles[tileKey] = new Tile(hex.q, hex.r);
        }
        var tileKeys = Object.keys(this.tiles);
        if (tileKeys.length == TILE_COUNT) this.mode = MODE_PLACE;
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
        
        //Must be at end-of-line
        pos.q += dirQ;
        pos.r += dirR;
        var posKey = pos.q + ',' + pos.r;
        if (this.tiles[posKey]) {
            if (this.tiles[posKey].tokenId == EMPTY) {
                return {status: false, msg:'Must travel as far as possible on move line until reaching another token or edge'};
            }
        }
        
		return {status:true, msg:''};
	}
    
    isValidPlace(pos) {
        var perimeter = this.getPerimeter();                
        var posKey = pos.q + ',' + pos.r;
        if (!this.tiles[posKey]) return {status:false, msg:'Token must be placed on a tile'};
        
        if (!perimeter[posKey]) return {status:false, msg:'Token must be placed on the perimeter'};
        
        if (this.tokens.length >= INITIAL_TOKENS) return {status:false, msg:'Only two token may be placed initially'};
        
    	return {status:true, msg:''};
	}
    
    isValidTile(initialPos, tileRot) {
        var quadSplit = this.splitTileQuad(initialPos, tileRot);
        if (quadSplit.intersects) return {status:false, msg:'Tiles must not intersect existing tiles'};
        
        
        if (!this.isConnected(quadSplit.hexes)) return {status:false, msg:'Tiles must be connected when placed'};
            
    	return {status:true, msg:''};
	}
    
    isConnected(hexes) { //Driver function
        var breadcrumbs = {};
        var tiles = {};
        var tileKeys = Object.keys(this.tiles);
        var totalTiles = tileKeys.length;
        if (totalTiles <= 0) return true; //First gets a freebie   

        //Copy existing tiles
        for (var t = 0; t < totalTiles; t++) {
            var tileKey = tileKeys[t];
            tiles[tileKey] = true;
        }
            
        //Copy tile quad
        for (var h = 0; h < hexes.length; h++) {
            var pos = hexes[h];
            var posKey = pos.q + ',' + pos.r;            
            if (!tiles[posKey]) {
                tiles[posKey] = true;
                totalTiles++;
            }
        }         
        
        var initialPos = hexes[0];
        var initialPosKey = initialPos.q + ',' + initialPos.r;
        breadcrumbs[initialPosKey] = true;
        return this.isConnectedDFS(tiles, breadcrumbs, initialPos, totalTiles, [1]);
    }
    
    isConnectedDFS(tiles, breadcrumbs, pos, total, countRef) { //Recursive Depth-First-Search
        for (var dir = 0; dir < DIRECTIONS; dir++) {
            var neighQ = pos.q + NEIGHBORS_Q[dir];
            var neighR = pos.r + NEIGHBORS_R[dir];
            var neighKey = neighQ + ',' + neighR;
            if (tiles[neighKey] && !breadcrumbs[neighKey] ) {                
                var neighPos = new Pos(neighQ, neighR);
                breadcrumbs[neighKey] = true;
                countRef[0]++;
                if (countRef[0] == total) return true;
                var connected = this.isConnectedDFS(tiles, breadcrumbs, neighPos, total, countRef); //Recurse
                if (connected) return true;
            }
        }
        return false;
    }
    
    getPerimeter() { //Essentially equivalent to getPlaceMoves, but useful whenever the perimeter is needed
        
            
        var adjacentEdges = {};
        var tileKeys = Object.keys(this.tiles);
        for (var t = 0; t < tileKeys.length; t++) {
            var tileKey = tileKeys[t];
            var tile = this.tiles[tileKey];
            
            for (var dir = 0; dir < DIRECTIONS; dir++) {
                var neighQ = tile.pos.q + NEIGHBORS_Q[dir];
                var neighR = tile.pos.r + NEIGHBORS_R[dir];
                var neighKey = neighQ + ',' + neighR;
                
                if (!this.tiles[neighKey]) adjacentEdges[neighKey] = new Pos(neighQ, neighR);
                    
            }
        }
        
        //Perimeter (may) contain holes, so check adjacent edges to determine topography
        var perimeters = [];
        var longestPerimeterLength = INVALID;
        var longestPerimeterIndex = INVALID;
        var allBreadcrumbs = {};
        
        var adjacentEdgeKeys = Object.keys(adjacentEdges);
        for (var k = 0; k < adjacentEdgeKeys.length; k++) {
            var adjacentEdgeKey = adjacentEdgeKeys[k];
            if (allBreadcrumbs[adjacentEdgeKey]) continue;
            else allBreadcrumbs[adjacentEdgeKey] = true;
            
            var adjacentEdgePos = adjacentEdges[adjacentEdgeKey];
            var breadcrumbs = {};
            breadcrumbs[adjacentEdgeKey] = true;
            var perimeter = {};
            this.connectedEdgesBFS(adjacentEdgePos, adjacentEdges, perimeter, breadcrumbs, allBreadcrumbs);
            var perimeterKeys = Object.keys(perimeter);
            if (longestPerimeterLength < perimeterKeys.length) {
                longestPerimeterLength = perimeterKeys.length;
                longestPerimeterIndex = perimeters.length;
                perimeters.push(perimeter);
            }
        }
        
        if (longestPerimeterIndex == INVALID) throw ('Unable to get parameter');
        return perimeters[longestPerimeterIndex];   
    }
    
    connectedEdgesBFS(pos, edges, perimeterRef, breadcrumbsRef, allBreadcrumbsRef) { //Recursive Breadth-First-Search
        //Recursively find connected from pos
        for (var dir = 0; dir < DIRECTIONS; dir++) {
            var neighQ = pos.q + NEIGHBORS_Q[dir];
            var neighR = pos.r + NEIGHBORS_R[dir];            
            var neighKey = neighQ + ',' + neighR;
            if (edges[neighKey]) { //See if this is an edge              
                if (!breadcrumbsRef[neighKey]) {                      
                    breadcrumbsRef[neighKey] = true;
                    allBreadcrumbsRef[neighKey] = true;                    
                    var neighPos = edges[neighKey];
                    this.connectedEdgesBFS(neighPos, edges, perimeterRef, breadcrumbsRef, allBreadcrumbsRef); //Recurse                    
                }                
            }
            else if (this.tiles[neighKey]) {
                perimeterRef[neighKey] = true;
            }
        }        
    }

    getTileMoves() {
        var tileKeys = Object.keys(this.tiles);
        if (!tileKeys.length) {
            return [{pos: new Pos(0, 0), rot:0}]; //First move
        }
        var tileMoves = [];
        
        var perimeter = this.getPerimeter();
        var perimeterKeys = Object.keys(perimeter);
        
        //Look at tiles on the perimeter
        for (var k = 0; k < perimeterKeys.length; k++) {
            var perimeterKey = perimeterKeys[k];
            var tile = this.tiles[perimeterKey]; 
            
            //Find the neighboring edge from the perimeter            
            for (var dir = 0; dir < DIRECTIONS; dir++) {
                var neighQ = tile.pos.q + NEIGHBORS_Q[dir];
                var neighR = tile.pos.r + NEIGHBORS_R[dir];
                var neighKey = neighQ + ',' + neighR;
                
                if (!this.tiles[neighKey]) {
                    //See what tile quads might can be placed on the perimeter edge
                    var edgePos = new Pos(neighQ, neighR);
                    for (var r = 0; r < TILE_ROTATIONS; r++) {
                        var quadSplit = this.splitTileQuad(edgePos, r);
                        if (!quadSplit.intersects) {
                            var tileMove = {pos: edgePos, rot: r};
                            tileMoves.push (tileMove);
                        }
                    }
                    
                }
            }
        }
        
        return tileMoves;
    }
       
    getMoves() { //Because getMoveMoves would be ridiculous...
        var moves = [];
        
        var tokenIds = this.playerTokens[this.turn];
        for (var t = 0; t < tokenIds.length; t++) {
            var tokenId = tokenIds[t];
            var token = this.tokens[tokenId];
            if (token.count <= 1) continue; //Token can't be split further
            
            //Check neighbors to verify that at least one move is available            
            for (var dir = 0; dir < DIRECTIONS; dir++) {
                var neighQ = token.pos.q + NEIGHBORS_Q[dir];
                var neighR = token.pos.r + NEIGHBORS_R[dir];
                var neighKey = neighQ + ',' + neighR;
                
                //Traverse to the end of the line
                var stepCount = 1;
                while (stepCount < MAX_TRAVERSAL && this.tiles[neighKey] && this.tiles[neighKey].tokenId == EMPTY){
                    neighQ += NEIGHBORS_Q[dir];
                    neighR += NEIGHBORS_R[dir];
                    neighKey = neighQ + ',' + neighR;
                    stepCount++;
                }
                
                //Back-up one, and make sure EOL position is valid
                neighQ -= NEIGHBORS_Q[dir];
                neighR -= NEIGHBORS_R[dir];
                neighKey = neighQ + ',' + neighR;
                if (this.tiles[neighKey] && this.tiles[neighKey].tokenId == EMPTY) {
                    var move = {
                        src:new Pos(token.pos.q, token.pos.r),
                        dst:new Pos(neighQ, neighR),
                        count:token.count-1, //The represents the max available
                    };
                    moves.push(move);
                }
            }
            
        }        
        
        return moves;
    }
	
    normalize() { //Make the coords all positive
        
        //Traverse to find the min coords
        var minQ = Number.POSITIVE_INFINITY;
        var minR = Number.POSITIVE_INFINITY;
        
        var tileKeys = Object.keys(this.tiles);
        for (var t = 0; t < tileKeys.length; t++) {
            var tileKey = tileKeys[t];
            var tile = this.tiles[tileKey];
            if (tile.pos.q < minQ) minQ = tile.pos.q;
            if (tile.pos.r < minR) minR = tile.pos.r;		
        }
        minQ *= -1;
        minR *= -1;
        if (minQ == 0 && minR == 0) { //Already normalized
           //this.normalizeOffset = {q:0, r:0};
        }
        else {	
            //Loop again to offset
            var newTiles = {};
            for (var t = 0; t < tileKeys.length; t++) {
                var tileKey = tileKeys[t];
                var tile = this.tiles[tileKey];
               
                tile.pos.q += minQ;
                tile.pos.r += minR;
                
                if (tile.tokenId != EMPTY) {
                    var token = this.tokens[tile.tokenId];
                    token.pos.q += minQ;
                    token.pos.r += minR;
                }
                var newKey = tile.pos.q + ',' + tile.pos.r;
                newTiles[newKey] = tile;
                
            }
            this.tiles = newTiles;
            
            //this.normalizeOffset = {q:minQ, r:minR};
        }
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
        if (boardStr == PROTOCOL_TURN1) {
            board.mode = MODE_TILE;
            return board;
        }
        var pairs = boardStr.split(PROTOCOL_DELIM2);
        
        		
        //Turn - Should be last
        var turnStr = pairs[pairs.length-1];
        if (turnStr == PROTOCOL_TURN1) board.turn = PLAYER1;
        else if (turnStr == PROTOCOL_TURN2) board.turn = PLAYER2;
        else throw('Invalid board turn: ' + turnStr);
        
        
        //Tiles - Expect max 32
        var t;
        var tilePairs = Math.min(pairs.length-1, TILE_COUNT);        
        for (t = 0; t < tilePairs; t++) {
            var pair = pairs[t];
            if (!pair || pair == '') throw('Invalid board coordinate: ' + pair);
            var posArr = pair.split(PROTOCOL_DELIM1);
            var posKey = posArr[0] + ',' + posArr[1];
            var tile = new Tile(Number.parseInt(posArr[0]), Number.parseInt(posArr[1]));
            board.tiles[posKey] = tile;
            //NOTE: token id added after it's parsed in next step
        }
        
        if (tilePairs < TILE_COUNT) { //Still adding tiles - no tokens yet
            board.mode = MODE_TILE;
        }
        else { //Tokens -                      
            //Example: 0,2h
            if ((pairs.length - t) <= INITIAL_TOKENS) board.mode = MODE_PLACE;                 
            else board.mode = MODE_MOVE;
            
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
            
        }
		
        
        //Sanity check all tiles are connected  
        var tileKeys = Object.keys(board.tiles);
        var initialTile = board.tiles[tileKeys[0]];
        var initialHexes = [initialTile.pos]
        if (!board.isConnected(initialHexes)) throw ('Tiles must be connected when placed'); 

       //TODO: Normalize?
		return board;
	}
    
    
    parseAction = (actionStr) => { 
        var pairs = actionStr.split(PROTOCOL_DELIM2);
        if (this.mode == MODE_TILE) { //Example: 0,0|0,1|1,0|1,1
            if (pairs.length != 4) throw('Invalid tile action: ' + actionStr);
            var tileHexes = [];
            tileHexes.push(parseCoord(pairs[0]));
            tileHexes.push(parseCoord(pairs[1]));
            tileHexes.push(parseCoord(pairs[2]));
            tileHexes.push(parseCoord(pairs[3]));                        
            return {tileHexes:tileHexes};           
        }
        else if (this.mode == MODE_PLACE) { //Example: 
            if (pairs.length != 1) throw('Invalid place action: ' + actionStr);
            var pos = parseCoord(pairs[0]);                        
            return {pos:pos};
        }
        else if (this.mode == MODE_MOVE) { //Example: 2,1|6|4,-1           
            if (pairs.length != 3) throw('Invalid move action: ' + actionStr);
        
            //Source
            var src = parseCoord(pairs[0]);            
            
            //Count
            var count = Number.parseInt(pairs[1]);
            
            
            //Dest
            var dst = parseCoord(pairs[2]);          
            return {src:src, dst:dst, count:count};
        }
        else throw('Unable to parse action: ' + actionStr);
    }
    
    playToString = (play) => {
        var playStr = '';
        if (this.mode == MODE_TILE) {
            //Split tile quad into 4 individual hexes
            var quadSplit = this.splitTileQuad(play.pos, play.rot);
            var hexes = quadSplit.hexes;
            for (var h = 0; h < TILE_QUAD; h++) {
                var hex = hexes[h];
                playStr += hex.q + PROTOCOL_DELIM1 + hex.r;
                if (h+1 != TILE_QUAD) playStr += PROTOCOL_DELIM2;
            }
        }
        else if (this.mode == MODE_PLACE) {
            var pos = play.pos;
            playStr = pos.q + PROTOCOL_DELIM1 + pos.r;                
        }
        else if (this.mode == MODE_MOVE) {
            playStr = play.src.q + PROTOCOL_DELIM1 + play.src.r + PROTOCOL_DELIM2;
            playStr += play.count + PROTOCOL_DELIM2;
            playStr += play.dst.q + ',' + play.dst.r;    
        }
        else throw('Invalid mode: ' + this.mode);
        
        return playStr;        
    }
    
    splitTileQuad(initialPos, tileRot) { //Split into 4 individual hexes
        var hexes = [];
        var tileQuadDirs = TILE_QUADS_BY_ROT[tileRot];
        var pos = new Pos(initialPos.q, initialPos.r);
        var posKey = pos.q + ',' + pos.r;
        hexes.push(pos);
        var intersects = false;
        if (this.tiles[posKey]) intersects = true;
        for (var d = 0; d < tileQuadDirs.length; d++) { //Should always only be three
            var dir = tileQuadDirs[d];
            var q = initialPos.q + NEIGHBORS_Q[dir];
            var r = initialPos.r + NEIGHBORS_R[dir];
            var pos = new Pos(q, r);
            var posKey = q + ',' + r;
            hexes.push(pos);
            if (this.tiles[posKey]) intersects = true;
        }
        return {hexes: hexes, intersects: intersects};
    }
    
    joinTileQuad(hexes) { //Combine 4 individual hexes into 1 tile quad, with an initial position and rotation
        var hexGrid = {};
        var hexKeys = [];
        for (var h = 0; h < TILE_QUAD; h++) {
            var hex = hexes[h];
            var hexKey = hex.q + ',' + hex.r;
            hexKeys.push(hexKey);
            hexGrid[hexKey] = true;
        }
        
        for (var h = 0; h < TILE_QUAD; h++) {
            var pos = hexes[h];
            
            //Loop through neighbors
            var neighborDirs = [];
            for (var dir = 0; dir < DIRECTIONS; dir++) {
                var neighQ = pos.q + NEIGHBORS_Q[dir];
                var neighR = pos.r + NEIGHBORS_R[dir];
                var neighKey = neighQ + ',' + neighR;
                if (hexGrid[neighKey]) neighborDirs.push(dir);                    
            }
            if (neighborDirs.length == 3) {
                var initialPos = pos;
                var rot = neighborDirs[1];
                return {pos:initialPos, rot:rot};
            }
        }
        
        throw('Unable to join individual hexes into single tile quad');
    }
        
    /*
    score() {
        
        var p1Score = 0;
        var p2Score = 0;
        
         //Tokens
        for (var tokenId = 0; tokenId < this.tokens.length; tokenId++) {
            var token = this.tokens[tokenId];
            
            //Get empty neighbors 
            var emptyCount = 0;
            for (var dir = 0; dir < DIRECTIONS; dir++) {
                var neighQ = token.pos.q + NEIGHBORS_Q[dir];
                var neighR = token.pos.r + NEIGHBORS_R[dir];
                var neighKey = neighQ + ',' + neighR;
                if (this.tiles[neighKey] && this.tiles[neighKey].tokenId == EMPTY) {
                    emptyCount++;
                }                
            }
            
            if (token.player == PLAYER1) p1Score += (token.count*emptyCount);
            else p2Score += (token.count*emptyCount);
        }
        
        if (this.turn == PLAYER1) return p1Score - p2Score;
        else return p2Score - p1Score;        
    }
    */
    
    getConnectedCount(pos) {
        var count = 0;
        //Get the lines in all six directions
        for (var dir = 0; dir < DIRECTIONS; dir++) {
            var stepQ = pos.q;
            var stepR = pos.r;
                                                            
            for (var steps = 0; steps < TILE_COUNT; steps++ ){ //Should never really by this many steps
                stepQ += NEIGHBORS_Q[dir];
                stepR += NEIGHBORS_R[dir];
                var stepKey = stepQ + ',' + stepR;
                //Make sure spot is a valid un-occupied tile
                if (this.tiles[stepKey] && this.tiles[stepKey].tokenId == EMPTY) {                                            
                    count++;                    
                }
                else break;
            }
        }     
        return count;
    }
    
    getRandPlay() {
        //Tile
        if (this.mode == MODE_TILE) {
            if (Object.keys(this.tiles).length <= 0) {
                return {pos:{q:0, r:1}, rot:4};
            }
            var tileMoves = this.getTileMoves();
            if (tileMoves.length <= 0) throw ('No tile moves available');
            
            var randPlay = tileMoves[Math.floor(Math.random() * tileMoves.length)];	
            
            return randPlay;
            
        }
        
        //Place
        else if (this.mode == MODE_PLACE) {
            var perimeter = this.getPerimeter();                
            var perimeterKeys = Object.keys(perimeter);        
            if (!perimeterKeys.length) throw('No place moves available');
            
            var randKey = perimeterKeys[Math.floor(Math.random() * perimeterKeys.length)];
            var tile = this.tiles[randKey];
            var pos = new Pos(tile.pos.q, tile.pos.r);
            var randPlay = {pos: pos};
            
            return randPlay;
        }
        
        //Move
        else if (this.mode == MODE_MOVE) {
                
            var moves = this.getMoves();    
            if (!moves.length) throw ('No moves available');    
            
            var randPlay = moves[Math.floor(Math.random() * moves.length)];	//Random spot	
            randPlay.count = Math.floor(Math.random() * randPlay.count)+1 //Random split
            
            return randPlay;
            
        }
    }
}

function parseCoord(coordStr) {    
    var coordArr = coordStr.split(PROTOCOL_DELIM1);
    if (coordArr.length != 2) throw('Error parsing coordinate: ' + coordStr);
    return new Pos(Number.parseInt(coordArr[0]), Number.parseInt(coordArr[1]));
}