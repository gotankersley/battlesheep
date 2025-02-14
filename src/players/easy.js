import { Pos, MODE_PLACE, MODE_MOVE, MODE_TILE } from '../core/board.js';

const INFINITY = 1000000;
//Easy Player
export function getPlay (board, onPlayed) {

    //Tile - Random
    if (board.mode == MODE_TILE) {
        var tileMoves = board.getTileMoves();
        if (tileMoves.length <= 0) throw ('No tile moves available');
        
        var randPlay = tileMoves[Math.floor(Math.random() * tileMoves.length)];	
        
        onPlayed(randPlay);
        
    }
    
    //Place - Random
    else if (board.mode == MODE_PLACE) {
        var perimeter = board.getPerimeter();                
        var perimeterKeys = Object.keys(perimeter);        
        if (!perimeterKeys.length) throw('No place moves available');
        
        var randKey = perimeterKeys[Math.floor(Math.random() * perimeterKeys.length)];
        var tile = board.tiles[randKey];
        var pos = new Pos(tile.pos.q, tile.pos.r);
        var randPlay = {pos: pos};
        
        onPlayed(randPlay);
    }
    
    //1 Ply brute-force lookahead
    else if (board.mode == MODE_MOVE) {
            
        var moves = board.getMoves();    
        if (!moves.length) throw ('No moves available');    
        var bestScore = INFINITY;
        var bestMove = null;
        
        for (var m = 0; m < moves.length; m++) {
            var move = moves[m];
            //Check combinations
            for (var c = 1; c <= move.count; c++){
                var boardCopy = board.clone();
                boardCopy.makeMove(move.src, move.dst, c);
                var playerMoves = boardCopy.getMoves();
                var playerMoveCount = playerMoves.length;
                var playerTokenCount = boardCopy.playerTokens[boardCopy.turn].length;
                
                boardCopy.changeTurn();                
                var oppMoves = boardCopy.getMoves();
                var oppMoveCount = oppMoves.length; 
                var oppTokenCount = boardCopy.playerTokens[boardCopy.turn].length;
                
                var score = playerMoveCount == 0? 100 : oppMoveCount/playerMoveCount;
                score += playerTokenCount-oppTokenCount;
                
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = {src: move.src, dst: move.dst, count:c};
                }
            }
        }
        
        if (bestMove) onPlayed(bestMove);        
        else throw('No moves available');         
	}
	else throw('Invalid Board Mode: ' + board.mode);
    	

}


