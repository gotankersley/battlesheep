import { Pos, MODE_PLACE, MODE_MOVE, MODE_TILE, DIRECTIONS } from '../core/board.js';
import { GraphBoard, BB_SIZE, cloneBitboard } from '../core/graph-board.js';


const MAX_DEPTH = 6;
const INFINITY = 1000000;
const DEBUG = true;

const LOOP = 0;
const IDX = 1;

//Working variables - since the main negamax fn is recursive, it's convenient for them to be global
var bestRootState = null;

var graphBoard;
var totalNodes = 0;

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
            
            var score = board.getConnectedCount(pos);
                
            if (score > bestScore) {
                bestScore = score;
                bestPlay = {q:pos.q, r:pos.r};
            }
        }
                        
        if (bestPlay) onPlayed({pos: bestPlay});
        else throw('No plays available');         
    }
    
    //Alpha Beta search
    else if (board.mode == MODE_MOVE) {
        bestRootState = null;        
        totalNodes = 0;

        var bb = new Uint32Array(BB_SIZE);
        graphBoard = new GraphBoard(board, bb);
        var turn = board.turn;
        
        var bestScore = negamax(bb, -INFINITY, INFINITY, 0, turn);
                             
        if (bestRootState) {
            //Convert TID's back Axial coordinates
            var bestMove = {
                src: graphBoard.tidToPos[bestRootState.src],
                dst: graphBoard.tidToPos[bestRootState.dst],
                count: bestRootState.c,
            };
            console.log('Best: ', bestScore, bestRootState, bestMove);
            onPlayed(bestMove);        
        }
        else throw('No moves available');         
	}
	else throw('Invalid Board Mode: ' + board.mode);
    	
}


//Recursive Alpha-Beta tree search	
function negamax (bb, alpha, beta, depth, turn) { 						
        
    //Anchor
    if (depth >= MAX_DEPTH) { //Max depth - Score	
        return 0; //TODO - score
    }
    
    //Loop through child states
    var bestScore = -INFINITY- depth;        
        
    //Loop through all tokens
    var bits = new Uint32Array(BB_SIZE);    
    bits[LOOP] = bb[turn];        
    while (bits[LOOP]) {
        bits[IDX] = bits[LOOP] & -bits[LOOP]; // isolate least significant bit
        var tokenTid = Math.log2(bits[IDX]); 
        
        //Loop all directions
        for (var dir = 0; dir < DIRECTIONS; dir++) {
            
            var stepTid = tokenTid;
            //Step in line as far as possible to find moves
            for (var steps = 0; steps < TILE_COUNT; steps++ ){ //Should never really be this many steps
                var connectedTid = graphBoard.graph[stepTid][dir];
                if (connectedTid != INVALID) stepTid = connectedTid; //Traverse
                else {
                    //EOL Move position found
                    if (stepTid == tokenTid) break; //Haven't actually gone anywhere
                    
                    //Loop through possible counts
                    var srcTid = tokenTid;
                    var dstTid = stepTid;
                    var count = graphBoard.counts[srcTid];
                    for (var c = 1; c <= count; c++){
                        totalNodes++;
                        
                        //Copy board
                        var bbCopy = cloneBitboard(bb);
                        graphBoard.makeMove(bb, turn, srcTid, dstTid, c);
                        
                        //TODO - win check and turn change
                        var recursedScore = negamax(bbCopy, -beta, -Math.max(alpha, bestScore), depth+1, turn); //Swap cur player as we descend
                        var currentScore = -recursedScore;
                        
                        graphBoard.unMakeMove(srcTid, dstTid, c);
                            
                        if (currentScore > bestScore) { 
                            bestScore = currentScore;			
                            if (depth == 0) {                                
                                bestRootState = {src:srcTid, dst:dstTid, c:c};
                            }   
                            if (bestScore >= beta) return bestScore;//AB cut-off
                        }	
                    }
                    
                    break; //Exit step loop
                }
            }
            
        }//End directions loop
        
        bits[LOOP] &= bits[LOOP]-1; //Required to avoid infinite looping...
    } //End tokens loop
           
    
    return bestScore;
}


