import { BUTTON_LEFT } from './mouse.js';
import { setHex, ORIENT_FLAT, fillHex, strokeHex } from '../lib/hex-lib.js';

const COLOR_HAND_BACKGROUND = 'rgba(100, 100, 100, 0.3)';

const COLOR_HAND_HIGHLIGHT = 'lightgreen';
const COLOR_HAND_HIGHLIGHT2 = 'green';
const COLOR_HAND_TEXT = '#000';
const COLOR_HAND_SELECTED = 'red';
const COLOR_HAND_SELECTED2 = '#007FFF';
const COLOR_HAND_BY_PLAYER = [COLOR_HAND_SELECTED, COLOR_HAND_SELECTED2];

export const HAND_SIZE_X = 70;

const HAND_TILE_X = HAND_SIZE_X;
const HAND_TILE_Y = 50;
const HAND_MARGIN_Y = 0;
const HAND_HALF_TILE_X = HAND_TILE_X/2;
const HAND_HALF_TILE_Y = HAND_TILE_Y/2;
const HAND_HOVER_SIZE = 10;


//Class Hand
export class Hand {
    
    constructor(container, onClicked) {
        this.canvas = document.getElementById(container);		
        this.ctx = this.canvas.getContext('2d');  					
        
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false );	
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), false );	
        var self = this;
        this.canvas.oncontextmenu = function (e) { //Disable context menu on right click	
            self.hover = null;
            self.selected = null;
            e.preventDefault();
        };
        this.hover = null;
        this.selected = null;  
        this.onClicked = onClicked;
    }

    onMouseMove = (e) => {

        var x = e.clientX - window.mouse.canvasBounds.left; 
        var y = e.clientY - window.mouse.canvasBounds.top;        
        this.hover = Math.floor((CANVAS_SIZE_Y-(y))/HAND_TILE_Y);
        
    }

    onMouseDown = (e) => {
        if (e.button == BUTTON_LEFT) { 
            var x = e.clientX - window.mouse.canvasBounds.left; 
            var y = e.clientY - window.mouse.canvasBounds.top;
            var tmpSelected = this.selected;
            this.selected = Math.floor((CANVAS_SIZE_Y-(y))/HAND_TILE_Y); 
            if (tmpSelected == this.selected) { //De-select
                this.hover = null;
                this.selected = null;  
            }
            else this.onClicked();
        }
    }
    
    drawTile = (tileQuadsRemaining) => {
        var ctx = this.ctx;
        drawBackground(ctx);   
        
        for (var t = 0; t < tileQuadsRemaining; t++) {
            var turn = t % 2;
            var y = (t * (HAND_TILE_Y + 10)) + HAND_MARGIN_Y + 15;
            
            
            //Miniature tile quad
            drawMiniHex(ctx, 40, y, COLOR_HAND_HIGHLIGHT, COLOR_HAND_HIGHLIGHT2, 2);	        
            drawMiniHex(ctx, 40, y + 21, COLOR_HAND_HIGHLIGHT, COLOR_HAND_HIGHLIGHT2, 2);	        
            drawMiniHex(ctx, 22, y + 10, COLOR_HAND_HIGHLIGHT, COLOR_HAND_HIGHLIGHT2, 2);	        
            drawMiniHex(ctx, 58, y + 10, COLOR_HAND_HIGHLIGHT, COLOR_HAND_HIGHLIGHT2, 2);	        
        }        
        	
    }

    drawPlace = (playerTokens) => {
        var ctx = this.ctx;
        drawBackground(ctx);    
        
        for (var turn = 0; turn < playerTokens.length; turn++) {
            if (!playerTokens[turn].length) {
                var y = (turn * (HAND_TILE_Y + 10)) + HAND_MARGIN_Y + 15;
                
                var tileImages = tileSet.activeImages[turn];
                var tileImage = tileImages[5];		
                ctx.drawImage(tileImage, 5, y, HAND_TILE_X - 10, HAND_TILE_Y);	
            }
        }
    }
    
    drawMove = (selectedToken) => {   
         
        var ctx = this.ctx;
        drawBackground(ctx);
        ctx.font = 'bold 18px arial'; 
        
        if (selectedToken >= 0) { 
            var token = game.board.tokens[selectedToken];
            var count = token.count-1; //Have to leave at least one
            
                        
            for (var h = 0; h < count; h++) {
                var y = CANVAS_SIZE_Y-(((h+1) * HAND_TILE_Y) + HAND_MARGIN_Y);  
                
                //Selected
                if (this.selected == h) {   
                    var color = COLOR_HAND_BY_PLAYER[token.player];
                    ctx.fillStyle = color;  
                    ctx.strokeStyle = color;                       
                    ctx.strokeRect( 0, y, HAND_TILE_X, HAND_TILE_Y);  	
                    ctx.fillText(count-h, HAND_HALF_TILE_X-5, y+HAND_HALF_TILE_Y+5);
                }
                
                //Hover
                else if (this.hover == h) {
                    ctx.fillStyle = COLOR_HAND_HIGHLIGHT2;   
                    ctx.strokeStyle = COLOR_HAND_HIGHLIGHT;                    
                    ctx.strokeRect( 0, y, HAND_TILE_X, HAND_TILE_Y); 
                    ctx.fillText(count-h, HAND_HALF_TILE_X-5, y+HAND_HALF_TILE_Y+5);                    
                }
                
                //Regular
                else {
                    ctx.fillStyle = COLOR_HAND_TEXT;  
                    ctx.strokeStyle = COLOR_HAND_TEXT;
                    ctx.strokeRect( 0, y, HAND_TILE_X, HAND_TILE_Y);                                       
                    ctx.fillText(count-h, HAND_HALF_TILE_X-5, y+HAND_HALF_TILE_Y+5);
                }
                
            }
        }           
        
    }
}
//End class Hand

    
function drawBackground(ctx) {
    ctx.clearRect(0, 0, HAND_SIZE_X, CANVAS_SIZE_Y);
    ctx.fillStyle = COLOR_HAND_BACKGROUND;
    ctx.fillRect(0, 0, HAND_SIZE_X, CANVAS_SIZE_Y);
}


