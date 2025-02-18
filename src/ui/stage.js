import { setHex, fillHex, strokeHex, ORIENT_FLAT, ORIENT_POINTY, INVALID } from '../lib/hex-lib.js';
import * as Url from '../lib/url-lib.js';
import { MenuManager } from './menu.js';
import { TileSet } from './tile-set.js';
import { Board, PLAYER1, PLAYER2, EMPTY, MODE_TILE, MODE_PLACE, MODE_MOVE, TILE_ROTATIONS, TILE_QUAD } from '../core/board.js';
import { Game, EVENT_MOVED, EVENT_PLACED, EVENT_TILED, EVENT_GAME_OVER, EVENT_NO_MOVES, EVENT_MODE_CHANGED } from '../core/game.js';
import { PLAYER_HUMAN } from '../players/players.js';
import { Mouse, BUTTON_LEFT, BUTTON_RIGHT } from './mouse.js';
import { Hand, HAND_SIZE_X } from './hand.js';



//Constants
const COLOR_GRID = '#e0e0e0';
const COLOR_BLACK = '#000';
const COLOR_MOUSE = 'rgba(0, 0, 255, 0.1)'
;
const COLOR_TILE = 'lightgreen';
const COLOR_TILE_ACTIVE = '#32CD32';
const COLOR_TILE_BORDER = 'green';
const COLOR_TILE_PERIMETER = 'lightgreen';
const COLOR_TILE_INTERSECTS = '#8F9779';

const COLOR_TOKEN_SELECTED = 'red';
const COLOR_TOKEN_SELECTED2 = '#007FFF';
const COLOR_TOKEN_BY_PLAYER = [COLOR_TOKEN_SELECTED, COLOR_TOKEN_SELECTED2];

const KEY_DELETE = 46;
const KEY_T = 84;
const KEY_ARROW_LEFT = 37;
const KEY_ARROW_RIGHT = 39;
const KEY_SPACE = 32;

const MESSAGE_DURATION = 3000; //MS
const DELAY_MOVE = 200;


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
var hand;
var paused = false;
var $message;
var tileQuadRot = 0;
var tileDest = null;
var tilePerimeter = null;
var noMovesWarned = false;
	

export function createStage(containerId) { 
    //Menu
    var menuManager = new MenuManager();
    
    window.menu = menuManager.properties;
    setHex(menu.orientation, HEX_SIDE);
    
    //Message popup
    $message = document.getElementById('message');
    
    //Hand
    hand = new Hand('hand', onHandClicked);
    
    
    canvas = document.getElementById(containerId);	
    window.mouse = new Mouse(canvas);
    onWindowResize(); //Set canvas size
    
    WORLD_X = Math.floor(CANVAS_SIZE_X/3)+HEX_SIZE_X; //Move origin to more center of the screen
    WORLD_Y = 100;//Math.floor(CANVAS_SIZE_Y/2)+HEX_SIZE_Y;
    
    ctx = canvas.getContext('2d');   
    
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onWindowResize, false );
    window.addEventListener('keydown', onKeyDown, false);    
    canvas.addEventListener('mousedown', onMouseDown, false );	
    canvas.oncontextmenu = function (e) { //Disable right clicking
        mouse.selected = null;
        mouse.selectedToken = INVALID;
        e.preventDefault();
    };
            
    //Url
    Url.init(function(e) {
        var hash = window.location.hash.replace('#', '');
        try {
            window.game.board = Board.fromString(hash); 
            window.modesController.setValue(game.board.mode);            
        }
        catch (err) {
            showMessage(err);
            window.game = new Game('');
        }
    });
    
    var boardStr = '';
    if (performance.navigation.type == 0) { //First time on this page
        var hash = window.location.hash.replace('#', '');
        if (hash.length > 1) boardStr = hash;		
        else Url.setHash(''); //Clear state
    }
    else Url.setHash('');  //Refresh - clear state
                      	
			
    
    //Game events	
    try {
        window.game = new Game(boardStr);
    }
    catch (err) {
        showMessage(err);
        window.game = new Game('');
    }
    window.game.addEventListener(EVENT_TILED, onTiled);
    window.game.addEventListener(EVENT_PLACED, onPlaced);
    window.game.addEventListener(EVENT_MOVED, onMoved);
    window.game.addEventListener(EVENT_GAME_OVER, onGameOver);
    window.game.addEventListener(EVENT_MODE_CHANGED, onModeChanged);
    window.game.addEventListener(EVENT_NO_MOVES, onNoMovesForPlayer);
    window.modesController.setValue(game.board.mode);
    
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
	
	
const onWindowResize = () => {
    window.CANVAS_SIZE_X = window.innerWidth - window.CANVAS_MARGIN_X;
    window.CANVAS_SIZE_Y = window.innerHeight - window.CANVAS_MARGIN_Y;
            
    //Grid
    canvas.width = window.CANVAS_SIZE_X;
    canvas.height = window.CANVAS_SIZE_Y;
    
    //Hand
    var handCanvas = hand.canvas;                           
    handCanvas.style.left = (CANVAS_SIZE_X - HAND_SIZE_X) + 'px';		
    handCanvas.width = HAND_SIZE_X;								
    handCanvas.height = CANVAS_SIZE_Y;    
        
    //Boundary (for culling)
    mouse.setBounds();
    
    //Message 								
    $message.style.left = HAND_SIZE_X + 'px';
    $message.style.width = (CANVAS_SIZE_X - 160) + 'px';
}
	
