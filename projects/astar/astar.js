function main(){
    var canvas = new fabric.Canvas('canvas');
    canvas.hoverCursor = 'pointer';
    Tile.size = (canvas.width / 10);
    var board = [[], [], [], [], [], [], [], [], [], []]
    for(let i = 0; i < 10; i++){
        for(let j = 0; j < 10; j++){
            board[i][j]=new Tile(j, i);
            board[i][j].outer.selectable = false;
            board[i][j].inner.selectable = false;
            canvas.add(board[i][j].outer);
            canvas.add(board[i][j].inner);
        }
    }

    canvas.on('mouse:down', function(e){
        clickedMouse(e, board);
    });

}

function clickedMouse(e, board){
    var mousePos = e.pointer;
    if (mousePos.y < Tile.size * board[0].length) {
        x = Math.floor(Math.ceil(mousePos.x) / Tile.size);
        if(x == 10){x = 9;} //Ugly fix, but better than leaving a bug
        y = Math.floor(Math.ceil(mousePos.y) / Tile.size);
        console.log(x,y)
    }
}

class Tile{
    static border = 4;
    static size = 0;
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.closed = false;
        this.parent = null;
        this.obstacle = false;
        
        this.value = 0;
        this.neighbours = [];

        this.outer = new fabric.Rect({
            left: x * Tile.size,
            top: y * Tile.size,
            fill: 'black',
            width: Tile.size,
            height: Tile.size
        });
        this.inner = new fabric.Rect({
            left: (x * Tile.size) + (Tile.border / 2),
            top: (y * Tile.size) + (Tile.border / 2),
            fill: 'red',
            width: Tile.size - Tile.border,
            height: Tile.size - Tile.border
        });
    }
    
}

document.addEventListener("DOMContentLoaded", main);