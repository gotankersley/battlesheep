import { Pos, MODE_PLACE, MODE_MOVE, MODE_TILE } from '../core/board.js';

//Random Player
export function getPlay (board, onPlayed) {

    //Tile
    if (board.mode == MODE_TILE) {
        var tileMoves = board.getTileMoves();
        if (tileMoves.length <= 0) throw ('No tile moves available');
        
        var randPlay = tileMoves[Math.floor(Math.random() * tileMoves.length)];	
        
        onPlayed(randPlay);
        
    }
    
    //Place
    else if (board.mode == MODE_PLACE) {
        var perimeter = board.getPerimeter();                
        var perimeterKeys = Object.keys(perimeter);        
        if (!perimeterKeys.length) throw('No place moves available');
        
        var randKey = perimeterKeys[Math.floor(Math.random() * perimeterKeys.length)];
        var tile = board.tiles[randKey];
        var pos = new Pos(tile.pos.q, tile.pos.r);
        var randPlay = {pos: pos};
        
        onPlayed(randPlay);
    }
    
    //Move
    else if (board.mode == MODE_MOVE) {
            
        var moves = board.getMoves();    
        if (!moves.length) throw ('No moves available');    
        
        var randPlay = moves[Math.floor(Math.random() * moves.length)];	//Random spot	
        randPlay.count = Math.floor(Math.random() * randPlay.count)+1 //Random split
        
        onPlayed(randPlay);
        
	}
	else throw('Invalid Board Mode: ' + board.mode);
    	

}


