import { Pos, MODE_PLACE, MODE_MOVE, MODE_TILE } from '../core/board.js';
import { Bitboard } from '../core/bitboard.js';

const SIMS_PER_MOVE = 1;
const INFINITY = 1000000;

//Rambo Player
export function getPlay (board, onPlayed) {

    //Tile - Random
    if (board.mode == MODE_TILE) {
        var tileMoves = board.getTileMoves();
        if (tileMoves.length <= 0) throw ('No tile moves available');
        
        //Just pick a random tiling - who even knows?!?!
        var randPlay = tileMoves[Math.floor(Math.random() * tileMoves.length)];	
        
        onPlayed(randPlay);
        
    }
    
    //Place - Heuristic to avoid being trapped
    else if (board.mode == MODE_PLACE) {
        var bestScore = -INFINITY;
        var bestPlay = null;
        
        var perimeter = board.getPerimeter();                
        var perimeterKeys = Object.keys(perimeter);        
        if (!perimeterKeys.length) throw('No place moves available');
        
        for (var p = 0; p < perimeterKeys.length; p++){
            var posKey = perimeterKeys[p];
            var pos = board.tiles[posKey].pos;
            var boardCopy = board.clone();
            boardCopy.makePlace(pos);
            
            var score = boardCopy.score();
                
            if (score > bestScore) {
                bestScore = score;
                bestPlay = {q:pos.q, r:pos.r};
            }
        }
                        
        if (bestPlay) onPlayed(bestPlay);
        else throw('No plays available');         
    }
    
    //Flat Monte-Carlo simulation
    else if (board.mode == MODE_MOVE) {

        var posToTid = {}; //Create here to convert posKeys back to TIDs 
        var bbRoot = Bitboard.fromBoard(board, posToTid);
        
        var moves = board.getMoves();    
        if (!moves.length) throw ('No moves available');    
        var bestScore = -INFINITY;
        var bestMove = null;
        var curPlayer = board.turn;
        var oppPlayer = +(!curPlayer);
        
        //Loop through all moves
        for (var m = 0; m < moves.length; m++) {
            var move = moves[m];
            
            //Check combinations
            for (var c = 1; c <= move.count; c++){
                var score = 0;
                var bbChild = bbRoot.clone();
                var srcTid = posToTid[move.src.q + ',' + move.src.r];
                var dstTid = posToTid[move.dst.q + ',' + move.dst.r];
                bbChild.makeMove(srcTid, dstTid, c, curPlayer);                
                
                for (var s = 0; s < SIMS_PER_MOVE; s++) {
                    var bb = bbChild.clone(); //Copy to mutate
                    score += bb.simulate(oppPlayer, curPlayer);
                }
                
                if (score > bestScore) {
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


