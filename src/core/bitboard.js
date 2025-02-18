import { INVALID, Hex } from '../lib/hex-lib.js';
import { PLAYER1, PLAYER2, TILE_COUNT, NEIGHBORS_Q, NEIGHBORS_R, EMPTY, DIRECTIONS } from './board.js';

//ABOUT: This is an optimized version of the board used by the AI to ease the computational burden
//in exploring various move posibilities. 
//NOTE: This is intended to specifically be used for the "MOVE" mode,
//and not for the "TILE" and "PLACE" modes.

const LOOP1 = 0;
const LOOP2 = 1;
const IDX1 = 2;
const IDX2 = 3;
const TO_REMOVE = 4;


const RAND_TOKEN = 0;
const RAND_DEST = 1;

const OPP_DIRECTIONS = [3,4,5,0,1,2];

const SIM_WIN = 1;
const SIM_LOSE = -1;
const SIM_TIE = 0; //IDK if this is possible...

export class Bitboard {
    constructor() {
        //Data structures optimized to use bitwise operations
        this.connections = new Uint32Array(TILE_COUNT); //Adjacency-Matrix
        this.playerTokens = new Uint32Array(2); //[PLAYER1, PLAYER2]
        this.counts = new Array(TILE_COUNT); //Not unsigned, because we want to store INVALID counts
        this.lines = new Array(TILE_COUNT); //Partitioned by TID index, this is the line of TIDs going in each hex cardinal direction
                
        //Note: No mode, or turn (See above)
    }
    
    clone() {
        var bitboard = new Bitboard();
        for (var tid = 0; t < TILE_COUNT; t++) {
            bitboard.connections[tid] = this.connections[tid];
            bitboard.counts[tid] = this.counts[tid];  
            bitboard.lines[tid] = new Uint32Array(DIRECTIONS);
                        
            for (var dir = 0; dir < DIRECTIONS; d++) {
                bitboard.lines[tid][dir] = board.lines[tid][dir];
            }
        }
        
        bitboard.playerTokens[PLAYER1] = this.playerTokens[PLAYER1];
        bitboard.playerTokens[PLAYER2] = this.playerTokens[PLAYER2];
                
        return bitboard;
        
    }
    
