import { setHex, fillHex, strokeHex, ORIENT_FLAT, ORIENT_POINTY } from '../lib/hex-lib.js';
import { MenuManager } from './menu.js';
import { TileSet } from './tile-set.js';
import { PLAYER1, PLAYER2, EMPTY } from '../core/board.js';
import { Game } from '../core/game.js';
import { Mouse, BUTTON_LEFT } from './mouse.js';
import { Hand, HAND_SIZE_X } from './hand.js';



//Constants
const COLOR_GRID = '#e0e0e0';
const COLOR_BLACK = '#000';
const COLOR_MOUSE = 'rgba(0, 0, 255, 0.1)';
const COLOR_TILE = 'lightgreen';
const COLOR_TILE_BORDER = 'green';

const KEY_DELETE = 46;
const KEY_T = 84;

const MESSAGE_DURATION = 3000; //MS
const MOVE_DELAY = 200;

const TAU = 2*Math.PI;

//Globals
window.CANVAS_SIZE_X;
window.CANVAS_SIZE_Y;

window.CANVAS_MARGIN_X = 10;
window.CANVAS_MARGIN_Y = 10;

window.menu;
window.mouse;
window.game;
window.tileSet;


//Properties	
var canvas;
var ctx;	
//var tileImages; 
var hands = [];
var paused = false;
var $message;


	

export function createStage(containerId) { 
    //Menu
    var menuManager = new MenuManager();
    window.menu = menuManager.properties;
    setHex(menu.orientation, HEX_SIDE);
    
    //Message popup
    $message = document.getElementById('message');
    
    //Hands
    hands[PLAYER1] = new Hand('hand1', PLAYER1);
    hands[PLAYER2] = new Hand('hand2', PLAYER2);
    
    canvas = document.getElementById(containerId);	
    window.mouse = new Mouse(canvas);
    onWindowResize(); //Set canvas size
    
    WORLD_X = Math.floor(CANVAS_SIZE_X/2)+HEX_SIZE_X; //Move origin to more center of the screen
    WORLD_Y = Math.floor(CANVAS_SIZE_Y/2)+HEX_SIZE_Y;
    
    ctx = canvas.getContext('2d');  
    ctx.fillStyle = COLOR_BLACK;
    
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onWindowResize, false );
    window.addEventListener('keydown', onKeyDown, false);
    //window.addEventListener('keypress', onKeyPress, false);
    canvas.addEventListener('mousedown', onMouseDown, false );	
    canvas.oncontextmenu = function (e) { //Disable right clicking
        mouse.selected = null;
        e.preventDefault();
    };
            
    
    //Game events	
    window.game = new Game();
    window.game.addEventListener('placed', onPlaced);
    window.game.addEventListener('win', onWin);
    window.game.addEventListener('moved', onMoved);
    
    //Start rendering
    window.tileSet = new TileSet(function() {    
        draw();
    }); 
}

function showMessage(text) {
				
    $message.innerText = text;		
    message.style.display = 'block';
    setTimeout(function() {
        message.style.display = 'none';
    }, MESSAGE_DURATION);
}
	
	
function onWindowResize() {
    window.CANVAS_SIZE_X = window.innerWidth - window.CANVAS_MARGIN_X;
    window.CANVAS_SIZE_Y = window.innerHeight - window.CANVAS_MARGIN_Y;
            
    //Grid
    canvas.width = window.CANVAS_SIZE_X;
    canvas.height = window.CANVAS_SIZE_Y;
    
    //Hands
    var handCanvas1 = hands[PLAYER1].canvas;
    var handCanvas2 = hands[PLAYER2].canvas;
                    
    handCanvas1.style.left = 0;
    handCanvas2.style.left = (window.CANVAS_SIZE_X - HAND_SIZE_X) + 'px';
    
    handCanvas1.width = HAND_SIZE_X;
    handCanvas2.width = HAND_SIZE_X;
                            
    handCanvas1.height = CANVAS_SIZE_Y;
    handCanvas2.height = CANVAS_SIZE_Y;
        
    //Boundary (for culling)
    mouse.setBounds();
    
    //Message 								
    $message.style.left = HAND_SIZE_X + 'px';
    $message.style.width = (CANVAS_SIZE_X - 160) + 'px';
}
	
function onFocus() {
    paused = false;
    requestAnimationFrame(draw); 
}

function onBlur() {
    paused = true;
}

