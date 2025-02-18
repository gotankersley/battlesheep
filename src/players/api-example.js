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
    try {
        var randPlay = board.getRandPlay();
    }
    catch (err) {
        console.log('No plays available: ', board.toString());
        break;
    }
    
        
    //Submit the move action
    var playStr = board.playToString(randPlay);
    var actionArgs = {uuid: uuid, action: playStr};
    var actionUrl = BASE_URL + 'submit-action';
    var result = apiPost(actionUrl, actionArgs); //Synchronous API Call    
            
    
}