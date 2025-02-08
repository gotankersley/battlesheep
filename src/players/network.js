import { Board } from '../core/board.js';

//Network player
var networkUrl = null;

const URL = 'http://10.30.2.115:8000/state/'; //For other domains add "Access-Control-Allow-Origin: *" to the header
export function getPlay (board, onPlayed) { 
	
	//var playerId = +(new Date()); //Timestamp
		
    if (!networkUrl) networkUrl = prompt('Enter a service URL', URL);    
    
    var boardStr = board.toString();
            
    var url = networkUrl + boardStr + '/think';
    
    ajax(url, (data, status) => {
        //Optional argument to log info 
        if (data.hasOwnProperty('log')) console.log(data.log); 
        
        //Expect a Move String - Example: 2,1|6|4,-1
        var moveStr = data.move;
        var move = Board.parseMove(moveStr);
                
        onPlayed(move);			
    });
    

}

//Vanilla J/S equivalent of jQuery's $.ajax
function ajax(url, callback) { 
    var xhr = new XMLHttpRequest();
    xhr.open('GET', encodeURI(url));
    xhr.onload = function() {
        var data = JSON.parse(xhr.responseText);
        callback(data, xhr.status);			
    };
    xhr.send();
}