function onMouseDown(e) {	
    if (e.button == BUTTON_LEFT) {	
        var board = game.board;
        var player = board.turn;        
        //if (game.players[player] != PLAYER_HUMAN) {
        //    Stage.showMessage('Waiting for other player to play...');
        //    return;
        //}
        
        //See if a (new) tile has been selected
        var pos = mouse.axial;   
        var posKey = pos.q + ',' + pos.r;
        if (board.tiles[posKey]) { //Valid pasture tile
            var tile = board.tiles[posKey];            
            if (tile.tokenId != EMPTY) { //Is tile occupied?
                var token = board.tokens[tile.tokenId];
                if (mouse.ctrlOn) mouse.selected = {q:pos.q, r:pos.r}; //Navigation
                else if (token.player != player) return; //Can't select player's opposite tile                
                else mouse.selected = {q:pos.q, r:pos.r}; //Make this tile the new selection                
                
                
            }
            else { //Tile is not occupied
                //Moving a tile
                var moveCount = 2;
                if (mouse.selected) game.makeMove(mouse.selected, pos, moveCount, mouse.ctrlOn);  
            }
        }
    }
}
	
//function onKeyPress(e) {
//	var key = e.which;
//	console.log(e);
//}
//
function onKeyDown(e) {			
    if (e.keyCode == KEY_DELETE) {
        //var sel = mouse.selected;
        //var board = game.board;
        //var posKey = sel.q + ',' + sel.r;
        //if (board.tiles[posKey]) {
        //    //TODO: return to hand?
        //    delete board.tiles[posKey]; 
        //    mouse.selected = null;
        //}
    }
    else if (e.keyCode == KEY_T) {
        game.board.changeTurn();        
    }
    else if (e.ctrlKey && e.key == 'z') {
        game.onMoveUndo();
    }
}
	
//Game Events
function onPlaced(player, tileType, pos) {        
    hands[player].selected = null;
    hands[player].hover = null;
    setTimeout(game.play, MOVE_DELAY);		
}

function onMoved(src, dst) {        
    mouse.selected = null;		        
    setTimeout(game.play, MOVE_DELAY);		
}

function onWin(winner, loser) {
    mouse.selected = null;	
    if (winner == PLAYER1) alert('Player1 has won');
    else if (winner == PLAYER2) alert('Player2 has won');
    else if (winner == WIN_DRAW) alert('Tie game');
    else console.log('Game over?', winner, loser);
}
	
//Drawing	
function draw(time) { //Top-level drawing function	
    //Clear the canvas
    ctx.clearRect(0, 0, CANVAS_SIZE_X, CANVAS_SIZE_Y);
    if (menu.midnight) { //Draw dark
        ctx.fillStyle = COLOR_BLACK;
        ctx.fillRect(0, 0, CANVAS_SIZE_X, CANVAS_SIZE_Y);
    }
    ctx.save();
    
    ctx.translate(-window.WORLD_INIT_X, -window.WORLD_INIT_Y); //Offset to make drawing easier
        
    
    //Grid		
    if (menu.showGrid) {
        if (menu.orientation == ORIENT_FLAT) drawGrid_F();
        else drawGrid_P();
    }
    
    
    //Mouse
    drawMouse(); //Draw active hex at cursor location 								
                
    //Tiles
    drawTiles();

    //Tokens
    drawTokens();
    
    /*if (mouse.selected) {
        drawTileHighlight();
        //Hands
        //hands[PLAYER1].draw();
        var posKey = mouse.selected.q + ',' + mouse.selected.r;
        var tokenId = game.board.tiles[posKey].tokenId;
        hands[PLAYER2].draw(stack);
    }*/
        
            
    ctx.restore();
    
    //Mouse coord		
    drawMouseCoords();
    
    //Turn
    drawTurn();
    
    
    //Repaint
    if (!paused) requestAnimationFrame(draw); 
}
					
function drawGrid_F() {
    
    //Draw grid using Odd-Q offset style						
    var hexRowsPerScreen = Math.floor(window.CANVAS_SIZE_Y/window.HEX_SIZE_Y)+3;		
    var hexColsPerScreen = Math.floor(2*(window.CANVAS_SIZE_X/window.HEX_SIZE_X));
                        
    //Rows
    for (var r = 0; r < hexRowsPerScreen; r++) { //Draw hex grid with offsets
                                        
        var y1 = (r * window.HEX_SIZE_Y) + (window.WORLD_Y % window.HEX_SIZE_Y);			
        var y2 = y1 + window.HEX_CENTER_GAP_Y;
            
        //Columns - Offset column Y-position every other iteration
        for (var c = 0; c < hexColsPerScreen; c++) {									
            var x = (c * window.HEX_CENTER_GAP_X ) + (window.WORLD_X % window.HEX_DOUBLE_GAP_X);				
            var y = (c % 2 == 0)? y = y1 : y2;	
            
            var coord;
            if (menu.showCoordinates) {
                var axial = pixToHex(x, y);		
                coord = axial.q + ',' + axial.r;
            }
            else coord = '';
            strokeHex(ctx, x, y, COLOR_GRID, 1); 
            ctx.fillStyle = COLOR_GRID;
            ctx.fillText(coord, x, y);
            
        }
    }		
    
}	
	
