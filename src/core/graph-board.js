import { INVALID, Hex } from '../lib/hex-lib.js';
import { PLAYER1, PLAYER2, TILE_COUNT, NEIGHBORS_Q, NEIGHBORS_R, EMPTY, DIRECTIONS } from './board.js';

//ABOUT: This is an optimized version of the board used by the AI to ease the computational burden
//of exploring various move posibilities. 
//NOTE: This is not intended to be used for the "TILE" mode


export const BB_SIZE = 2;


export const LOOP = 0;
export const IDX = 1;
export const ALL_TOKENS = 2;

export class GraphBoard {
    constructor(board, bb) {
        
        this.counts = new Uint32Array(TILE_COUNT); 
        
        //Adjacency Matrix - [TID| DIR N, DIR NE, ... , DIR NW]
        this.graph = new Array(TILE_COUNT); //Not unsigned, because we want to store INVALID id's        
        
        //NOTE: In lieu of coordinates, we will assign each tile an arbitrary tile id (TID)    
        var tileKeys = Object.keys(board.tiles);    
        this.tidToPos = tileKeys; //This is the map from TID's back to position keys - Store to be paranoid that TID order doesn't change   
        if (tileKeys.length != TILE_COUNT) throw('Expected ' + TILE_COUNT + ' tiles, instead received ' + tileKeys.length);
            
        this.posToTid = {}; 
        for (var tid = 0; tid < TILE_COUNT; tid++) {
            var tileKey = tileKeys[tid];
            this.posToTid[tileKey] = tid;
            this.graph[tid] = new Array(DIRECTIONS).fill(INVALID);
        }
        
        //Set up the connections in the graph
        for (var tid = 0; tid < TILE_COUNT; tid++) {
            var tileKey = tileKeys[tid];
            var tile = board.tiles[tileKey];	            
                
            //Tokens
            if (tile.tokenId != EMPTY) {
                var token = board.tokens[tile.tokenId];
                this.counts[tid] = token.count; //Counts
                bb[token.player] |= (1 << tid);
            }        
                
            //Get the lines in all six directions
            for (var dir = 0; dir < DIRECTIONS; dir++) {
                var stepQ = tile.pos.q;
                var stepR = tile.pos.r;
                var stepKey = stepQ + ',' + stepR;                
                var prevTid = this.posToTid[stepKey];
                for (var steps = 0; steps < TILE_COUNT; steps++ ){ //Should never really be this many steps
                    stepQ += NEIGHBORS_Q[dir];
                    stepR += NEIGHBORS_R[dir];
                    stepKey = stepQ + ',' + stepR;
                    
                    if (board.tiles[stepKey]) {
                        var stepTid = this.posToTid[stepKey];
                        this.graph[prevTid][dir] = stepTid;
                        prevTid = stepTid;
                    }
                    else break;
                } //End step loop
            } //End directions loop
        } //End TID loop   
        
                   
    } //End constructor
    

    makeMove(bb, turn, srcTid, dstTid, count) {        
                    
        //if (this.counts[srcTid] <= 1) { //Remove from player tokens
        //    bb[turn] ^= (1 << srcTid);
        //} 
        bb[turn] |= (1 << dstTid); //Create new token at dest        
        this.counts[dstTid] = count; //Create new stack at dest
        this.counts[srcTid] -= count; //Remove count from source
    }

    undoCount(srcTid, dstTid, count) {
        //Note: this is necessary because we are making the (questionable) choice
        //to be chintzy with memory WRT the counts, and un-setting it after use.
        //Yes, live by the sword, die by the sword...
        this.counts[dstTid] = 0; //
        this.counts[srcTid] += count; //Add count back
    }

    scoreBitboard(bb, turn) {
        var score = 0;
        
        //Loop through all tokens
        
        var bits = new Uint32Array(BB_SIZE+1);    
        bits[LOOP] = bb[turn];        
        bits[ALL_TOKENS] = bb[PLAYER1] | bb[PLAYER2];
        while (bits[LOOP]) {
            bits[IDX] = bits[LOOP] & -bits[LOOP]; //Isolate least significant bit
            var tokenTid = Math.log2(bits[IDX]); 
            bits[LOOP] &= bits[LOOP]-1; //Required to avoid infinite looping...
            
            var tokenHasMoveAvail = false;
            if (this.counts[tokenTid] <= 1) continue; //If token can't be split    
            
            
            //Loop all directions
            for (var dir = 0; dir < DIRECTIONS; dir++) {
                
                var stepTid = tokenTid;
                //Step in line as far as possible to find moves
                for (var steps = 0; steps < TILE_COUNT; steps++ ){ //Should never really be this many steps
                    var connectedTid = this.graph[stepTid][dir];
                    if (connectedTid != INVALID && !(bits[ALL_TOKENS] & (1 << connectedTid))) stepTid = connectedTid; //Traverse
                    else {
                        //EOL Move position found
                        if (stepTid == tokenTid) break; //Haven't actually gone anywhere
                        
                        //Loop through possible counts
                        var srcTid = tokenTid;
                        var dstTid = stepTid;
                        score += this.counts[srcTid];
                        
                        tokenHasMoveAvail = true;
                        break; //Exit step loop
                    } //End EOL position found
                } //End step loop
            }//End directions loop
            
            if (!tokenHasMoveAvail) score -= Math.pow(this.counts[tokenTid], 2); //Penalize trapped
        } //End tokens loop  
        
        
        return score;
    }        
}
    
    
export function cloneBitboard(bb) {
    var newBitboard = new Uint32Array(BB_SIZE);
    newBitboard[PLAYER1] = bb[PLAYER1];
    newBitboard[PLAYER2] = bb[PLAYER2];
    return newBitboard;
}

