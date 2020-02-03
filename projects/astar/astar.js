function main(){
    var canvas = new fabric.Canvas('canvas');
    canvas.hoverCursor = 'pointer';

    var openTiles = [];
    var closedTiles = [];
    var board = [];
    Tile.count = 20
    Tile.size = (canvas.width / Tile.count);

    for(let y = 0; y < Tile.count; y++){
        board.push([]);
        for(let x = 0; x < Tile.count; x++){
            board[y][x]=new Tile(x, y);
            board[y][x].outer.selectable = false;
            board[y][x].inner.selectable = false;
            canvas.add(board[y][x].outer);
            canvas.add(board[y][x].inner);
        }
    }
    var buttons = [new Button("Run", buttonRun, 60, Tile.size * Tile.count, 85, 40), new Button("Reset", buttonReset, 360, Tile.size * Tile.count, 115, 40)];
    for(let i in buttons){
        buttons[i].group.selectable = false;
        canvas.add(buttons[i].group);
    }

    init(board, openTiles);
    canvas.on('mouse:down', function(e){
        clickedMouse(e, board, openTiles, closedTiles, buttons);
    });
}

async function astar(board, openTiles, closedTiles){
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
            currentTile.path = true;
            currentTile.update();

            while(currentTile.parent !== null){
                currentTile = currentTile.parent;
                currentTile.path = true;
                //await asyncDraw(currentTile);

                currentTile.update();
                path.push(currentTile);
            }
            return path;
        }
        currentTile.toClosed(openTiles, closedTiles);
        currentTile.update();
        let neighbours = currentTile.getNeighbours(board, openTiles, closedTiles);

        for(let i in neighbours){
            let edge = 14;
            if(neighbours[i].x == currentTile.x || neighbours[i].y == currentTile.y){edge = 10;}
            let x = currentTile.g + edge;
            
            let index = -1;
            for(let tile = 0; tile < openTiles.length; tile++){
                if(neighbours[i] === openTiles[tile]){
                    index = tile;
                    break;
                }
            }

            if(index == -1){
                openTiles.push(neighbours[i]);
                neighbours[i].g = x;
                neighbours[i].parent = currentTile;
            }else if(x < neighbours[i].g){
                console.log("g improved");
                neighbours[i].g = x;
                neighbours[i].parent = currentTile;

            }

            neighbours[i].h = distance([Tile.end.x, Tile.end.y], [neighbours[i].x, neighbours[i].y]);
            neighbours[i].update();
        }
    }
}

async function asyncDraw(c){
    c.update();
    await new Promise(r => setTimeout(r, 30));
}

function distance(pos1, pos2){
    let dx = Math.abs(pos1[0] - pos2[0]);
    let dy = Math.abs(pos1[1] - pos2[1]);

    let diagonal = Math.min(dx, dy);
    let straight = Math.max(dx, dy) - diagonal;

    return (diagonal * 14) + (straight * 10); //Ints are better
}

function init(board, openTiles){
    let start = board[Tile.count - 1][0];
    let end = board[0][Tile.count - 1];
    Tile.start = start;
    start.update();
    openTiles.push(start);
    Tile.end = end;
    end.update();
    start.h = start.f = end.g = end.f = distance([start.x, start.y], [end.x, end.y]);
}

function clickedMouse(e, board, openTiles, closedTiles, buttons){
    var mousePos = e.pointer;

    if (mousePos.y < Tile.size * board[0].length) {
        clickedBoard();
    }else{
        clickedButton();
    }

    function clickedButton(){
        for(let i = 0; i < buttons.length; i++){
            if(isOnRect(mousePos, buttons[i])){
                buttons[i].func(board, openTiles, closedTiles);
                break;
            }
        }

        function isOnRect(pos, rect){
            return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y;
        }
    }

    function clickedBoard(){
        let x = Math.floor(Math.ceil(mousePos.x) / Tile.size);
        if(x == Tile.count){x--;} //Ugly fix, but better than leaving a bug
        let y = Math.floor(Math.ceil(mousePos.y) / Tile.size);
        board[y][x].toggleObstacle();
    }
}

function buttonRun(board, openTiles, closedTiles){
    let x = astar(board, openTiles, closedTiles);
}

function buttonReset(board, openTiles, closedTiles){
    for(let y = 0; y < Tile.count; y++){
        for(let x = 0; x < Tile.count; x++){
            board[y][x].g = board[y][x].f = Number.MAX_SAFE_INTEGER;
            board[y][x].h = 0;
            board[y][x].open = board[y][x].closed = board[y][x].obstacle = board[y][x].path = false;
            board[y][x].neighbours = [];
            board[y][x].update();
        }
    }
    openTiles.length = 0;
    openTiles.push(Tile.start)
    closedTiles.length = 0;
}

class Tile{
    static border = 4;
    static size = 0;
    static count = 0;
    static start = null;
    static end = null;

    constructor(x, y){
        this.x = x;
        this.y = y;
        this.f = Number.MAX_SAFE_INTEGER;
        this.g = Number.MAX_SAFE_INTEGER;
        this.h = 0;
        this.open = false;
        this.closed = false;
        this.parent = null;
        this.obstacle = false;
        this.path = false;
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
            this.inner.set('fill', 'teal');
        }else if(this === Tile.end){
            this.inner.set('fill', 'darkviolet');
        }else if(this.path == true){
            this.inner.set('fill', 'green');
        }else if(this.obstacle){
            this.inner.set('fill', 'blue');
        }else if(this.closed){
            this.inner.set('fill', 'black');
        }else if(this.open){
            this.inner.set('fill', 'yellow');
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
        //this.neighbours = []; //Could try to find a way to cache, maybe compare with templist instead?
        if(this.neighbours != []){
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

                    this.neighbours.push(neighbour);
                }
            }
        }
        return this.neighbours;
    }
}

class Button{
    constructor(text, func, x, y, width, height){
        this.func = func;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;



        this.button = new fabric.Rect({
            fill: 'black',
            width: width,
            height: height,
            originY: 'center'
        });

        this.text = new fabric.Text(text, {
            fontSize: '50',
            fill: 'green',
            originY: 'center'
        });

        this.group = new fabric.Group([this.button, this.text], {
            left: x,
            top: y
        });
    }
}

document.addEventListener("DOMContentLoaded", main);