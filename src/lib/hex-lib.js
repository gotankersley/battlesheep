//Constants
export const INVALID = -1;
 
export const ORIENT_FLAT = 0; //Slanty - Row
export const ORIENT_POINTY = 1; //Slanty - Col
 
export const HEXAGON = 6; 
export const HEX_SIZE_SMALLEST = 10;
export const HEX_SIZE_LARGEST = 100;



//INIT 
window.WORLD_X = 0;
window.WORLD_Y = 0;
setHex(ORIENT_FLAT, 60); //Initialize constants
//

export function setHex(orient, newSize) {
    
	newSize = Math.min(HEX_SIZE_LARGEST, newSize);
	newSize = Math.max(HEX_SIZE_SMALLEST, newSize);
	
	//NOTE: Global variable definitions	
	window.HEX_SIDE = newSize;	 //Length of the hexagon side
	
	if (orient == ORIENT_FLAT) setOrient_F();
	else setOrient_P();
		
	window.HEX_PADDING = Math.min(window.HEX_SIDE / 20, 0); 	
		
	window.HEX_TILE_CENTER_X = window.HEX_TILE_X / 2;
	window.HEX_TILE_CENTER_Y = window.HEX_TILE_Y / 2;
	
	setVerts();	//Requires padding to be set
}


function setOrient_F() {
	window.HEX_ANGLE = 0;
	
	window.HEX_UNIT_X = window.HEX_SIDE/2; //30-60-90 triangle formula - short leg
	window.HEX_UNIT_Y = window.HEX_SIDE/2*Math.sqrt(3); //30-60-90 triangle formula - long leg
			
	window.HEX_CENTER_GAP_X = 3 * window.HEX_UNIT_X;
	window.HEX_CENTER_GAP_Y = window.HEX_UNIT_Y;

	window.HEX_SIZE_X = 2 * window.HEX_SIDE;
	window.HEX_SIZE_Y = 2 * window.HEX_UNIT_Y;	
	
	window.HEX_DOUBLE_GAP_X = 3 * window.HEX_SIDE;
	
	window.HEX_TILE_X = window.HEX_SIZE_X - 2;		
	window.HEX_TILE_Y = window.HEX_SIZE_Y;
	
	window.WORLD_INIT_X = window.HEX_SIZE_X + window.HEX_CENTER_GAP_X;
	window.WORLD_INIT_Y = window.HEX_SIZE_Y;
	
	//Function aliases
	window.pixToHex = pixToHex_F;
	window.hexToPix = hexToPix_F;
}

function setOrient_P() {
	window.HEX_ANGLE = 30;
	
	window.HEX_UNIT_X = window.HEX_SIDE/2*Math.sqrt(3); //30-60-90 triangle formula - long leg
	window.HEX_UNIT_Y = window.HEX_SIDE/2; //30-60-90 triangle formula - short leg
			
	window.HEX_CENTER_GAP_X = window.HEX_UNIT_X;
	window.HEX_CENTER_GAP_Y = 3 * window.HEX_UNIT_Y;

	window.HEX_SIZE_X = 2 * window.HEX_UNIT_X;	
	window.HEX_SIZE_Y = 2 * window.HEX_SIDE;
	
	window.HEX_DOUBLE_GAP_Y = 3 * window.HEX_SIDE;
		
	window.HEX_TILE_X = window.HEX_SIZE_Y - 2; //This is needed to preserve the aspect ratio
	window.HEX_TILE_Y = window.HEX_SIZE_X;
	
	window.WORLD_INIT_X = window.HEX_SIZE_X;
	window.WORLD_INIT_Y = window.HEX_SIZE_Y + window.HEX_CENTER_GAP_Y;
	
	//Function aliases
	window.pixToHex = pixToHex_P; 
	window.hexToPix = hexToPix_P;
}