const onFocus = () => {
    paused = false;
    requestAnimationFrame(draw); 
}

const onBlur = () => {
    paused = true;
}

const onMouseDown = (e) => {	
    
    if (game.players[game.board.turn] != PLAYER_HUMAN) {
        showMessage('Waiting for other player to play...');            
    }
    else if (game.board.mode == MODE_TILE) onClickedTileMode(e);
    else if (game.board.mode == MODE_PLACE) onClickedPlaceMode(e);
    else if (game.board.mode == MODE_MOVE) onClickedMoveMode(e);            
}

function onClickedTileMode(e) {
    if (e.ctrlKey) return;
    
    if (e.button == BUTTON_LEFT) {
        var validateTile = game.board.isValidTile(mouse.axial, tileQuadRot);
        if (validateTile.status) {
            game.makeTile(mouse.axial, tileQuadRot);
        }
        else showMessage(validateTile.msg);
    }
    else if (e.button === BUTTON_RIGHT) {
        if (tileQuadRot < TILE_ROTATIONS-1) tileQuadRot++;
        else tileQuadRot = 0;
    }

}

function onClickedPlaceMode(e) {
    
    if (e.button == BUTTON_LEFT) {	
        var board = game.board;
        var player = board.turn;   
        
        var pos = mouse.axial;   
        var posKey = pos.q + ',' + pos.r;
        if (board.tiles[posKey]) { //Valid tile
            var tile = board.tiles[posKey];            
            if (tile.tokenId == EMPTY) { //Is tile occupied?
                var validatePlace = game.board.isValidPlace(pos);
                if (validatePlace.status) {
                    game.makePlace(pos, mouse.ctrlOn);
                }
                else showMessage(validatePlace.msg);
            }
            else showMessage('Token may not be placed on same tile as another token');
        }
    }
}


function onClickedMoveMode(e) {
    if (e.button == BUTTON_LEFT) {	
        var board = game.board;
        var player = board.turn;        
     
        
        //See if a (new) token has been selected
        var pos = mouse.axial;   
        var posKey = pos.q + ',' + pos.r;
        if (board.tiles[posKey]) { //Valid tile
            var tile = board.tiles[posKey];            
            if (tile.tokenId != EMPTY) { //Is tile occupied?
                var token = board.tokens[tile.tokenId];
                if (mouse.ctrlOn) { //Navigation
                    mouse.selected = {q:pos.q, r:pos.r}; 
                    mouse.selectedToken = tile.tokenId;
                }
                else if (token.player != player) return; //Can't select opposite player's token                
                else if (mouse.selectedToken == tile.tokenId) { //De-Select
                    resetSelection();
                }
                else {
                    mouse.selected = {q:pos.q, r:pos.r}; //Make this tile the new selection                                                
                    mouse.selectedToken = tile.tokenId;
                }
            }
            else { //Tile is not occupied
                //Moving a token
                if (mouse.selected) {
                    if (hand.selected !== null) {
                        var src = mouse.selected;
                        var dst = pos;
                        var token = board.tokens[mouse.selectedToken];
                        var moveCount = token.count-(hand.selected+1);
                                     
                        //*Whew - now that we have all the input required, actually make the move
                        makeMove(src, dst, moveCount, mouse.ctrlOn);                        
                    }
                    //Alternate destination select style
                    else if (tileDest !== null && tileDest.q == pos.q && tileDest.r == pos.r) {
                        tileDest = null;
                    }
                    else tileDest = pos; 

                }
            }
        }
    }
}

