//https://softserve.harding.edu/docs#/
import { apiPost } from '../lib/network-lib.js';
import { Board } from '../core/board.js';
import * as RamboPlayer from './rambo.js';

const BASE_URL = '/battlesheep/api-proxy/';

const MAX_ITERATIONS = 50;
const PLAYER_NAME = 'rambo';
const PLAYER_TOKEN = '';
//const EVENT = 'mirror';
const EVENT = 'mock-2';
const HTTP_WAIT = 204;
const SLEEP_TIME = 5000; //Time in Milliseconds


const stateUrl = BASE_URL + 'play-state';
//for (var i = 0; i < MAX_ITERATIONS; i++) {
while (true) {
    
    //Get the state    
    var args = {
        event:EVENT,
        player:PLAYER_NAME,
        token:PLAYER_TOKEN,
    };
    var data = apiPost(stateUrl, args); //Synchronous API Call      
    if (data.statusCode == HTTP_WAIT) {
        synchronousSleep(SLEEP_TIME);
        continue;
    }
    var boardStr = data.state;    
    var actionId = data.action_id;
    
    //Parse the state
    var board = Board.fromString(boardStr);
    
    //Choose a move               
    //var randPlay = board.getRandPlay();
    var actionStr;
    if (boardStr == 'h') { 
        //Hard-code initial, because it has to be one of the ones the API allows
        actionStr = '0,0|0,1|1,0|1,1';
    }
    else {
        var play = RamboPlayer.getPlay(board, null); 
        actionStr = board.playToString(play);
    }
        
    //Submit the move action    
    var actionArgs = {
        player:PLAYER_NAME,
        token:PLAYER_TOKEN,
        action_id:actionId,
        action: actionStr
    };
    var actionUrl = BASE_URL + 'submit-action';
    var result = apiPost(actionUrl, actionArgs); //Synchronous API Call    
    console.log(actionStr, result);
    
    //Exit loop when a win is found
    //if (result.winner != 'none') break;
    synchronousSleep(3000);
}


// Calling the function will block all code in your script until the specified ms have passed
// It will also cause your CPU fans to run at full speed!
function synchronousSleep(ms) {
	var start = performance.now();
	while (performance.now() - start < ms);
}
