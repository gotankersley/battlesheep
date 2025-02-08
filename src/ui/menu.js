import { setHex, ORIENT_FLAT, ORIENT_POINTY } from '../lib/hex-lib.js';
import { getTileSetNames } from './tile-set.js';
import { PLAYER1, PLAYER2 } from '../core/board.js';
import { PLAYER_HUMAN,  PLAYER_RANDOM, PLAYER_NETWORK  } from '../players/players.js';

//Struct MenuProperties
function MenuProperties() {
	//Options
	this.showGrid = true;
	this.showCoordinates = false;
	this.orientation = ORIENT_FLAT;	
	this.tileSet1 = 0;
	this.tileSet2 = 1;		
	this.midnight = false;

	this.player1 = PLAYER_HUMAN;
	this.player2 = PLAYER_HUMAN;

    //Debug
    this.showMoves = false; 
    
    
    //Deprecated
    this.save = function() { game.save(); }
	this.load = function() { game.load(); }
}
//End struct MenuProperties

//Class MenuManager
export function MenuManager() {
	
	this.properties = new MenuProperties();
	this.rootMenu = new dat.GUI();	
	
	//Options
	var optionsMenu = this.rootMenu.addFolder('Options');		
	optionsMenu.add(this.properties, 'showGrid');
	optionsMenu.add(this.properties, 'showCoordinates');		
	
	optionsMenu.add(this.properties, 'midnight');	
	optionsMenu.add(this.properties, 'orientation', {flat:ORIENT_FLAT, pointy:ORIENT_POINTY}).onChange(this.onChangeOrientation);
		
	var tileSetNames = getTileSetNames();
	optionsMenu.add(this.properties, 'tileSet1', tileSetNames).onChange(this.onChangeTileSet.bind(this, PLAYER1));
	optionsMenu.add(this.properties, 'tileSet2', tileSetNames).onChange(this.onChangeTileSet.bind(this, PLAYER2));
	
	//Debug
	var debugMenu = this.rootMenu.addFolder('Debug');				    
	debugMenu.add(this.properties, 'showMoves');
          
    
	
	
	//Root menu			
	var playerNames = {Human:PLAYER_HUMAN, Random:PLAYER_RANDOM, Network:PLAYER_NETWORK};
	this.rootMenu.add(this.properties, 'player1', playerNames).onChange(this.onChangePlayer.bind(this, PLAYER1));
	this.rootMenu.add(this.properties, 'player2', playerNames).onChange(this.onChangePlayer.bind(this, PLAYER2));
}

//Events
MenuManager.prototype.onChangeTileSet = function(player, val) {	
	tileSet.setActive(parseInt(player), parseInt(val));	
}

MenuManager.prototype.onChangePlayer = function(player, val) {		
	game.players[player] = parseInt(val);
	game.play();
}

MenuManager.prototype.onChangeOrientation = function(val) {	
	setHex(menu.orientation, window.HEX_SIDE);
}
