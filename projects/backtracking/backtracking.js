async function solve(canvas, board, y = 0, x = 0) {
    if (x >= board.length) {
        y += 1;
        x = 0;
        if (y >= board[x].length) {
            return true;
        }  
    }
    
    if (board[y][x] != 0) {  // Won't check if board is written incorrectly, can be made to do so at performance cost
        if (await solve(canvas, board, y, x + 1)) {
            return true;
        } else {
            return false;
        }
    }

    for (let i = 1; i <= 9; i++) {
        if (validplacement(i, y, x)) {
            if (halt){return true;}

            board[y][x] = i;
            await asyncDraw(canvas);

            if (await solve(canvas, board, y, x + 1)) {
                return true;
            }
        }
        if (halt){return true;}

        board[y][x] = 0;
        await asyncDraw();
    }
    return false;
}

async function asyncDraw(){
    await new Promise(r => setTimeout(r, 10));
    canvas.renderAll();
}

function validplacement(numb, row, col) {
    for (let i = 0; i < board[row].length; i++) {
        if (board[row][i] == numb) {return false;}
    }

    let column = []
    for (let i = 0; i < board.length; i++) {
        column.push(board[i][col]);
    }
    for (let i = 0; i < column.length; i++) {
        if (column[i] == numb) {return false;}
    }

    quadrow = Math.floor(row / 3) * 3;
    quadcol = Math.floor(col / 3) * 3;
    let quad = [[],[],[]]
    for (let i = quadrow; i < quadrow+3; i++) {
        for (let j = quadcol; j < quadcol+3; j++) {
            quad[i - quadrow][j - quadcol] = board[i][j];
        }
    }
    for (let i = 0; i < quad.length; i++) {
        for (let j = 0; j < quad[i].length; j++) {
            if (quad[i][j] == numb) {return false;}
        }
    }
    return true;
}

function getNewBoard(){
    board = [[], [], [], [], [], [], [], [], []]
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", "sudoku.csv", false);  // Change to async
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

function main(){
    'use strict';
    let canvas = new fabric.Canvas('sudoku');
    let boardValues = getNewBoard();
    let board = [];
    canvas.hoverCursor = 'pointer';
    //canvas.renderOnAddRemove=false
    canvas.skipTargetFind=false;
    canvas.selection = false;
    
    let cells = 9
    Cell.size = Math.floor((canvas.width / cells));
    console.log(Cell.size)
    const BUTTON_HEIGHT = 40
    let buttons = [new Button("Run", buttonRun, 60, 480, 85, 40), new Button("New", buttonNew, 320, 480, 92, 40), new Button("Blank", buttonBlank, 176, 480, 110, 40)];
    for(let i in buttons){canvas.add(buttons[i].group);}

    for(let y = 0; y < cells; y++){
        board.push([]);
        for(let x = 0; x < cells; x++){
            board[y][x]=new Cell(x, y);
            board[y][x].number = String(boardValues[y][x]);
            //board[y][x].group.selectable = false;
            //canvas.add(board[y][x].group);
            board[y][x].cell.selectable = false;
            canvas.add(board[y][x].cell);
            board[y][x].text.selectable = false;
            canvas.add(board[y][x].text);
            
            canvas.renderAll();
        }
    }

    let halt = false;
    let selectedCell = null;

    canvas.on('mouse:down', function(e){
        clickedMouse(e.pointer, board, buttons, canvas, selectedCell);
    });
    document.addEventListener('keyup', pressedKey);
    canvas.renderAll();
}

function clearSelected(){
    selectedRow = NaN;
    selectedColumn = NaN;
}

function clickedMouse(mousePos, board, buttons, canvas, selectedCell){
    let isOnBoard = (mousePos.y < Cell.size * board[0].length);
    if (isOnBoard) {
        selectedCell = getMouseCell(mousePos, board);
        console.log(selectedCell)
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

function unsolvable(){
    drawText("Unsolvable", 8, 260, "90px arial");
}

async function buttonRun(canvas, board){
    console.log(board)
    halt = false;
    clearSelected();
    let solvable = await solve(canvas, board);
    if(!solvable){
        unsolvable();
    }
}

function buttonNew(canvas, board){
    halt = true;
    board = getNewBoard();
    clearSelected();
}

function buttonBlank(canvas, board){
    halt = true;
    board = [Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0)];
    clearSelected();
}

function pressedKey(evt){
    key = Number(evt.code.charAt(evt.code.length - 1))
    if (!isNaN(key) && !isNaN(selectedRow)){
        if (validplacement(key, selectedColumn, selectedRow)){
            board[selectedColumn][selectedRow] = key;
            redrawCanvas();
        }
    }
}

class Cell{
    static border = 1;
    static size = 0;

    constructor(x, y){
        this.x = x;
        this.y = y;
        this.number = "0";

        this.cell = new fabric.Rect({
            left: x * Cell.size,
            top: y * Cell.size,
            fill: 'orange',
            width: Cell.size - Cell.border,
            height: Cell.size - Cell.border,
            stroke : 'black',
            strokeWidth : 2
        });

        this.text = new fabric.Text(this.number, {
            fontSize: '45',
            fill: 'black',
            left: x * Cell.size + 13,
            top: y * Cell.size,
            fontFamily: 'arial'
        });

        //this.group = new fabric.Group([this.cell, this.text], {
        //    left: x,
        //    top: y
        //});
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
