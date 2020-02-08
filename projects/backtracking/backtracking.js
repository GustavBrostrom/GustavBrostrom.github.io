async function solve(canvas, board, y, x) {
    if (x >= board.length) {
        y += 1;
        x = 0;
        if (y >= board[x].length) {
            return true;
        }  
    }
    
    if (board[y][x].number != 0) {  // Won't check if board is written incorrectly, can be made to do so at performance cost
        if (await solve(canvas, board, y, x + 1)) {
            return true;
        } else {
            return false;
        }
    }

    for (let i = 1; i <= 9; i++) {
        if (validplacement(i, x, y, board)) {
            if (canvas.halt){return true;}

            board[y][x].setNumber(i);
            await asyncDraw(canvas);

            if (await solve(canvas, board, y, x + 1)) {
                return true;
            }
        }
        if (canvas.halt){return true;}

        board[y][x].setNumber(0);
        await asyncDraw(canvas);
    }
    return false;


    async function asyncDraw(canvas){
        await new Promise(r => setTimeout(r, 20));
        canvas.renderAll();
    }
}

function validplacement(numb, x, y, board) {
    for (let i = 0; i < board[y].length; i++) {
        if (board[y][i].number == numb) {return false;}
    }

    let column = []
    for (let i = 0; i < board.length; i++) {
        column.push(board[i][x]);
    }
    for (let i = 0; i < column.length; i++) {
        if (column[i].number == numb) {return false;}
    }

    quadrow = Math.floor(y / 3) * 3;
    quadcol = Math.floor(x / 3) * 3;
    let quad = [[],[],[]]
    for (let i = quadrow; i < quadrow+3; i++) {
        for (let j = quadcol; j < quadcol+3; j++) {
            quad[i - quadrow][j - quadcol] = board[i][j];
        }
    }
    for (let i = 0; i < quad.length; i++) {
        for (let j = 0; j < quad[i].length; j++) {
            if (quad[i][j].number == numb) {return false;}
        }
    }
    return true;
}

async function getNewBoard(){
    board = [[], [], [], [], [], [], [], [], []]
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", "sudoku.csv", false); //Change to async
    xmlhttp.send();
    if (xmlhttp.status==200) {
      result = xmlhttp.responseText;
    }
    let puzzles = result.split("\n")
    number = Math.floor(Math.random() * 10000);
    lineBoard = puzzles[number];
    for (let i = 0; i < 9; i++){
        for (let j = 0; j < 9; j++){
            board[i][j] = Number(lineBoard.charAt((i*9) + j));
        }
    }
    return board;
}

async function main(){
    'use strict';
    let canvas = new fabric.Canvas('sudoku');
    let boardValues = await getNewBoard();
    let board = [];
    canvas.hoverCursor = 'pointer';
    canvas.renderOnAddRemove=false
    canvas.skipTargetFind=false;
    canvas.selection = false;
    canvas.halt = false;

    Cell.size = Math.floor((canvas.width / 9));
    let gridSize = Cell.size * 9
    const BUTTON_HEIGHT = 40
    let buttons = [new Button("Run", buttonRun, 60, gridSize, 85, BUTTON_HEIGHT), new Button("New", buttonNew, 320, gridSize, 92, BUTTON_HEIGHT), new Button("Blank", buttonBlank, 176, gridSize, 110, BUTTON_HEIGHT)];
    for(let i in buttons){canvas.add(buttons[i].group);}
    setBoard(canvas, board, boardValues);

    let guides = [[], []];
    drawGuide(canvas, guides);

    Cell.selectedCell = null;

    canvas.on('mouse:down', function(e){
        clickedMouse(e.pointer, board, buttons, canvas);
    });
    document.addEventListener('keyup', function (e){
        pressedKey(e, canvas, board);
    });
    
    canvas.renderAll();
}

function setBoard(canvas, board, boardValues){
    for(let y = 0; y < 9; y++){
        board.push([]);
        for(let x = 0; x < 9; x++){
            board[y][x]=new Cell(x, y);
            canvas.add(board[y][x].cell);
            canvas.add(board[y][x].text);
            board[y][x].setNumber(boardValues[y][x]);
            
            canvas.renderAll();
        }
    }
}

