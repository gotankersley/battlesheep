import { setHex, fillHex, strokeHex, ORIENT_FLAT, ORIENT_POINTY } from '../lib/hex-lib.js';
import { MenuManager } from './menu.js';
import { PLAYER1, PLAYER2 } from '../core/board.js';
import { Game } from '../core/game.js';
import { Mouse } from './mouse.js';
import { Hand, HAND_SIZE_X } from './hand.js';



//Constants
window.CANVAS_SIZE_X;
window.CANVAS_SIZE_Y;

var CANVAS_MARGIN_X = 10;
var CANVAS_MARGIN_Y = 10;

const COLOR_GRID = '#e0e0e0';
const COLOR_MOUSE = 'rgba(0, 0, 255, 0.1)';

const KEY_DELETE = 46;
const KEY_T = 84;

const MESSAGE_DURATION = 3000; //MS
const MOVE_DELAY = 200;



//Properties	
var menu;
var canvas;
var ctx;	
var tileImages; 
var hands = [];
var paused = false;
var $message;
var mouse;	
var game;
	

export function createStage(containerId) { 
    //Menu
    var menuManager = new MenuManager();
    menu = menuManager.properties;
    setHex(menu.orientation, HEX_SIDE);
    
    //Message popup
    $message = document.getElementById('message');
    
    //Hands
    hands[PLAYER1] = new Hand('hand1', PLAYER1, mouse, game);
    hands[PLAYER2] = new Hand('hand2', PLAYER2, mouse, game);

    canvas = document.getElementById(containerId);	
    mouse = new Mouse(canvas);
    onWindowResize(); //Set canvas size
    
    WORLD_X = Math.floor(CANVAS_SIZE_X/2)+HEX_SIZE_X; //Move origin to more center of the screen
    WORLD_Y = Math.floor(CANVAS_SIZE_Y/2)+HEX_SIZE_Y;
    
    ctx = canvas.getContext('2d');  				
    
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
    game = new Game();
    game.addEventListener('placed', onPlaced);
    game.addEventListener('win', onWin);
    game.addEventListener('moved', onMoved);
    
    //Start rendering
    //TileSet.init(function() {			
        draw();
    //}); 
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
        var hive = game.hive;
        var player = hive.turn;
        if (game.players[player] != PLAYER_HUMAN) {
            Stage.showMessage('Waiting for other player to play...');
            return;
        }
        
        //See if a (new) tile has been selected
        var pos = mouse.axial;
        var tile = hive.getByPos(mouse.axial);
        var sel = mouse.selected;			
        if (tile) { //Pos is not empty				
            if (mouse.ctrlOn) mouse.selected = {q:pos.q, r:pos.r};
            else if (sel && (hive.grid[sel.q + ',' + sel.r].type == BEETLE || hive.grid[sel.q + ',' + sel.r].stack.length)) {  						
                game.makeMove(sel, pos, mouse.ctrlOn);	//Stack of tiles
            }
            else if (tile.player != player) return; //Can't select player's opposite tile
            else mouse.selected = {q:pos.q, r:pos.r}; //Make this tile the new selection
            
        }
        else { //Pos is empty
            //Moving a tile
            if (sel) game.makeMove(sel, pos, mouse.ctrlOn);
            
            //Placing a tile (from hand)
            else {
                var selected = hands[player].selected;
                if (selected !== null) {
                    var tile = hive.hands[player][selected];			
                    game.place(tile.type, pos, mouse.ctrlOn);
                }
                else Stage.showMessage('Player ' + (player+1) + ' - select a tile to play...');
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
        var sel = mouse.selected;
        var hive = game.hive;
        var posStr = sel.q + ',' + sel.r;
        if (hive.grid[posStr]) {
            //TODO: return to hand?
            delete hive.grid[posStr]; 
            mouse.selected = null;
        }
    }
    else if (e.keyCode == KEY_T) {
        game.hive.turn = +(!game.hive.turn);
        game.hive.getMoves();
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
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_SIZE_X, CANVAS_SIZE_Y);
    }
    ctx.save();

    ctx.translate(-WORLD_INIT_X, -WORLD_INIT_Y); //Offset to make drawing easier
    
    //Perimeter
    //if (menu.showDebug && menu.showDebugPerimeter) drawPerimeter();	
    
    //Grid		
    if (menu.showGrid) {
        if (menu.orientation == ORIENT_FLAT) drawGrid_F();
        else drawGrid_P();
    }
    
    
    //Mouse
    drawMouse(); //Draw active hex at cursor location 								
                
    //Tiles
    //if (mouse.selected) drawTileHighlight();
    //drawTiles();				
    
    //PlacePoints
    //if (menu.showDebug && menu.showDebugPlaces) drawPlacePoints();
    
    //Frozen
    //if (menu.showDebug && menu.showDebugFrozen) drawFrozen();
    
    //Holes
    //if (menu.showDebug) drawHoles();
    
    //Moves
    //if (menu.showDebug) drawMoves();
            
    ctx.restore();
    
    //Mouse coord		
    drawMouseCoords();
    
    //Turn
    drawTurn();
    
    //Hands
    hands[PLAYER1].draw();
    hands[PLAYER2].draw();
    
    
    
    //Repaint
    if (!paused) requestAnimationFrame(draw); 
}
					