function drawGrid_P() {
    
    //Draw grid using Odd-R offset style						
    var hexRowsPerScreen = Math.floor(2*(window.CANVAS_SIZE_Y/window.HEX_SIZE_Y));
    var hexColsPerScreen = Math.floor(window.CANVAS_SIZE_X/window.HEX_SIZE_X)+3;		
                        
    //Rows
    for (var r = 0; r < hexRowsPerScreen; r++) { //Draw hex grid with offsets
                                        
        var y = (r * window.HEX_CENTER_GAP_Y) + (window.WORLD_Y % window.HEX_DOUBLE_GAP_Y);
        var xOffset = (r % 2 == 0)? 0 : window.HEX_UNIT_X;
        xOffset += (window.WORLD_X % window.HEX_SIZE_X);	//Scrolling
            
        //Columns - Offset column X-position every other iteration
        for (var c = 0; c < hexColsPerScreen; c++) {									
            var x = xOffset + (c * window.HEX_SIZE_X);
            
            var coord;
            if (menu.showCoordinates) {
                var axial = window.pixToHex(x, y);		
                coord = axial.q + ',' + axial.r;
            }
            else coord = '';				
            strokeHex(ctx, x, y, COLOR_GRID, 1); 
            ctx.fillStyle = COLOR_GRID;
            ctx.fillText(coord, x, y);
            
        }
    }		
    
}
			
function drawMouse() {					
    //strokeHex(ctx, mouse.snap.x, mouse.snap.y, COLOR_MOUSE, 2);					
    fillHex(ctx, mouse.snap.x, mouse.snap.y, COLOR_MOUSE);					
    //ctx.fillText(mouse.axial.q + ',' + mouse.axial.r, x, y);		
}

function drawMouseCoords() {		
    ctx.fillText(mouse.axial.q + ',' + mouse.axial.r, 10, CANVAS_SIZE_Y - 10);												
}

function drawTurn() {		
    if (game.board.turn == PLAYER1) {
        ctx.fillStyle = '#a0a0a0';
        ctx.fillText('Player 1', CANVAS_SIZE_X / 2, 20);
    }
    else {
        ctx.fillStyle = '#000';
        ctx.fillText('Player 2', CANVAS_SIZE_X / 2, 20);
    }
    
}
        
function drawTileHighlight() {
    var px = hexToPix(mouse.selected);		
    if (mouse.onScreen(px.x, px.y)) strokeHex(ctx, px.x, px.y, '#f00', 5); 
}
	
function drawTiles() {

    var posKeys = Object.keys(game.board.tiles);		    
    for (var t = 0; t < posKeys.length; t++) {
        var posKey = posKeys[t];
        var tile = game.board.tiles[posKey];
        var px = hexToPix(tile.pos);
                
        fillHex(ctx, px.x, px.y, COLOR_TILE);
        strokeHex(ctx, px.x, px.y, COLOR_TILE_BORDER, 5);	        
		
        if (menu.showCoordinates) {
            ctx.fillStyle = COLOR_BLACK;
            ctx.fillText(posKey, px.x, px.y); 
        }
    }
}

function drawTokens() {
    var board = game.board;
    var tokens = board.tokens;    
    for (var tokenId = 0; tokenId < tokens.length; tokenId++) {
        var token = tokens[tokenId];
        //var posKey = token.pos.q + ',' + token.pos.r;
        //var tile = board.tiles[posKey];
        var px = hexToPix(token.pos);                       
        var tileType = token.count % 6;
        tileSet.draw(ctx, px.x, px.y, tileType, token.player, false, token.count);
        //ctx.fillStyle = 'red';                       
        //drawCircle(px.x+100, px.y+100, 40);            
                    
    }
}
        /*if (mouse.onScreen(tx, ty)) {
            //Check for tiles on top (stacks) - bottom to top
            if (tile.type == STACK) {
                for (var s = 0; s < tile.stack.length; s++) {
                    var stackedTile = tile.stack[s];
                    var offset = (5 * s);
                    TileSet.draw(ctx, tx + offset, ty + offset, stackedTile.type, stackedTile.player, 0.5);
                }
            }
            else TileSet.draw(ctx, tx, ty, tile.type, tile.player);
            
        }
        

    }		
    
}*/
	

	

function drawCircle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU, false);
    ctx.fill();
    //ctx.stroke();
}