function drawGuide(canvas, guides){
    let width = 5;
    let center = (width - 1) / 2;
    let color = 'black';
    for(let i = 0; i < 4; i++){
        guides[1][i] = new fabric.Line([0, ((i * 3) * Cell.size) - center, Cell.size * 9, ((i * 3) * Cell.size) - center], {
            strokeWidth: width,
            stroke: color
        });
        guides[1][i].selectable = false;
        canvas.add(guides[1][i]);

        guides[0][i] = new fabric.Line([((i * 3) * Cell.size) - center, 0, ((i * 3) * Cell.size) - center, Cell.size * 9], {
            strokeWidth: width,
            stroke: color
        });
        guides[0][i].selectable = false;
        canvas.add(guides[0][i]);
    }
}

function clearSelected(){
    Cell.selectedCell = null;
}

function clickedMouse(mousePos, board, buttons, canvas){
    let isOnBoard = (mousePos.y < Cell.size * board[0].length);
    if (isOnBoard) {
        Cell.selectedCell = getMouseCell(mousePos, board);
    }else{
        clickedButton();
    }

    function clickedButton(){
        for(let i = 0; i < buttons.length; i++){
            if(isOnRect(mousePos, buttons[i])){
                buttons[i].func(canvas, board);
            }
        }

        function isOnRect(pos, rect){
            return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y;
        }
    }

    function getMouseCell(mousePos, board){
        let x = Math.floor(Math.ceil(mousePos.x) / Cell.size);
        let y = Math.floor(Math.ceil(mousePos.y) / Cell.size);
        return board[y][x];
    }
}


async function buttonRun(canvas, board){
    canvas.halt = false;
    clearSelected();
    let solvable = await solve(canvas, board, 0, 0);
    if(!solvable){
        unsolvable(canvas);
    }
    
    function unsolvable(canvas){
        let x = new fabric.Text("Unsolvable", {
            fontSize: '90',
            fill: 'red',
            left: 0,
            top: 3.5 * Cell.size,
            fontFamily: 'arial'
        });
        x.width = 400; //Weird bug
        canvas.add(x);
        canvas.renderAll();
    }
}

async function buttonNew(canvas, board){
    canvas.halt = true;
    boardValues = await getNewBoard();
    replaceBoard(board, boardValues);
    clearSelected();

    function replaceBoard(board, boardValues){
        for(let y = 0; y < 9; y++){
            for(let x = 0; x < 9; x++){
                board[y][x].setNumber(boardValues[y][x]);
            }
        }
    }
}

function buttonBlank(canvas, board){
    canvas.halt = true;
    for(let y = 0; y < 9; y++){
        for(let x = 0; x < 9; x++){
            board[y][x].setNumber(0);
        }
    }
    clearSelected();
}

function pressedKey(evt, canvas, board){
    let key = evt.code;
    if(key == "Backspace"){
        board[Cell.selectedCell.y][Cell.selectedCell.x].setNumber(0);
    }else{
        let num = Number(key.charAt(evt.code.length - 1));
        if (!isNaN(num) && Cell.selectedCell !== null){
            if(num == 0){
                board[Cell.selectedCell.y][Cell.selectedCell.x].setNumber(0);
            }else if (validplacement(num, Cell.selectedCell.x, Cell.selectedCell.y, board)){
                board[Cell.selectedCell.y][Cell.selectedCell.x].setNumber(num);
            }
        }
    }

    canvas.renderAll();
}

class Cell{
    static size = 0;
    static selectedCell = null;

    constructor(x, y){
        this.x = x;
        this.y = y;
        this.number = "0";

        this.cell = new fabric.Rect({
            left: x * Cell.size,
            top: y * Cell.size,
            fill: 'white',
            width: Cell.size,
            height: Cell.size,
            stroke : 'black',
            strokeWidth : 2
        });

        this.text = new fabric.Text(this.number, {
            fontSize: '45',
            fill: 'black',
            left: (x * Cell.size) + (Cell.size * 0.22),
            top: y * Cell.size,
            fontFamily: 'arial'
        });

        this.cell.selectable = false;
        this.text.selectable = false;
    }

    setNumber(number){
        this.number = String(number);
        if(this.number == "0"){
            this.text.set('text', "");
        }else{
            this.text.set('text', this.number);
        }
    }

    update(){
        console.log("x");
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