function setVerts() {
	window.HEX_VERTS_X = [];
	window.HEX_VERTS_Y = [];
	for (var i = 1; i <= 6; i++) {
		var deg = (i * 60) + window.HEX_ANGLE;
		var rad = Math.PI/180*deg;
		var size = window.HEX_SIDE - window.HEX_PADDING;
		window.HEX_VERTS_X.push(Math.cos(rad) * size);
		window.HEX_VERTS_Y.push(Math.sin(rad) * size);		
	}		
}

export function fillHex(ctx, x, y, color) {
	let hexVertsX = window.HEX_VERTS_X;
	let hexVertsY = window.HEX_VERTS_Y;
    
	ctx.fillStyle = color; 	
	ctx.beginPath();	
    
	ctx.moveTo (x + hexVertsX[5], y + hexVertsY[5]); //Start at the end				  
	ctx.lineTo (x + hexVertsX[0], y + hexVertsY[0]);
	ctx.lineTo (x + hexVertsX[1], y + hexVertsY[1]);
	ctx.lineTo (x + hexVertsX[2], y + hexVertsY[2]);
	ctx.lineTo (x + hexVertsX[3], y + hexVertsY[3]);
	ctx.lineTo (x + hexVertsX[4], y + hexVertsY[4]);
	ctx.lineTo (x + hexVertsX[5], y + hexVertsY[5]);
		
	ctx.fill();  	
	
}

export function strokeHex(ctx, x, y, color, width) {
    let hexVertsX = window.HEX_VERTS_X;
	let hexVertsY = window.HEX_VERTS_Y;
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.beginPath();	
	ctx.moveTo (x + hexVertsX[5], y + hexVertsY[5]); //Start at the end				  
	ctx.lineTo (x + hexVertsX[0], y + hexVertsY[0]);
	ctx.lineTo (x + hexVertsX[1], y + hexVertsY[1]);
	ctx.lineTo (x + hexVertsX[2], y + hexVertsY[2]);
	ctx.lineTo (x + hexVertsX[3], y + hexVertsY[3]);
	ctx.lineTo (x + hexVertsX[4], y + hexVertsY[4]);
	ctx.lineTo (x + hexVertsX[5], y + hexVertsY[5]);
	
	ctx.stroke(); 
}

//Hex struct
function Hex(q, r) {
	var s = -q - r;
	return {q: q, r: r, s: s};
}
	
function hexRound(h) {
	var q = Math.trunc(Math.round(h.q));
	var r = Math.trunc(Math.round(h.r));
	var s = Math.trunc(Math.round(h.s));
	
	var q_diff = Math.abs(q - h.q);
	var r_diff = Math.abs(r - h.r);
	var s_diff = Math.abs(s - h.s);
	
	if (q_diff > r_diff && q_diff > s_diff) q = -r - s;
	else if (r_diff > s_diff) r = -q - s;
			
	return {q:q, r:r};
}


function pixToHex_F(x, y) { //Screen px to axial
	x -= WORLD_X;
	y -= WORLD_Y;
	var r = (-x / 3 + Math.sqrt(3)/3 * y) / window.HEX_SIDE;
	var q = x * 2/3 / window.HEX_SIDE;
	return hexRound(Hex(q, r))
}

function pixToHex_P(x, y) { //Screen px to axial
	x -= WORLD_X;
	y -= WORLD_Y;
	var r = y * 2/3 / window.HEX_SIDE;
	var q = (x * Math.sqrt(3)/3 - y / 3) / window.HEX_SIDE;
	return hexRound(Hex(q, r))
}

function hexToPix_F(h) { //Axial to screen (rounded to nearest pixel)
	return {
		x:Math.floor(window.HEX_SIDE * 3/2 * h.q) + WORLD_X,
		y:Math.floor(window.HEX_SIDE * Math.sqrt(3) * (h.r + h.q/2)) + WORLD_Y
	};	
}

function hexToPix_P(h) { //Axial to screen (rounded to nearest pixel)
	return {
		x:Math.floor(window.HEX_SIDE * Math.sqrt(3) * (h.q + h.r/2)) + WORLD_X,
		y:Math.floor(window.HEX_SIDE * 3/2 * h.r) + WORLD_Y
	};	
}


