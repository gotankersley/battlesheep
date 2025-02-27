import { INVALID, Hex } from '../lib/hex-lib.js';
import { PLAYER1, PLAYER2, TILE_COUNT, NEIGHBORS_Q, NEIGHBORS_R, EMPTY, DIRECTIONS } from './board.js';

//ABOUT: This is an optimized version of the board used by the AI to ease the computational burden
//of exploring various move posibilities. 
//NOTE: This is not intended to be used for the "TILE" mode


const BB_SIZE = 2;

const P1 = 0;
const P2 = 1;


export class GraphBoard {
    constructor(board, bb) {

        bb = new Uint32Array(BB_SIZE); //Ref
        this.counts = new Uint32Array(TILE_COUNT); 
        
        //Adjacency Matrix - [TID| DIR N, DIR NE, ... , DIR NW]
        this.graph = new Array(TILE_COUNT); //Not unsigned, because we want to store INVALID id's        
        
        //NOTE: In lieu of coordinates, we will assign each tile an arbitrary tile id (TID)    
        var tileKeys = Object.keys(board.tiles);    
        this.tidToPos = tileKeys; //This is the map from TID's back to position keys - Store to be paranoid that TID order doesn't change   
        if (tileKeys.length != TILE_COUNT) throw('Expected ' + TILE_COUNT + ' tiles, instead received ' + tileKeys.length);
            
        var posToTid = {}; 
        for (var tid = 0; tid < TILE_COUNT; tid++) {
            var tileKey = tileKeys[tid];
            posToTid[tileKey] = tid;
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
                                                                
                for (var steps = 0; steps < TILE_COUNT; steps++ ){ //Should never really be this many steps
                    stepQ += NEIGHBORS_Q[dir];
                    stepR += NEIGHBORS_R[dir];
                    var stepKey = stepQ + ',' + stepR;
                    
                    if (board.tiles[stepKey]) {
                        var otherTid = posToTid[stepKey];
                        this.graph[tid][dir] = otherTid;
                    }
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



}
    
    
export function cloneBitboard(bb) {
    var newBitboard = new Uint32Array(BB_SIZE);
    newBitboard[PLAYER1] = bb[PLAYER1];
    newBitboard[PLAYER2] = bb[PLAYER2];
    return newBitboard;
}



