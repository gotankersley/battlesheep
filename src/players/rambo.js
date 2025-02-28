import { INVALID } from '../lib/hex-lib.js';
import { Pos, MODE_PLACE, MODE_MOVE, MODE_TILE, DIRECTIONS, TILE_COUNT, PLAYER1, PLAYER2 } from '../core/board.js';
import { GraphBoard, BB_SIZE, cloneBitboard, LOOP, IDX, ALL_TOKENS } from '../core/graph-board.js';


const MAX_DEPTH = 5;
const INFINITY = 1000000;
const DEBUG = true;




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
            var srcKey = graphBoard.tidToPos[bestRootState.src];
            var dstKey = graphBoard.tidToPos[bestRootState.dst];
            var src = board.tiles[srcKey].pos;
            var dst = board.tiles[dstKey].pos;
            
            var bestMove = {
                src: new Pos(src.q, src.r),
                dst: new Pos(dst.q, dst.r),
                count: bestRootState.c,
            };
            if (DEBUG) {
                console.log('Best: ', bestScore, bestRootState, bestMove);
                console.log('Total Nodes: ', totalNodes);
            }
            
            onPlayed(bestMove);        
        }
        else if (bestScore == -INFINITY) {
            console.log('All moves lead to loss - chosing random');
            onPlayed(board.getRandPlay());
        }
        else throw('No moves available');         
	}
	else throw('Invalid Board Mode: ' + board.mode);
    	
}


//Recursive Alpha-Beta tree search	
function negamax (bb, alpha, beta, depth, turn) { 						
           
    var bestScore = -INFINITY - depth;        
    var hasMoveAvail = false;
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
                    //else if ( (bits[ALL_TOKENS] & (1 << stepTid))) break; //Occupied
                    
                    //Loop through possible counts
                    var srcTid = tokenTid;
                    var dstTid = stepTid;
                    var count = graphBoard.counts[srcTid];
                    for (var c = 1; c < count; c++){
                    //for (var c = count-1; c < count; c++){ //Max
                        totalNodes++;
                        hasMoveAvail = true;
                        //Copy board
                        var bbCopy = cloneBitboard(bb);
                        graphBoard.makeMove(bb, turn, srcTid, dstTid, c);
                      
                        //Anchor
                        var oppTurn = +(!turn);
                        var currentScore;
                        if (depth+1 >= MAX_DEPTH) { //Max depth - Score	
                            
                            var curScore = graphBoard.scoreBitboard(bb, turn); 
                            var oppScore = graphBoard.scoreBitboard(bb, oppTurn); 
                            currentScore = curScore - oppScore;

                            //console.log('Depth', depth, 'src', srcTid, 'dst', dstTid, 'count', c, 'score', currentScore);                           
                            //console.log('src', srcTid, 'dst', dstTid, 'count', c, 'score', currentScore);                           
                        }
                        else { //We have no recourse but to Recurse...
                            var recursedScore = negamax(bbCopy, -beta, -Math.max(alpha, bestScore), depth+1, oppTurn); //Swap cur player as we descend
                            currentScore = -recursedScore;
                        }
                        
                        graphBoard.undoCount(srcTid, dstTid, c);
                        
                        //Terminal condition
                        //if (recursedScore == -INFINITY) return INFINITY;
                        
                                                 
                        if (currentScore > bestScore) { 
                            bestScore = currentScore;			
                            if (depth == 0) {                                
                                bestRootState = {src:srcTid, dst:dstTid, c:c};
                            }   
                            if (bestScore >= beta) return bestScore;//AB cut-off
                        }	
                    }
                    
                    break; //Exit step loop
                } //End EOL position found
            } //End step loop
            
        }//End directions loop
                
    } //End tokens loop
           
    if (!hasMoveAvail) return -INFINITY; //Loss
    
    return bestScore;
}


