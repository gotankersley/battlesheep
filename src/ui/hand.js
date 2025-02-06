import { BUTTON_LEFT } from './mouse.js';

var COLOR_HAND_BACKGROUND = 'rgba(100, 100, 100, 0.3)';
//var COLOR_TILE_HIGHLIGHT = '#ffffe0';
var COLOR_HAND_HIGHLIGHT = 'lightgreen';
var COLOR_HAND_HIGHLIGHT2 = 'green';
var COLOR_HAND_SELECTED = 'red';
var COLOR_HAND_TEXT = '#000';
export const HAND_SIZE_X = 70;

var HAND_TILE_X = 70;
var HAND_TILE_Y = 50;
var HAND_MARGIN_Y = 10;
var HAND_HALF_TILE_X = HAND_TILE_X/2;
var HAND_HALF_TILE_Y = HAND_TILE_Y/2;
var HAND_HOVER_SIZE = 10;

//Class Hand
export class Hand {
    
    constructor(container) {
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
    }

    onMouseMove = (e) => {

        var x = e.clientX - window.mouse.canvasBounds.left; 
        var y = e.clientY - window.mouse.canvasBounds.top;        
        this.hover = Math.floor((y-HAND_MARGIN_Y)/HAND_TILE_Y);
        
    }

    onMouseDown = (e) => {
        if (e.button == BUTTON_LEFT) { 
            var x = e.clientX - window.mouse.canvasBounds.left; 
            var y = e.clientY - window.mouse.canvasBounds.top;
            this.selected = Math.floor((y-HAND_MARGIN_Y)/HAND_TILE_Y);            
        }
    }

    draw = (selectedToken) => {   
         
        var ctx = this.ctx;
        ctx.clearRect(0, 0, HAND_SIZE_X, CANVAS_SIZE_Y);
        ctx.fillStyle = COLOR_HAND_BACKGROUND;
        ctx.fillRect(0, 0, HAND_SIZE_X, CANVAS_SIZE_Y);
        ctx.font = 'bold 18px arial'; 
        
        if (selectedToken >= 0) { 
            var token = game.board.tokens[selectedToken];
            var count = token.count;
            
                        
            for (var h = 0; h < count; h++) {
                var y = (h * HAND_TILE_Y) + HAND_MARGIN_Y;                                
                
                //Selected
                if (this.selected == h) {                                   
                    ctx.fillStyle = COLOR_HAND_SELECTED;  
                    ctx.strokeStyle = COLOR_HAND_SELECTED;                       
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