    //Precalculate connections and dependencies
    static fromBoard(board, posToTid) {
        var bitboard = new Bitboard();
        
        //NOTE: In lieu of coordinates, we will assign each tile an arbitrary tile id (TID),
        //which corresponds to the indices the data structure arrays, and the bits in the unsigned int-32 bitflags        
        var tileKeys = Object.keys(board.tiles);
        if (tileKeys.length != TILE_COUNT) throw('Expected ' + TILE_COUNT + ' tiles, instead received ' + tileKeys.length);
        
        for (var tid = 0; tid < TILE_COUNT; tid++) {
            var tileKey = tileKeys[tid];
            posToTid[tileKey] = tid;
        }
        
        for (var tid = 0; tid < TILE_COUNT; tid++) {
            var tileKey = tileKeys[tid];
            var tile = board.tiles[tileKey];	
            
            //Tokens
            if (tile.tokenId != EMPTY) {
                var token = board.tokens[tile.tokenId];
                bitboard.counts[tid] = token.count; //Counts
                if (token.count > 1) {
                    bitboard.playerTokens[token.player] |= (1 << tid); //Add token                
                }
            }
            else bitboard.counts[tid] = INVALID; //No associated token, so there is no count
            
            
            //Lines - used for get available moves
            bitboard.lines[tid] = new Uint32Array(DIRECTIONS);

            
            //Get the lines in all six directions
            for (var dir = 0; dir < DIRECTIONS; dir++) {
                var stepQ = tile.pos.q;
                var stepR = tile.pos.r;
                                                                
                for (var steps = 0; steps < TILE_COUNT; steps++ ){ //Should never really by this many steps
                    stepQ += NEIGHBORS_Q[dir];
                    stepR += NEIGHBORS_R[dir];
                    var stepKey = stepQ + ',' + stepR;
                    //Make sure spot is a valid un-occupied tile
                    if (board.tiles[stepKey] && board.tiles[stepKey].tokenId == EMPTY) {                                            
                        var otherTid = posToTid[stepKey]; 
                        bitboard.lines[tid][dir] |= (1 << otherTid);
                        bitboard.connections[tid] |= (1 << otherTid);
                        //Note - The active partition tile TID is not included in any of the lines
                    }
                    else break;
                }
            }
            
            
            
        }
                    
        return bitboard;
    }
    
    
    simulate(turn, curPlayer) {                    
        
        for (var i = 0; i < TILE_COUNT; i++) {
            var hasMoves = this.randMove(turn);
            if (!hasMoves) {
                if (turn == curPlayer) return SIM_LOSE;
                else return SIM_WIN;
            }
            else turn = +(!turn); //Change turn
        }
        return SIM_TIE;
    }
    
    
    randMove(turn) {        
        if (!this.playerTokens[turn]) return false;
        var bits = new Uint32Array(RAND_DEST+1);
        
        //Get a random source token
        bits[RAND_TOKEN] = this.playerTokens[turn];        
        var srcTid = getRandBit(bits, RAND_TOKEN);        
        
        //Get a random destination
        if (!this.connections[srcTid]) return false;
        bits[RAND_DEST] = this.connections[srcTid];        
        var dstTid = getRandBit(bits, RAND_DEST);
                
        //Get a random count
        var count = Math.floor(Math.random() * this.counts[dstTid]);
        
        this.makeMove(srcTid, dstTid, count, turn);        
        
        return true;
    }
    
    
    makeMove(srcTid, dstTid, count, turn) {
        //Oh, what a tangled web we weave, when at first we seek to optimize...        
      
        //Update connections - New token partitions existing connection lines        
        var bits = new Uint32Array(TO_REMOVE+1);
        //Loop through all connections for dest
        bits[LOOP1] = this.connections[dstTid]; //Keep as unsigned-int to avoid problems with 2^31
        while (bits[LOOP1]) {
			bits[IDX1] = bits[LOOP1] & -bits[LOOP1]; // isolate least significant bit
			var tid = Math.log2(minBit[IDX1]); 
            
            //Directions
            for (var dir = 0; dir < DIRECTIONS; dir++) { 
                var oppDir = OPP_DIRECTIONS[dir]; 
                
                bits[LOOP2] = this.lines[tid][dir] & this.connections[tid]; //All Connected TIDs on the line
                bits[TO_REMOVE] = (this.lines[tid][oppDir] & this.connections[tid]) | bits[IDX1]; //All the ones to block
                
                //Loop through, and remove all connections
                while (bits[LOOP2]) {
                    bits[IDX2] = bits[LOOP2] & -bits[LOOP2]; // isolate least significant bit
                    var otherTid = Math.log2(bits[IDX2]);
                    
                    this.connections[otherTid] ^= bits[TO_REMOVE]; //Should include dstTid
                    
                    bits[LOOP2] &= bits[LOOP2]-1; //Required to avoid infinite looping...
                }
            }
            
			bits[LOOP1] &= bits[LOOP1]-1; //Required to avoid infinite looping...
		}
        
        this.counts[dstTid] = count; //Create new stack at dest
        this.counts[srcTid] -= count; //Remove count from source
        if (this.counts[srcTid] <= 1) { //Remove from player tokens
            this.playerTokens[turn] ^= (1 << srcTid);
        } 
        if (this.counts[dstTid] > 1 && this.connections[dstTid]) { //See if has potential to be source before including
            this.playerTokens[turn] |= (1 << dstTid); //Create new token at dest
        }
    }

}

//Bitwise function select a random '1' from a bitstring
function getRandBit(bits, idx) {
    //Get a random source token    
    var randIdx = Math.floor(Math.random() * TILE_COUNT);
    var revRandIdx = TILE_COUNT-dir;
    
    bits[idx] = (bits[idx] << randIdx) | (bits[idx] >> revRandIdx); //Circular rotate random amount
    bits[idx] = bits[idx] & -bits[idx]; // isolate least significant bit
    var tid = Math.log2(bits[idx]);
    bits[idx] = (bits[idx] << revRandIdx) | (bits[idx] >> randIdx); //Circular rotate back
    return tid;
}