function drawMiniHex(ctx, x, y, colorFill, colorStroke, width) {

    //Fill
    ctx.fillStyle = colorFill; 	
    ctx.beginPath();	    
	drawHex(ctx, x, y);
    ctx.fill();
    
    //Stroke
	ctx.strokeStyle = colorStroke;
	ctx.lineWidth = width;
	ctx.beginPath();	    
	drawHex(ctx, x, y);
	ctx.stroke();
}


function drawHex(ctx, x, y) {
    //Pre-computed using code below
	ctx.moveTo (x + 12, y + -2.9391523179536475e-15); 
	ctx.lineTo (x + 6.000000000000002, y + 10.392304845413264);
	ctx.lineTo (x + -5.999999999999997, y + 10.392304845413264);
	ctx.lineTo (x + -12, y + 1.4695761589768238e-15);
	ctx.lineTo (x + -6.000000000000005, y + -10.39230484541326);
	ctx.lineTo (x + 6.000000000000002, y + -10.392304845413264);
	ctx.lineTo (x + 12, y + -2.9391523179536475e-15);
}

//var savedHexSize = HEX_SIDE;
//setHex(ORIENT_FLAT, 12);
//strokeHex(ctx, 40, y, COLOR_HAND_HIGHLIGHT2, 2);	        
//strokeHex(ctx, 40, y + 21, COLOR_HAND_HIGHLIGHT2, 2);	        
//strokeHex(ctx, 22, y + 10, COLOR_HAND_HIGHLIGHT2, 2);	        
//strokeHex(ctx, 58, y + 10, COLOR_HAND_HIGHLIGHT2, 2);
//setHex(ORIENT_FLAT, savedHexSize);