function makeMove(src, dst, moveCount, override) {
    var validateMove = game.board.isValidMove(src, dst, moveCount);
    if (validateMove.status) {
        game.makeMove(src, dst, moveCount, mouse.ctrlOn);
    }
    else showMessage(validateMove.msg);
}

const onHandClicked = () => {
    if (tileDest !== null) {
        if (hand.selected !== null) {
            var token = game.board.tokens[mouse.selectedToken];
            var moveCount = token.count-(hand.selected+1);
            makeMove(mouse.selected, tileDest, moveCount, false); 
        }
    }
}
	

const onKeyDown = (e) => {	
    
	//console.log(e);		
    if (e.keyCode == KEY_T) {
        game.board.changeTurn();        
    }
    else if (e.ctrlKey && e.key == 'z') {
        game.undoMove();
    }
    else if (game.board.mode == MODE_TILE) {
        if (e.keyCode == KEY_ARROW_LEFT) {            
            if (tileQuadRot < TILE_ROTATIONS-1) tileQuadRot++;
            else tileQuadRot = 0;
        }
        else if (e.keyCode == KEY_ARROW_RIGHT) {
            if (tileQuadRot > 0) tileQuadRot--;
            else tileQuadRot = TILE_ROTATIONS-1;            
        }    
        //else if (e.keyCode == KEY_SPACE) triggerClick();          
    }
    
}
	
//Game Events
const onTiled = (pos, tileRot, boardStr) => {        
    resetSelection();
    Url.setHash(boardStr);        
        
    setTimeout(game.play, DELAY_MOVE);		
}

const onPlaced = (pos, boardStr) => {        
    resetSelection();
    Url.setHash(boardStr);        
    
    setTimeout(game.play, DELAY_MOVE);		
}

const onMoved = (src, dst, boardStr) => {         
    resetSelection();   
    Url.setHash(boardStr);    
    
    setTimeout(game.play, DELAY_MOVE);		
}

const onGameOver = (winner, loser) => {
    resetSelection();	
    showMessage('Game OVER!');
    if (winner == PLAYER1) alert('Player1 has won');
    else if (winner == PLAYER2) alert('Player2 has won');
    else alert('Tie Game!');
    
}

const onModeChanged = (boardStr) => {    
    resetSelection();
    Url.setHash(boardStr);
    var mode = game.board.mode;
    if (mode == MODE_TILE) {
        showMessage('Place tile quads');
    }
    else if (mode == MODE_PLACE) {        
        tilePerimeter = game.board.getPerimeter(); //Cache to ease rendering    
        showMessage('Place tokens');
    }
    else if (mode == MODE_MOVE) {
        showMessage('Move tokens');
    }
    setTimeout(game.play, DELAY_MOVE);
}

const onNoMovesForPlayer = (player) => {
    if (!noMovesWarned) {
        var playerName = player == PLAYER1? 'Player 1' : 'Player 2';
        showMessage(playerName + ' has no moves, turn not changed');
        noMovesWarned = true;
    }
}

function resetSelection() {
    window.modesController.setValue(game.board.mode);
    hand.selected = null;
    hand.hover = null;
    tileDest = null;
    mouse.selected = null;		  
    mouse.selectedToken = INVALID;    
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
    var mode = game.board.mode;
    
    //Grid		
    if (menu.showGrid) {
        if (menu.orientation == ORIENT_FLAT) drawGrid_F();
        else drawGrid_P();
    }
    
    
    //Mouse
    drawMouse(); //Draw active hex at cursor location 								
         
    if (mode == MODE_TILE) {
        drawTiles();
        
        drawTileMode();        
        
        //Hand
        var tileKeys = Object.keys(game.board.tiles);
        var tileQuadsRemaining = 8-(tileKeys.length/TILE_QUAD); //Should always divide evenly
        hand.drawTile(tileQuadsRemaining);
    }
    else if (mode == MODE_PLACE) {
        
        //Tiles
        drawTilesPlaceMode();
        
        //Tokens
        drawPlaceToken();
        
        //Hand
        hand.drawPlace(game.board.playerTokens);
    }
    else if (mode == MODE_MOVE) {
        //Tiles
        drawTiles();
        
        if (tileDest) drawTileDest();
         
        
        //Tokens
        drawTokens();
        
        //Hand
        hand.drawMove(mouse.selectedToken);
    }

              
    ctx.restore();
    
    //Mouse coord		
    drawMouseCoords();
    
    //Turn
    drawTurn();    
    
    
    
    //Repaint
    if (!paused) requestAnimationFrame(draw); 
}
					
