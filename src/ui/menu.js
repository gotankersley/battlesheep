import { setHex, ORIENT_FLAT, ORIENT_POINTY, INVALID } from '../lib/hex-lib.js';
import { getTileSetNames } from './tile-set.js';
import { Board, PLAYER1, PLAYER2, MODE_TILE, MODE_PLACE, MODE_MOVE } from '../core/board.js';
import { DEFAULT_BOARD_STR } from '../core/game.js';
import { PLAYER_HUMAN,  PLAYER_RANDOM, PLAYER_NETWORK, PLAYER_RAMBO  } from '../players/players.js';

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
    this.mode = MODE_PLACE;

    //Debug
    this.testBoards = INVALID;
    this.normalize = function() { game.board.normalize(); }; 
    
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
    var testBoards = {Default:0, WinTest:1, Simple:2};
    debugMenu.add(this.properties, 'testBoards', testBoards).onChange(this.onTestBoard.bind(this));
    debugMenu.add(this.properties, 'normalize');

	
	//Root menu			
    var modes = {Tile:MODE_TILE, Place:MODE_PLACE, Move:MODE_MOVE};
	window.modesController = this.rootMenu.add(this.properties, 'mode', modes).onChange(this.onChangeMode.bind(this));
	
    //var playerNames = {Human:PLAYER_HUMAN, Random:PLAYER_RANDOM, Network:PLAYER_NETWORK, Rambo:PLAYER_RAMBO};
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

MenuManager.prototype.onChangeMode = function(val) {		
	if (typeof(val) != 'number') {
        game.changeMode(Number.parseInt(menu.mode));
    }
}

MenuManager.prototype.onChangeOrientation = function(val) {	
	setHex(menu.orientation, window.HEX_SIDE);
}

MenuManager.prototype.onTestBoard = function(val) {
    if (val == 0) game.board = Board.fromString(DEFAULT_BOARD_STR);  
    else if (val == 1) game.board = Board.fromString('1,2|2,2|1,3|0,3|4,1|5,1|4,2|3,2|7,0|8,0|7,1|6,1|-2,3|-1,3|-2,4|-3,4|7,2|8,2|7,3|6,3|4,4|5,4|4,5|3,5|1,5|2,5|1,6|0,6|-2,6|-1,6|-2,7|-3,7|-3,4h14|-2,4t16|-2,3h2|h');  
    //else if (val == 2) game.board = Board.fromString('#6,0|7,0|6,1|5,1|3,2|4,2|3,3|2,3|2,3h16|7,0t16|t');  
    window.modesController.setValue(game.board.mode);     
}
