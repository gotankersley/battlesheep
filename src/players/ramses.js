import { INVALID } from '../lib/hex-lib.js';
import { Pos, MODE_PLACE, MODE_MOVE, MODE_TILE, DIRECTIONS, TILE_COUNT, PLAYER1, PLAYER2 } from '../core/board.js';
import { GraphBoard, BB_SIZE, cloneBitboard, LOOP, IDX, ALL_TOKENS } from '../core/graph-board.js';


const SIMS_PER_MOVE = 1000;
const INFINITY = 1000000;
const DEBUG = true;


const SIM_WIN = 1;
const SIM_LOSE = -1;
const SIM_TIE = 0; 

var graphBoard;

//Ramses Player
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
            
            var score = board.getConnectedCount(pos);
                
            if (score > bestScore) {
                bestScore = score;
                bestPlay = {q:pos.q, r:pos.r};
            }
        }
                        
        if (bestPlay) onPlayed({pos: bestPlay});
        else throw('No plays available');         
    }
    
    //Flat Monte-Carlo simulation
    else if (board.mode == MODE_MOVE) {
        

        var bb = new Uint32Array(BB_SIZE);
        graphBoard = new GraphBoard(board, bb);        
        
        
        var moves = board.getMoves();    
        if (!moves.length) throw ('No moves available');    
        var bestScore = -INFINITY;
        var bestMove = null;
        var curTurn = board.turn;
        var oppTurn = +(!curTurn);
        
        var startCounts = new Uint32Array(TILE_COUNT); 
        for (var tid = 0; tid < TILE_COUNT; tid++) {
            startCounts[tid] = graphBoard.counts[tid];
        }
        
        //Loop through all moves
        for (var m = 0; m < moves.length; m++) {
            var move = moves[m];
            
            //Loop through counts
            for (var c = 1; c < move.count; c++){ 
                var bbCopy = cloneBitboard(bb);
                var srcTid = graphBoard.posToTid[move.src.q + ',' + move.src.r];
                var dstTid = graphBoard.posToTid[move.dst.q + ',' + move.dst.r];
                graphBoard.makeMove(bbCopy, curTurn, srcTid, dstTid, c);

                var score = 0;
                for (var s = 0; s < SIMS_PER_MOVE; s++) {        
                    //Note: Since we are starting one level deep, start simulating from oppTurn                
                    score += simulate(bbCopy, curTurn, oppTurn); 
                    
                    //Restore counts - *sigh*
                    for (var tid = 0; tid < TILE_COUNT; tid++) {
                        graphBoard.counts[tid] = startCounts[tid];
                    } //End restore counts loop                    
                } //End simulate loop                
                 
                //console.log(move, c, srcTid, dstTid, score);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {src: move.src, dst: move.dst, count:c};
                }
            }//End counts loop
        } //End moves loop
                
            
        console.log('Best: ', bestScore, bestMove);
        if (bestMove) onPlayed(bestMove);        
        else if (bestScore == -INFINITY) {
            console.log('All moves lead to loss - chosing random');
            onPlayed(board.getRandPlay());
        }
        else throw('No moves available');        
	}
    
	else throw('Invalid Board Mode: ' + board.mode);
    	
}

function simulate(bb, rootTurn, turn) {                    
    
    for (var i = 0; i < TILE_COUNT; i++) {
        var moves = []; //Is there not a better way?
        
        //Loop through all tokens
        var bits = new Uint32Array(BB_SIZE+1);    
        bits[LOOP] = bb[turn];    
        bits[ALL_TOKENS] = bb[PLAYER1] | bb[PLAYER2];
        while (bits[LOOP]) {
            bits[IDX] = bits[LOOP] & -bits[LOOP]; //Isolate least significant bit
            var tokenTid = Math.log2(bits[IDX]); 
            bits[LOOP] &= bits[LOOP]-1; //Required to avoid infinite looping...
            
            if (graphBoard.counts[tokenTid] <= 1) continue; //If token can't be split            
            
            //Loop all directions
            for (var dir = 0; dir < DIRECTIONS; dir++) {
                
                var stepTid = tokenTid;
                //Step in line as far as possible to find moves
                for (var steps = 0; steps < TILE_COUNT; steps++ ){ //Should never really be this many steps
                    var connectedTid = graphBoard.graph[stepTid][dir];                
                    if (connectedTid != INVALID && !(bits[ALL_TOKENS] & (1 << connectedTid))) stepTid = connectedTid; //Traverse while valid tile that's un-occupied
                    else {
                        //EOL Move position found
                        if (stepTid == tokenTid) break; //Haven't actually gone anywhere                        
                        
                        //Loop through possible counts
                        var srcTid = tokenTid;
                        var dstTid = stepTid;
                        var count = graphBoard.counts[srcTid];
                        
                        moves.push({src:srcTid, dst:dstTid, c:count});
                                       
                        break; //Exit step loop
                    } //End EOL position found
                } //End step loop
                
            }//End directions loop                   
        } //End tokens loop
            
        
        if (!moves.length) {
            if (turn == rootTurn) return SIM_LOSE;
            else return SIM_WIN;
        }
        else { //Play random
            var randIdx = Math.floor(Math.random() * moves.length);
            var randMove = moves[randIdx];
            var randCount = Math.random() * randMove.c;
            graphBoard.makeMove(bb, turn, randMove.src, randMove.dst, randCount);
            
            turn = +(!turn); //Change turn
        }
    }
    return SIM_TIE;
}
    