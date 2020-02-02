function main(){
    var canvas = new fabric.Canvas('canvas');
    canvas.hoverCursor = 'pointer';

    var openTiles = [];
    var closedTiles = [];
    var board = [[], [], [], [], [], [], [], [], [], []];

    Tile.size = (canvas.width / 10);
    for(let i = 0; i < 10; i++){
        for(let j = 0; j < 10; j++){
            board[i][j]=new Tile(j, i);
            board[i][j].outer.selectable = false;
            board[i][j].inner.selectable = false;
            canvas.add(board[i][j].outer);
            canvas.add(board[i][j].inner);
        }
    }

    init(board, openTiles);
    canvas.on('mouse:down', function(e){
        clickedMouse(e, board);
    });

    let x = astar(board, openTiles, closedTiles);

    console.log(x);
}

function astar(board, openTiles, closedTiles){
    openTiles[0].getNeighbours(board, openTiles, closedTiles);
    while (openTiles.length > 0){
        let currentTile = openTiles[0];

        for(let i in openTiles){ //tile has no f yet
            let tile = openTiles[i];
            if(tile.f < currentTile.f || (tile.f == currentTile.f && tile.h < currentTile.h)){
                currentTile = tile;
            }
        }

        if(currentTile === Tile.end){
            let path = [currentTile];
            console.log(currentTile.parent);
            while(currentTile.parent !== null){
                currentTile = currentTile.parent;
                path.push(currentTile);
            }
            return path;
        }
        currentTile.toClosed(openTiles, closedTiles);
        let neighbours = currentTile.getNeighbours(board, openTiles, closedTiles);
    }
}

function distance(pos1, pos2){
    let dx = Math.abs(pos1[0] - pos2[0]);
    let dy = Math.abs(pos1[1] - pos2[1]);

    let diagonal = Math.min(dx, dy);
    let straight = Math.max(dx, dy) - diagonal;

    return (diagonal * 14) + (straight * 10); //Ints are better
}

function init(board, openTiles){
    let start = board[9][0];
    let end = board[0][9];
    Tile.start = start;
    start.update();
    openTiles.push(start);
    Tile.end = end;
    start.h = start.f = end.g = end.f = distance([start.x, start.y], [end.x, end.y]);
}

function clickedMouse(e, board){
    var mousePos = e.pointer;
    if (mousePos.y < Tile.size * board[0].length) {
        let x = Math.floor(Math.ceil(mousePos.x) / Tile.size);
        if(x == 10){x = 9;} //Ugly fix, but better than leaving a bug
        let y = Math.floor(Math.ceil(mousePos.y) / Tile.size);
        board[y][x].toggleObstacle();
        console.log(x,y)
    }
}

class Tile{
    static border = 4;
    static size = 0;
    static start = null;
    static end = null;

    constructor(x, y){
        this.x = x;
        this.y = y;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.open = false;
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

    update(){
        if(this === Tile.start){
            console.log("start")
        }else if(this === Tile.end){
            console.log("end")
        }else if(this.obstacle){
            this.inner.set('fill', 'blue');
        }else if(this.closed){
            this.inner.set('fill', 'black');
        }else if(this.open){
            this.inner.set('fill', 'green');
        }else{
            this.inner.set('fill', 'red');
        }

        this.f = this.g + this.h;
    }

    toOpen(openTiles){
        openTiles.push(this);
        this.open = true;
        this.update();
    }

    toClosed(openTiles, closedTiles){
        let index = openTiles.indexOf(this);
        if(index != -1){
            openTiles.splice(index, 1);
        }
        this.open = false;
        closedTiles.push(this);
        this.closed = true;
        this.update();
    }

    toggleObstacle(){
        this.obstacle = !this.obstacle;
        this.update();
    }

    getNeighbours(board, openTiles, closedTiles){
        this.neighbours = []; //Could try to find a way to cache, maybe compare with templist instead?
        for(let y = (this.y - 1); y <= (this.y + 1); y++){
            for(let x = (this.x - 1); x <= (this.x + 1); x++){
                if(x == this.x && y == this.y){continue;}

                let xNotOnBoard = (x < 0 || x >= board.length);
                let yNotOnBoard = (y < 0 || y >= board[0].length);
                if(xNotOnBoard || yNotOnBoard){continue;}

                let neighbour = board[y][x];

                let flag = false; //Ugly, but needed to continue the correct loop
                for(let i in closedTiles){
                    let tile = closedTiles[i];
                    if(tile === neighbour){
                        flag = true;
                    }
                }
                if(flag){continue;}

                if(neighbour.obstacle){continue;}

                let tempTile = new Tile(neighbour.x, neighbour.y);
                tempTile.g = distance([Tile.start.x, Tile.start.y], [tempTile.x, tempTile.y]);

                this.neighbours.push(neighbour);

                let index = -1;
                for(let tile = 0; tile < openTiles.length; tile++){
                    if(neighbour === openTiles[tile]){
                        index = tile;
                    }
                }
                if(index == -1){
                    openTiles.push(neighbour);
                    neighbour.g = tempTile.g;
                    neighbour.parent = this;
                }
                else if(tempTile.g < openTiles[index].g){
                    openTiles[index].g = tempTile.g;
                    neighbour.parent = this;
                }
                neighbour.h = distance([Tile.end.x, Tile.end.y], [neighbour.x, neighbour.y]);
                neighbour.update();
            }
        }

        return this.neighbours;
    }
}

document.addEventListener("DOMContentLoaded", main);