function drawGrid_F() {
    
    ctx.font = 'bold 12px arial';
        
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
    
    ctx.font = 'bold 12px arial';
    
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

function drawTileDest() {
    var px = hexToPix(tileDest);                       
    var color = COLOR_TOKEN_BY_PLAYER[game.board.turn];   
    strokeHex(ctx, px.x, px.y, color, 5);            
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

function drawTilesPlaceMode() {

    var posKeys = Object.keys(game.board.tiles);		    
    for (var t = 0; t < posKeys.length; t++) {
        var posKey = posKeys[t];
        var tile = game.board.tiles[posKey];
        var px = hexToPix(tile.pos);
                
        var color = tilePerimeter[posKey]? COLOR_TILE_PERIMETER : COLOR_TILE_ACTIVE;        
        fillHex(ctx, px.x, px.y, color);
        strokeHex(ctx, px.x, px.y, COLOR_TILE_BORDER, 5);	        
		
        if (menu.showCoordinates) {
            ctx.fillStyle = COLOR_BLACK;
            ctx.fillText(posKey, px.x, px.y); 
        }
    }
}

function drawTileMode() {
    
    var quadSplit = game.board.splitTileQuad(mouse.axial, tileQuadRot);
    var hexes = quadSplit.hexes;
    var initialColor;
    var otherColor;
    var borderColor;
    if ( !mouse.clickExited ) {
        initialColor = COLOR_TILE_ACTIVE;
        otherColor = COLOR_TILE;
        borderColor = COLOR_TILE_BORDER;
    }
    else if ( quadSplit.intersects) {
        initialColor = COLOR_TILE_INTERSECTS;
        otherColor = COLOR_TILE_INTERSECTS;   
        borderColor = COLOR_TOKEN_BY_PLAYER[game.board.turn];        
    }
    else {
        initialColor = COLOR_TILE_ACTIVE;
        otherColor = COLOR_TILE;
        borderColor = COLOR_TOKEN_BY_PLAYER[game.board.turn];
    }
    var color = initialColor;
    for (var h = 0; h < hexes.length; h++) {
        var hex = hexes[h];
        var px = hexToPix(hex);
        
        fillHex(ctx, px.x, px.y, color); 
        strokeHex(ctx, px.x, px.y, borderColor, 5); 
        color = otherColor;
    }
}


function drawTokens() {
    ctx.fillStyle = COLOR_BLACK;
    ctx.font = 'bold 14px arial';
    
    var board = game.board;
    var tokens = board.tokens;      
    for (var tokenId = 0; tokenId < tokens.length; tokenId++) {
        var token = tokens[tokenId];        
        var px = hexToPix(token.pos);                       
        //var tileType = token.count % 6;        
        tileSet.draw(ctx, px.x, px.y, token.player, token.count);
        
        //Highlight Selected
        if (mouse.selectedToken == tokenId) {
            var color = COLOR_TOKEN_BY_PLAYER[game.board.turn];   
            strokeHex(ctx, px.x, px.y, color, 5);    
        }        
                    
    }
   
}
	
function drawPlaceToken() {
    var board = game.board;
    
    //Cursor
    tileSet.draw(ctx, mouse.snap.x, mouse.snap.y, board.turn, INVALID);
    
    //Existing
    var tokens = board.tokens;      
    for (var tokenId = 0; tokenId < tokens.length; tokenId++) {
        var token = tokens[tokenId];        
        var px = hexToPix(token.pos);                       
              
        tileSet.draw(ctx, px.x, px.y, token.player, INVALID);
                    
    }
}
	

//function triggerClick() {    
//    var evt = new MouseEvent('mousedown', {
//        view: window,
//        bubbles: true,
//        cancelable: true,
//        button : BUTTON_LEFT
//    });
//    canvas.dispatchEvent(evt);
//}