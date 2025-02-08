//Random Player
export function getPlay (board, onPlayed) {

    var moves = board.getMoves();    

	if (moves.length) {
        var randMove = moves[Math.floor(Math.random() * moves.length)];	//Random spot	
		randMove.count = Math.floor(Math.random() * randMove.count) //Random split
		

        onPlayed(randMove);
	}
	else {
		alert('no moves available');
		return {};
	}
	

}


