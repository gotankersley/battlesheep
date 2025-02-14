//https://softserve.harding.edu/docs#/
import { apiPost } from '../lib/network-lib.js';
import { Board } from '../core/board.js';

const BASE_URL = '/battlesheep/api-proxy/';

const MAX_ITERATIONS = 1;


const stateUrl = BASE_URL + 'play-state';
for (var i = 0; i < MAX_ITERATIONS; i++) {
    
    //Get the state    
    var data = apiPost(stateUrl, {}); //Synchronous API Call    
    var uuid = data.uuid;
    var boardStr = data.state;
    
    //Parse the state
    var board = Board.fromString(boardStr);
    
    //Choose a move    
    var moves = board.getMoves();
    if (!moves.length) throw ('No moves available');    
    
    var randMove = moves[Math.floor(Math.random() * moves.length)];	//Random spot	
    randMove.count = Math.floor(Math.random() * randPlay.count)+1 //Random split
    
    //Serialize move
    var moveStr = (
        randMove.src.q + ',' + randMove.src.q + '|' +
        randMove.count + '|' +
        randMove.dst.q + ',' + randMove.dst.r
    );
    var moveStr = '1,0|2|0,1';
    
    //Submit the move action
    var actionArgs = {uuid: uuid, action: moveStr};
    var actionUrl = BASE_URL + 'submit-action';
    var result = apiPost(actionUrl, actionArgs); //Synchronous API Call    
            
    
}