function drawGrid_F() {
    
    //Draw grid using Odd-Q offset style						
    var hexRowsPerScreen = Math.floor(CANVAS_SIZE_Y/HEX_SIZE_Y)+3;		
    var hexColsPerScreen = Math.floor(2*(CANVAS_SIZE_X/HEX_SIZE_X));
                        
    //Rows
    for (var r = 0; r < hexRowsPerScreen; r++) { //Draw hex grid with offsets
                                        
        var y1 = (r * HEX_SIZE_Y) + (WORLD_Y % HEX_SIZE_Y);			
        var y2 = y1 + HEX_CENTER_GAP_Y;
            
        //Columns - Offset column Y-position every other iteration
        for (var c = 0; c < hexColsPerScreen; c++) {									
            var x = (c * HEX_CENTER_GAP_X ) + (WORLD_X % HEX_DOUBLE_GAP_X);				
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
    var hexRowsPerScreen = Math.floor(2*(CANVAS_SIZE_Y/HEX_SIZE_Y));
    var hexColsPerScreen = Math.floor(CANVAS_SIZE_X/HEX_SIZE_X)+3;		
                        
    //Rows
    for (var r = 0; r < hexRowsPerScreen; r++) { //Draw hex grid with offsets
                                        
        var y = (r * HEX_CENTER_GAP_Y) + (WORLD_Y % HEX_DOUBLE_GAP_Y);
        var xOffset = (r % 2 == 0)? 0 : HEX_UNIT_X;
        xOffset += (WORLD_X % HEX_SIZE_X);	//Scrolling
            
        //Columns - Offset column X-position every other iteration
        for (var c = 0; c < hexColsPerScreen; c++) {									
            var x = xOffset + (c * HEX_SIZE_X);
            
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
    if (mouse.onScreen(px.x, px.y)) strokeHex(ctx, px.x, px.y, '#f00', 10); 
}
	
function drawTiles() {
    
    /*
    var posKeys = Object.keys(game.board.grid);		
    
    for (var t = 0; t < posKeys.length; t++) {
        var posKey = posKeys[t];
        var tile = game.board.grid[posKey];
        var px = hexToPix(tile.pos);
        var tx = px.x;
        var ty = px.y;
        if (mouse.onScreen(tx, ty)) {
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
    */
}
	
function drawPerimeter() {
    var posKeys = Object.keys(game.board.perimeter);		
    
    for (var t = 0; t < posKeys.length; t++) {
        var posKey = posKeys[t];
        var peri = game.board.perimeter[posKey];
        var px = hexToPix({q:peri.q, r:peri.r});
        var tx = px.x;
        var ty = px.y;
        if (mouse.onScreen(tx, ty)) {
            fillHex(ctx, tx, ty, 'aqua');	   
            if (menu.showDebugCoords) {
                ctx.fillStyle = 'black';
                ctx.fillText('pid:' + peri.pid, tx, ty);	              
                ctx.fillText(' [' + posKey + '] client', tx-5, ty+10);	              
                ctx.fillText(' [' + peri.loc +'] local', tx-5, ty+20);	              
            }
        }				

    }		
}
	
function drawPlacePoints() {
    var posKeys = Object.keys(game.board.placePoints);				
    
    for (var t = 0; t < posKeys.length; t++) {
        var posKey = posKeys[t];
        var point = game.board.placePoints[posKey];
        
        if (point === game.board.turn) {			
            
            var posArr = posKey.split(',');
            var q = parseInt(posArr[0]);
            var r = parseInt(posArr[1]);
            
            var px = hexToPix({q:q, r:r});
            var tx = px.x;
            var ty = px.y;
                
            if (mouse.onScreen(tx, ty)) {				
                ctx.fillStyle = 'red';
                ctx.fillText('PLACE', tx, ty-15);							
            }
        }
        
    }		
}
	
function drawFrozen() {
    var posKeys = Object.keys(game.board.frozen);		
    
    for (var t = 0; t < posKeys.length; t++) {
        var posKey = posKeys[t];			            
        var posArr = posKey.split(',');
        var q = parseInt(posArr[0]);
        var r = parseInt(posArr[1]);		
        var px = hexToPix({q:q, r:r});
        var tx = px.x;
        var ty = px.y;
        if (mouse.onScreen(tx, ty)) {				
            ctx.fillStyle = 'white';
            ctx.fillText('FROZEN', tx, ty+15);				
        }
    }

}

function drawHoles() {
    var posKeys = Object.keys(game.board.holes);		
    
    for (var t = 0; t < posKeys.length; t++) {
        var posKey = posKeys[t];			
        var posArr = posKey.split(',');
        var q = parseInt(posArr[0]);
        var r = parseInt(posArr[1]);	
        var px = hexToPix({q:q, r:r});
        var tx = px.x;
        var ty = px.y;
        if (mouse.onScreen(tx, ty)) {				
            ctx.fillStyle = 'green';
            ctx.fillText('HOLE', tx, ty);				
        }
    }
}

function drawMoves() {
    
    ctx.lineWidth = 1;		    
    
    for (var m = 0; m < game.board.moves.length; m++) {
        var move = game.hive.moves[m];		
        var tile = game.hive.grid[move.sq + ',' + move.sr];   
        
        switch (tile.type) {
            case TYPE_ANT: if (menu.showDebugAnt) break; else continue;
            case TYPE_BEETLE: if (menu.showDebugBeetle) break; else continue;
            case TYPE_HOPPER: if (menu.showDebugHopper) break; else continue;
            case TYPE_QUEEN: if (menu.showDebugQueen) break; else continue;
            case TYPE_SPIDER: if (menu.showDebugSpider) break; else continue;
            default: continue;
        }
        ctx.strokeStyle = TILE_COLORS[tile.type];            
        var srcPx = hexToPix({q:move.sq, r:move.sr});
        var dstPx = hexToPix({q:move.dq, r:move.dr});
        ctx.beginPath();
        ctx.moveTo(srcPx.x, srcPx.y);			
        ctx.lineTo(dstPx.x, dstPx.y);
        ctx.stroke();
    }
}
		




