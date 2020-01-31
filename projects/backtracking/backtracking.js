async function solve(row = 0, col = 0) {
    if (col >= canvas.board.length) {
        row += 1;
        col = 0;
        if (row >= canvas.board[col].length) {
            return true;
        }  
    }
    if (canvas.board[row][col] != 0) {  // Won't check if board is written incorrectly, can be made to do so at performance cost
        if (await solve(row, col + 1)) {
            return true;
        } else {
            return false;
        }
    }

    for (let i = 1; i <= 9; i++) {
        if (validplacement(i, row, col)) {
            if (canvas.halt){return true;}

            canvas.board[row][col] = i;
            await asyncDraw();

            if (await solve(row, col + 1)) {
                return true;
            }
        }
        if (canvas.halt){return true;}

        canvas.board[row][col] = 0;
        await asyncDraw();
    }
    return false;
}

async function asyncDraw(){
    await new Promise(r => setTimeout(r, 30));
    redrawCanvas();
}

function validplacement(numb, row, col) {
    for (let i = 0; i < canvas.board[row].length; i++) {
        if (canvas.board[row][i] == numb) {return false;}
    }

    let column = []
    for (let i = 0; i < canvas.board.length; i++) {
        column.push(canvas.board[i][col]);
    }
    for (let i = 0; i < column.length; i++) {
        if (column[i] == numb) {return false;}
    }

    quadrow = Math.floor(row / 3) * 3;
    quadcol = Math.floor(col / 3) * 3;
    let quad = [[],[],[]]
    for (let i = quadrow; i < quadrow+3; i++) {
        for (let j = quadcol; j < quadcol+3; j++) {
            quad[i - quadrow][j - quadcol] = canvas.board[i][j];
        }
    }
    for (let i = 0; i < quad.length; i++) {
        for (let j = 0; j < quad[i].length; j++) {
            if (quad[i][j] == numb) {return false;}
        }
    }
    return true;
}


function main() {
    let board = getNewBoard();
    setupCanvas(board);
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

function setupCanvas(board){
    canvas = document.getElementById("sodoku");
    canvas.board = board;
    canvas.gridSize = 450
    canvas.cellSize = 50
    canvas.margin = 5
    canvas.buttons = [new Button("Run", buttonRun, 60, 480, 85, 40), new Button("New", buttonNew, 320, 480, 92, 40), new Button("Blank", buttonBlank, 176, 480, 110, 40)];
    canvas.dim = canvas.getBoundingClientRect();
    canvas.halt = false;
    canvas.selectedRow = NaN;
    canvas.selectedColumn = NaN;
    ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    drawCanvas();
    canvas.addEventListener('click', clickedMouse);
    document.addEventListener('keyup', pressedKey);
}


function drawCanvas(){
    drawGrid(canvas.margin, canvas.margin, canvas.gridSize + canvas.margin, canvas.gridSize + canvas.margin);
    drawTextOnGrid();
    for(let i = 0; i < canvas.buttons.length; i++){
        drawButton(canvas.buttons[i]);
    }
    drawSelected();
}

function drawSelected(){
    if(!isNaN(canvas.selectedRow)){
        ctx.beginPath();
        x = (canvas.selectedColumn * canvas.cellSize) + canvas.margin;
        y = (canvas.selectedRow * canvas.cellSize) + canvas.margin;
        ctx.lineWidth = 7;
        ctx.rect(x, y, canvas.cellSize, canvas.cellSize);
        ctx.stroke();
    }
}

function clearSelected(){
    canvas.selectedRow = NaN;
    canvas.selectedColumn = NaN;
}

function redrawCanvas(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCanvas();
}

function drawLine(x1, y1, x2, y2){
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawGrid(x1, y1, x2, y2){
    for (let i = 0; i < 10; i++){
        if (i % 3 == 0){ctx.lineWidth = 5;}
        else {ctx.lineWidth = 3;}
        drawLine(x1 + (canvas.cellSize * i), y1, x1 + (canvas.cellSize * i), y2);
        drawLine(x1, y1 + (canvas.cellSize * i), x2, y1 + (canvas.cellSize * i));
    }
}

function drawTextOnGrid(){
    for (let i = 0; i < 9; i++){
        for (let j = 0; j < 9; j++){
            if(canvas.board[i][j] != 0){
                drawText(canvas.board[i][j], (canvas.cellSize * i) + 19, (canvas.cellSize * j) + 48);
            }
        }
    }
}

function drawText(text, x, y, font = "40px arial"){
    ctx.font = font;
    ctx.fillText(text, x, y);
}

function drawButton(button){
    ctx.lineWidth = 3;
    ctx.rect(button.x, button.y, button.width, button.height);
    ctx.stroke();
    drawText(button.text, button.x + canvas.margin, button.y + button.height - canvas.margin);
}

function clickedMouse(evt) {
    var mousePos = getMousePos(evt);
    if(mousePos.y >= canvas.gridSize + canvas.margin){
       clickedButton(mousePos); 
    }
    else{
        clickedBoard(mousePos);
    }
}

function clickedButton(mousePos){
    for(let i = 0; i < canvas.buttons.length; i++){
        if(isOnRect(mousePos, canvas.buttons[i])){
            canvas.buttons[i].func();
        }
    }
}

function clickedBoard(mousePos){
    canvas.selectedColumn = Math.floor((mousePos.x - canvas.margin) / canvas.cellSize);
    canvas.selectedRow = Math.floor((mousePos.y - canvas.margin) / canvas.cellSize);
    redrawCanvas();
}

function unsolvable(){
    drawText("Unsolvable", 8, 260, "90px arial");
}

async function buttonRun(){
    canvas.halt = false;
    clearSelected();
    let solvable = await solve();
    console.log(solvable);
    if(!solvable){
        unsolvable();
    }
}

function buttonNew(){
    canvas.halt = true;
    canvas.board = getNewBoard();
    clearSelected();
    redrawCanvas();
}

function buttonBlank(){
    canvas.board = [Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0), Array(9).fill(0)];
    clearSelected();
    redrawCanvas();
}

function isOnRect(pos, rect){
    return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y;
}

function getMousePos(evt){
    let rect = canvas.getBoundingClientRect();
    mousePos.x = Math.floor(evt.clientX - rect.left);
    mousePos.y = Math.floor(evt.clientY - rect.top);
    return mousePos;
}

function pressedKey(evt){
    key = Number(evt.code.charAt(evt.code.length - 1))
    if (!isNaN(key) && !isNaN(canvas.selectedRow)){
        if (validplacement(key, canvas.selectedColumn, canvas.selectedRow)){
            canvas.board[canvas.selectedColumn][canvas.selectedRow] = key;
            redrawCanvas();
        }
    }
}

class MousePosition{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}

class Button{
    constructor(text, func, x, y, width, height){
        this.text = text;
        this.func = func;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

let canvas;
let ctx;
let mousePos = new MousePosition(0, 0);

document.addEventListener("DOMContentLoaded", main);
