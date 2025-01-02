import { ORIENT_FLAT, ORIENT_POINTY } from '../lib/hex-lib.js';
import { PLAYER1, PLAYER2 } from '../core/board.js';
import { PLAYER_HUMAN } from '../players/players.js';

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
    this.showDebug = false; 
    this.showDebugTable = false; //Clears console
    this.showDebugAnt = true;
    this.showDebugBeetle = true;
    this.showDebugHopper = true;
    this.showDebugQueen = true;
    this.showDebugSpider = true;
    this.showDebugCoords = false;
    this.showDebugPerimeter = true;
    this.showDebugPlaces = true;
    this.showDebugFrozen = true;
    
    //Graph
    this.showGraph = true;
    this.showPerimeter = false;    
    
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
		
	//var tileSetNames = TileSet.getNames();
	//optionsMenu.add(this.properties, 'tileSet1', tileSetNames).onChange(this.onChangeTileSet.bind(this, PLAYER1));
	//optionsMenu.add(this.properties, 'tileSet2', tileSetNames).onChange(this.onChangeTileSet.bind(this, PLAYER2));
	
	//Debug
	var debugMenu = this.rootMenu.addFolder('Debug');				
    debugMenu.add(this.properties, 'showDebug');
    debugMenu.add(this.properties, 'showDebugAnt');
    debugMenu.add(this.properties, 'showDebugBeetle');
    debugMenu.add(this.properties, 'showDebugHopper');
    debugMenu.add(this.properties, 'showDebugQueen');
    debugMenu.add(this.properties, 'showDebugSpider');
    debugMenu.add(this.properties, 'showDebugCoords');
    debugMenu.add(this.properties, 'showDebugFrozen');
    debugMenu.add(this.properties, 'showDebugPerimeter');
    debugMenu.add(this.properties, 'showDebugPlaces');
    debugMenu.add(this.properties, 'showDebugTable');
	//debugMenu.add(this.properties, 'showMoves');
          
    
    //Graph
	var graphMenu = this.rootMenu.addFolder('Graph');			
	graphMenu.add(this.properties, 'showGraph').onChange(this.onToggleGraph.bind(this));	
	graphMenu.add(this.properties, 'showPerimeter');	    
    
    //Deprecated
    //debugMenu.add(this.properties, 'save');
	//debugMenu.add(this.properties, 'load');
	//debugMenu.closed = false;
	
	
	//Root menu			
	var playerNames = {Human:PLAYER_HUMAN};//, Random:PLAYER_RANDOM, Heuristic:PLAYER_HEURISTIC, Zoe:PLAYER_NETWORK, Squish:PLAYER_AB, Squash:PLAYER_SQUASH};
	this.rootMenu.add(this.properties, 'player1', playerNames).onChange(this.onChangePlayer.bind(this, PLAYER1));
	this.rootMenu.add(this.properties, 'player2', playerNames).onChange(this.onChangePlayer.bind(this, PLAYER2));
}

//Events
MenuManager.prototype.onChangeTileSet = function(player, val) {	
	TileSet.setActive(parseInt(player), parseInt(val));	
}

MenuManager.prototype.onChangePlayer = function(player, val) {		
	game.players[player] = parseInt(val);
	game.play();
}

MenuManager.prototype.onChangeOrientation = function(val) {	
	setHex(menu.orientation, window.HEX_SIDE);
}

MenuManager.prototype.onToggleGraph = function(val) {	
    var graph = document.getElementById('graph');
    if (val) graph.style.display = 'block';
    else graph.style.display = 'none';
}