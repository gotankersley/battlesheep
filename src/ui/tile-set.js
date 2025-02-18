import { fillHex, strokeHex, INVALID } from '../lib/hex-lib.js';
import { PLAYER1, PLAYER2 } from '../core/board.js';

//Constants
const DRAW_BOUNDING_BOX = false;	
const COLOR_COUNT = '#000';
    
const TYPES = [
    {name:'sheep1', scale: 40}, 
    //{name:'sheep2', scale: 40}, 
    //{name:'sheep3', scale: 40}, 
    //{name:'sheep4', scale: 30}, 
    //{name:'sheep5', scale: 40}, 
    //{name:'sheep6', scale: 30}, 
];

//Scoped variables		
const METADATA = [
    {name:'white', path: 'img/white', ext: 'png', outline:'#98968d', scale:true},
    {name:'blue', path: 'img/blue', ext: 'png', outline:'#50b8d5', scale:true},
    {name:'green', path: 'img/green', ext: 'png', outline:'#93cb5a', scale:true},
    {name:'red', path: 'img/red', ext: 'png', outline:'#c85c59', scale:true},		
];

export function getTileSetNames () { //For menu
    var names = {};
    for (var m = 0; m < METADATA.length; m++) {
        var meta = METADATA[m];
        names[meta.name] = m;
    }
    return names;
}

export class TileSet {

	
	constructor(onLoaded) {
        
        this.cur;
        this.images = [];//[SetId][TileType]
        this.activeImages = [[],[]]; //[Player],[TileType]
    
		//Init images length
		for (var m = 0; m < METADATA.length; m++) {
			this.images.push([]);
		}
		
		var setId1 = menu.tileSet1;
		var setId2 = menu.tileSet2;
		
		this.cur = [setId1, setId2];
		
		this.loadTiles(setId1, () => { 	
			this.activeImages[PLAYER1] = this.images[setId1];		
			this.loadTiles(setId2, () =>  {
				this.activeImages[PLAYER2] = this.images[setId2];	
				onLoaded();
			});				
		});
	}

	
	setActive = (player, setId) => {				
		
		this.loadTiles(setId, () => {		
			this.cur[player] = setId;
			this.activeImages[player] = this.images[setId];
		});
	}
	
	draw = (ctx, x, y, player, count) => {
        var tileType = 0; 
		var set = this.cur[player];
		var meta = METADATA[set];
		
        
		//Bounding box
		if (DRAW_BOUNDING_BOX) ctx.strokeRect(x, y, HEX_TILE, HEX_TILE); 
		
						
		//Rotate tile
		ctx.save();
		//if (alpha) ctx.globalAlpha = alpha;
		
		ctx.translate(x, y);
		if (player == PLAYER1) ctx.rotate(HEX_ANGLE*Math.PI/180);
		else ctx.rotate(-HEX_ANGLE*Math.PI/180);
		
		if (meta.scale) {			
			var scale = TYPES[tileType].scale;			
			var halfScale = scale/2;
			ctx.drawImage(this.images[set][tileType], -HEX_TILE_CENTER_X + halfScale, -HEX_TILE_CENTER_Y + halfScale, HEX_TILE_X - scale, HEX_TILE_Y - scale);        
		}
		else ctx.drawImage(this.images[set][tileType], -HEX_TILE_CENTER_X, -HEX_TILE_CENTER_Y, HEX_TILE_X, HEX_TILE_Y);		
		ctx.restore();
        if (count != INVALID) {
            ctx.fillStyle = COLOR_COUNT;
            //ctx.fillText('' + count, x-scale+10, y-scale);		
            ctx.fillText('' + count, x, y);		
        }
			
	}
	
	
	//Recursive loading loop
	loadTiles = (setId, onLoaded) => {
		if (this.images[setId].length) onLoaded(); //Tiles already loaded
		else this.loadTilesLoop(0, setId, onLoaded);
	}
	
	loadTilesLoop = (i, setId, onLoaded) => { 
		var meta = METADATA[setId];
		var img = new Image();	
		img.onload = () => {			
			
			if (i+1 >= TYPES.length) onLoaded(); //Finished
			else this.loadTilesLoop(i+1, setId, onLoaded); //Recurse
		}
				
		var src = meta.path + '/' + TYPES[i].name + '.' + meta.ext;		
		img.src = src;			
		this.images[setId].push(img);
	}
}
//End TileSet class