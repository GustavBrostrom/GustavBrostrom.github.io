function solve(row, col, board, step) {
    if (col >= board.length) {
        row += 1;
        col = 0;
        if (row >= board[col].length) {
            return true;
        }  
    }
    if (board[row][col] != 0) {  // Won't check if board is written incorrectly, can be made to do so at performance cost
        if (solve(row, col + 1, board, step)) {
            return true;
        } else {
            return false;
        }
    }

    for (let i = 1; i <= 9; i++) {
        board[row][col] = i;
        if (validplacement(row, col, board)) {
            if (step){

            }
            if (solve(row, col + 1, board, step)) {
                return true;
            }
        }
        board[row][col] = 0;
    }
    return false;
}


function validplacement(row, col, board) {
    for (let i = 0; i < board[row].length; i++) {
        if (i == col) { continue; }
        if (board[row][i] == board[row][col]) {return false;}
    }

    let column = []
    for (let i = 0; i < board.length; i++) {
        column.push(board[i][col]);
    }
    for (let i = 0; i < column.length; i++) {
        if (i == row) { continue; }
        if (column[i] == board[row][col]) {return false;}
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
            if ((i == row - quadrow) && (j == col - quadcol)) {continue;}
            if (quad[i][j] == board[row][col]) {return false;}
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
    canvas.buttons = [new Button("Run", buttonRun, 60, 480, 85, 40), new Button("New", buttonNew, 300, 480, 95, 40)];
    canvas.dim = canvas.getBoundingClientRect();
    ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    drawCanvas();
    canvas.addEventListener('click', clickedMouse);
}


function drawCanvas(evt){
    drawGrid(10, 10, 460, 460);
    stepSize = 50;
    for (let i = 0; i < 9; i++){
        for (let j = 0; j < 9; j++){
            if(canvas.board[i][j] != 0){
                drawText(canvas.board[i][j], (stepSize * i) + 24, (stepSize * j) + 53);
            }
        }
    }
    for(let i = 0; i < canvas.buttons.length; i++){
        drawButton(canvas.buttons[i]);
    }
}


function redrawCanvas(evt){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCanvas(canvas.board);
}


function drawLine(x1, y1, x2, y2){
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}


function drawGrid(x1, y1, x2, y2){
    xStep = (x2 - x1) / 9;
    yStep = (y2 - y1) / 9;
    for (let i = 0; i < 10; i++){
        if (i % 3 == 0){ctx.lineWidth = 5;}
        else {ctx.lineWidth = 3;}
        drawLine(x1 + (xStep * i), y1, x1 + (xStep * i), y2);
        drawLine(x1, y1 + (yStep * i), x2, y1 + (yStep * i));
    }
}


function drawText(text, x, y){
    ctx.font = "40px arial";
    ctx.fillText(text, x, y);
}

function drawButton(button){
    ctx.rect(button.x, button.y, button.width, button.height);
    ctx.stroke();
    drawText(button.text, button.x + 5, button.y + button.height - 5);
}

function clickedMouse(evt) {
    var mousePos = getMousePos(evt);
    clickedButton(mousePos);
}

function clickedButton(mousePos){
    for(let i = 0; i < canvas.buttons.length; i++){
        if(isOnRect(mousePos, canvas.buttons[i])){
            canvas.buttons[i].func();
        }
    }
}

function buttonRun(){
    let x = solve(0, 0, canvas.board, false);
    redrawCanvas();
}

function buttonNew(){
    canvas.board = getNewBoard();
    redrawCanvas();
}

function buttonStep(){
    let x = solve(0, 0, canvas.board, true);
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


let canvas;
let ctx;
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

let mousePos = new MousePosition(0, 0);

document.addEventListener("DOMContentLoaded", main);
