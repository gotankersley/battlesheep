import { setHex, INVALID } from '../lib/hex-lib.js';

export const BUTTON_LEFT = 0;
export const BUTTON_MIDDLE = 1;
export const BUTTON_RIGHT = 2;

	
//Mouse class
export class Mouse {

    constructor(canvas) {
        //Mouse position in different coordinate systems
        this.axial = {q:0, r:0}; //Axial coords	
        this.snap = {x:0, y:0}; //Screen coords that are snapped to the nearest hex
        this.screen = {x:0, y:0}; //Screen coords	
        this.world = {x: 0, y:0}; //World coords 
        this.click = {x: 0, y: 0}; //Mouse down - screen coords
        this.clickPos = {q:0, r:0} //Mouse down - axial coords
        this.clickExited = true; //Mouse still in same hex after click
        this.dragging = false;
        this.selected = null;
        this.selectedToken = INVALID;
        this.ctrlOn = false;
        this.boundsX;
        this.boundsY;
	
	
		this.canvasBounds = canvas.getBoundingClientRect(); 
			
		
		//Events
		canvas.addEventListener('mousemove', this.onMouseMove, false );	
		canvas.addEventListener('mousedown', this.onMouseDown, false );	
		canvas.addEventListener('mouseup', this.onMouseUp, false );	
		canvas.addEventListener('mousewheel', this.onMouseWheel, false);
		canvas.addEventListener('mouseout', this.onMouseOut, false);
	}
		

	onMouseMove = (e) => {
		this.setCoords(e);

		if (this.dragging) {		
			window.WORLD_X = this.world.x-this.click.x;
			window.WORLD_Y = this.world.y-this.click.y;
		}
        else if (!this.clickExited) {
            if (this.clickPos.q != this.axial.q || this.clickPos.r != this.axial.r) {
                this.clickExited = true;                
            }
        }
	}

	onMouseDown = (e) => {	
		if (e.ctrlKey) this.ctrlOn = true;		
		this.setCoords(e);		
		
        this.clickPos.q = this.axial.q;
        this.clickPos.r = this.axial.r;
        this.clickExited = false;
        
		if  (e.ctrlKey || e.button == BUTTON_MIDDLE) { //Middle click
			
			this.click.x = this.world.x - window.WORLD_X;
			this.click.y = this.world.y - window.WORLD_Y;            
			this.dragging = true;
		}

		
	}

	onMouseUp = (e) => {
		this.ctrlOn = false;		
		this.dragging = false;  		
		
	}

	onMouseOut = (e) => {
		this.dragging = false;
	}

	onMouseWheel = (e) => {
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
			
		setHex(menu.orientation, HEX_SIDE + delta);
		this.setBounds();
		this.setCoords(e);
		e.preventDefault(); //Keep screen from scrolling
	}

	setCoords = (e) => {
		var x = e.clientX - this.canvasBounds.left; 
		var y = e.clientY - this.canvasBounds.top;
		
		this.screen = {x:x, y:y};	
		
		//Convert to world x,y (I.E., like if you had a REALLY big screen)
		x += window.WORLD_INIT_X; 
		y += window.WORLD_INIT_Y;
		
		
		this.world = {x:x, y:y};
		this.axial = window.pixToHex(x, y);	
		this.snap = window.hexToPix(this.axial);
	}

	
	setBounds = () => {	
		this.boundsX = window.CANVAS_SIZE_X + (3*window.HEX_SIZE_X);
		this.boundsY = window.CANVAS_SIZE_Y + (2*window.HEX_SIZE_Y);
	}
    
    onScreen = (x, y) => {
        if (x >= -window.HEX_SIZE_X && x < this.boundsX &&
            y >= -window.HEX_SIZE_Y && y < this.boundsY) return true;
        else return false;
    }
	
} //End Mouse class