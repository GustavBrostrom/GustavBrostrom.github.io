function main(){
    let canvas = new fabric.Canvas('canvas');
    canvas.hoverCursor = 'pointer';
    canvas.renderOnAddRemove=false
    canvas.skipTargetFind=false;
    canvas.selection = false;

    let openTiles = [];
    let closedTiles = [];
    let board = [];
    Tile.count = 30;
    Tile.size = (canvas.width / Tile.count);
    let mouseDrag = false;
    let mouseTile = null;
    let newTile = null

    for(let y = 0; y < Tile.count; y++){
        board.push([]);
        for(let x = 0; x < Tile.count; x++){
            board[y][x]=new Tile(x, y);
            board[y][x].inner.selectable = false;
            canvas.add(board[y][x].inner);
        }
    }

    const BUTTON_HEIGHT = 40
    let buttons = [new Button("Run", buttonRun, 50, Tile.size * Tile.count, 85, BUTTON_HEIGHT), new Button("Reset", buttonReset, 730, Tile.size * Tile.count, 120, BUTTON_HEIGHT), new Button("Random", buttonRandom, 530, Tile.size * Tile.count, 172, BUTTON_HEIGHT)];
    let distField = new Button("Dist: ", null, 140, Tile.size * Tile.count, 200, BUTTON_HEIGHT);
    for(let i in buttons){canvas.add(buttons[i].group);}
    canvas.add(distField.group);

    init(board, openTiles, closedTiles);

    canvas.on('mouse:down', function(e){
        let mousePos = e.pointer;
        let isOnBoard = (mousePos.y < Tile.size * board[0].length);
        if(isOnBoard){mouseTile = getMouseTile(mousePos, board);}
        mouseDrag = true;

        clickedMouse(mousePos, board, openTiles, closedTiles, buttons, distField, isOnBoard, canvas);
    });

    canvas.on('mouse:move', function(e){
        let mousePos = e.pointer;
        let isOnBoard = (mousePos.y < Tile.size * board[0].length);
        if(isOnBoard){newTile = getMouseTile(mousePos, board);}

        if(mouseDrag && isOnBoard && newTile !== mouseTile){
            mouseTile = newTile;
            mouseTile.toggleObstacle();
            canvas.renderAll();
        }
    });

    canvas.on('mouse:up', function(e){mouseDrag = false;});

    canvas.renderAll();
}

async function asyncDraw(canvas){
    await new Promise(r => setTimeout(r, 5));
    canvas.renderAll();
}

async function astar(board, openTiles, closedTiles, canvas){
    while (openTiles.length > 0){
        await asyncDraw(canvas);

        let currentTile = openTiles[0];
        for(let i in openTiles){
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
                neighbours[i].g = x;
                neighbours[i].parent = currentTile;
            }

            neighbours[i].h = distance([Tile.end.x, Tile.end.y], [neighbours[i].x, neighbours[i].y]);
            neighbours[i].update();
        }
    }
    return [];
}

function distance(pos1, pos2){
    let dx = Math.abs(pos1[0] - pos2[0]);
    let dy = Math.abs(pos1[1] - pos2[1]);

    let diagonal = Math.min(dx, dy);
    let straight = Math.max(dx, dy) - diagonal;

    return (diagonal * 14) + (straight * 10); //Ints are better
}

function init(board, openTiles, closedTiles){
    let start = board[Tile.count - 1][0];
    let end = board[0][Tile.count - 1];
    start.g = end.h = 0;
    start.h = start.f = end.g = end.f = distance([start.x, start.y], [end.x, end.y]);
    openTiles.length = closedTiles.length = 0;
    Tile.start = start;
    start.update();
    openTiles.push(start);
    Tile.end = end;
    end.update();
}

function getMouseTile(mousePos, board){
    let x = Math.floor(Math.ceil(mousePos.x) / Tile.size);
    if(x == Tile.count){x--;} //Ugly fix, but better than leaving a bug
    let y = Math.floor(Math.ceil(mousePos.y) / Tile.size);
    return board[y][x];
}

function clickedMouse(mousePos, board, openTiles, closedTiles, buttons, distField, isOnBoard, canvas){
    if (isOnBoard) {
        clickedBoard();
    }else{
        clickedButton();
    }

    function clickedButton(){
        for(let i = 0; i < buttons.length; i++){
            if(isOnRect(mousePos, buttons[i])){
                buttons[i].func(board, openTiles, closedTiles, distField, canvas);
                break;
            }
        }

        function isOnRect(pos, rect){
            return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y;
        }
    }

    function clickedBoard(){
        let tile = getMouseTile(mousePos, board);
        tile.toggleObstacle();
    }
}

async function buttonRun(board, openTiles, closedTiles, distField, canvas){
    let path = await astar(board, openTiles, closedTiles, canvas);
    if(path.length != 0){
        displayDist(path[0].g, distField);
        canvas.renderAll();
    }else{
        displayDist(NaN, distField);
        canvas.renderAll();
    }
}

function buttonReset(board, openTiles, closedTiles, distField){
    for(let y = 0; y < Tile.count; y++){
        for(let x = 0; x < Tile.count; x++){
            board[y][x].g = board[y][x].f = Number.MAX_SAFE_INTEGER;
            board[y][x].h = 0;
            board[y][x].open = board[y][x].closed = board[y][x].obstacle = board[y][x].path = false;
            board[y][x].neighbours = [];
            board[y][x].update();
        }
    }
    displayDist("", distField);
    init(board, openTiles, closedTiles);
}

function buttonRandom(board, openTiles, closedTiles, distField){
    buttonReset(board, openTiles, closedTiles, distField);
    for(let i = 0; i < 60; i++){
        let x = Math.ceil(Math.random() * (Tile.count - 4)) + 1
        let y = Math.ceil(Math.random() * (Tile.count - 4)) + 1
        for(let i = -1; i <= 1; i++){
            for(let j = -1; j <= 1; j++){ 
                board[y + j][x + i].toggleObstacle();
            }
        }
    }
}

function displayDist(d, distField){
    distField.text.set('text', "Dist:" + d);
}

class Tile{
    static border = 1;
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

        this.inner = new fabric.Rect({
            left: (x * Tile.size) + (Tile.border / 2),
            top: (y * Tile.size) + (Tile.border / 2),
            fill: 'orange',
            width: Tile.size - Tile.border,
            height: Tile.size - Tile.border,
            stroke : 'black',
            strokeWidth : 2
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
            this.inner.set('fill', 'orange');
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
        if(this.neighbours != []){
            for(let y = (this.y - 1); y <= (this.y + 1); y++){
                for(let x = (this.x - 1); x <= (this.x + 1); x++){
                    if(x == this.x && y == this.y){continue;}

                    let xNotOnBoard = (x < 0 || x >= board.length);
                    let yNotOnBoard = (y < 0 || y >= board[0].length);
                    if(xNotOnBoard || yNotOnBoard){continue;}

                    let neighbour = board[y][x];
                    if(neighbour.obstacle){continue;}
                    if(closedTiles.includes(neighbour)){continue;}

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
            fill: 'grey',
            width: width,
            height: height,
            originY: 'center',
            stroke : 'black',
            strokeWidth : 2
        });

        this.text = new fabric.Text(text, {
            fontSize: '45',
            fill: 'black',
            originY: 'center',
            fontFamily: 'arial'
        });

        this.group = new fabric.Group([this.button, this.text], {
            left: x,
            top: y
        });
        
        this.group.selectable = false;
    }
}

document.addEventListener("DOMContentLoaded", main);