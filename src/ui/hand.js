import { BUTTON_LEFT } from './mouse.js';

var COLOR_HAND_BACKGROUND = 'rgba(100, 100, 100, 0.3)';
var COLOR_TILE_HIGHLIGHT = '#ffffe0';
export const HAND_SIZE_X = 70;

var HAND_TILE_X = 60;
var HAND_TILE_Y = 60;
var HAND_MARGIN_Y = 5;
var HAND_HALF_TILE_X = HAND_TILE_X/2;
var HAND_HALF_TILE_Y = HAND_TILE_Y/2;
var HAND_HOVER_SIZE = 10;

//Class Hand
export class Hand {
    
    constructor(container, player) {
        this.canvas = document.getElementById(container);		
        this.ctx = this.canvas.getContext('2d');  					
        this.player = player;        
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
        if (e.button == BUTTON_LEFT) { 
            var x = e.clientX - window.mouse.canvasBounds.left; 
            var y = e.clientY - window.mouse.canvasBounds.top;
            //if (this.player == game.hive.turn || Mouse.ctrlOn) this.hover = Math.floor((y-HAND_MARGIN_Y)/HAND_TILE_Y);
        }
    }

    onMouseDown = (e) => {
        var x = e.clientX - window.mouse.canvasBounds.left; 
        var y = e.clientY - window.mouse.canvasBounds.top;
        //if (this.player == game.hive.turn || Mouse.ctrlOn) {
        //    this.selected = Math.floor((y-HAND_MARGIN_Y)/HAND_TILE_Y);
        //    window.mouse.selected = null;
        //}
    }

    draw = (e) => {   
        //TODO: collapse into number?
        
        var ctx = this.ctx;
        ctx.clearRect(0, 0, HAND_SIZE_X, CANVAS_SIZE_Y);
        ctx.fillStyle = COLOR_HAND_BACKGROUND;
        ctx.fillRect(0, 0, HAND_SIZE_X, CANVAS_SIZE_Y);
        
        var player = this.player;
        
        //var hand = window.game.board.hands[player];	
        
        var tileImages = tileSet.activeImages[player];

        //Highlight selected - draw layer below 
        //for (var h = 0; h < hand.length; h++) {
        //    var y = (h * HAND_TILE_Y) + HAND_MARGIN_Y;
        //            
        //    if (this.selected == h) {
        //        ctx.fillStyle = COLOR_TILE_HIGHLIGHT;
        //        ctx.beginPath();
        //        ctx.arc(HAND_HALF_TILE_X + 3, y + HAND_HALF_TILE_Y + 3, HAND_HALF_TILE_X + 6, HAND_HALF_TILE_Y + 6, 0, 2*Math.PI);
        //        ctx.fill();			
        //    }
        //}
        
        for (var h = 0; h < 4; h++) {
            var y = (h * HAND_TILE_Y) + HAND_MARGIN_Y;
            //Bounding box target
            //ctx.strokeStyle = '#000';
            //ctx.strokeRect( 0, y, HAND_TILE_X, HAND_TILE_Y);
                    
            //var tile = hand[h];
            var tileImage = tileImages[h];//tile.type];
            if (this.hover == h || this.selected == h) ctx.drawImage(tileImage, 0, y , HAND_TILE_X + HAND_HOVER_SIZE, HAND_TILE_Y + HAND_HOVER_SIZE);				
            else ctx.drawImage(tileImage, 0, y, HAND_TILE_X, HAND_TILE_Y);			
        }
            
        
    }
}
//End class Hand
