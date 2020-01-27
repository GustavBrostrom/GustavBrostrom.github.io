function solve(row, col, board) {
    if (col >= board.length) {
        row += 1;
        col = 0;
        if (row >= board[col].length) {
            return true;
        }  
    }
    if (board[row][col] != 0) {  // Won't check if board is written incorrectly, can be made to do so at performance cost
        if (solve(row, col + 1, board)) {
            return true;
        } else {
            return false;
        }
    }

    for (let i = 1; i <= 9; i++) {
        board[row][col] = i;
        if (validplacement(row, col, board)) {
            if (solve(row, col + 1, board)) {
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
    let board = [[5, 3, 4, 6, 7, 8, 9, 1, 2],
                 [6, 7, 2, 1, 9, 5, 3, 4, 8],
                 [1, 9, 8, 3, 4, 2, 5, 6, 7],
                 [8, 5, 9, 7, 6, 1, 4, 2, 3],
                 [4, 2, 6, 8, 5, 3, 7, 9, 1],
                 [7, 1, 3, 9, 2, 4, 8, 5, 6],
                 [9, 6, 1, 5, 3, 7, 2, 8, 4],
                 [2, 8, 7, 4, 1, 9, 6, 3, 5],
                 [3, 4, 5, 2, 8, 6, 1, 7, 9]];

    let x = solve(0, 0, board)
    console.log(x);
    console.log(board);

    setupCanvas(board);
}


let canvas;
let ctx;
class MousePosition{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}

let mousePos = new MousePosition(0, 0);

function setupCanvas(board){
    canvas = document.getElementById("sodoku");
    canvas.board = board;
    ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    drawCanvas(board);
    canvas.addEventListener("mousemove", redrawCanvas);
}

function drawCanvas(evt){
    drawGrid(10, 10, 460, 460);
    stepSize = 50;
    for (let i = 0; i < 9; i++){
        for (let j = 0; j < 9; j++){
            drawText(canvas.board[i][j], (stepSize * i) + 20, (stepSize * j) + 53);
        }
    }
    ctx.fillRect(120, 480, 50, 50)
    ctx.fillRect(300, 480, 50, 50)
}

function redrawCanvas(evt){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCanvas(canvas.board);
    getMousePos(evt);
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
    for (let i = 0; i <= 9; i++){
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

function getMousePos(evt){
    let canvasDim = canvas.getBoundingClientRect();
    mousePos.x = Math.floor(evt.clientX - canvasDim.left);
    mousePos.y = Math.floor(evt.clientY - canvasDim.top);
    return mousePos;
}

document.addEventListener("DOMContentLoaded", main);
