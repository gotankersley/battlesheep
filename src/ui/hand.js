import { BUTTON_LEFT } from './mouse.js';

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
            this.selected = Math.floor((CANVAS_SIZE_Y-(y))/HAND_TILE_Y); 

            this.onClicked();
        }
    }
    
    drawTile = () => {
        var ctx = this.ctx;
        drawBackground(ctx);    
    }

    drawPlace = () => {
        var ctx = this.ctx;
        drawBackground(ctx);    
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