import numpy as np


def solve(row, col, board):
    if col >= len(board[row]):
        row += 1
        col = 0
        if row >= len(board[col]):
            return True

    if board[row, col] != 0:  # Won't check if board is written incorrectly, can be made to do so at performance cost
        if solve(row, col + 1, board):
            return True
        else:
            return False

    for i in range(1, 10):
        board[row, col] = i
        print(str(row) + str(col) + str(board[row, col]))
        if validplacement(row, col, board):
            if solve(row, col + 1, board):
                return True
        board[row, col] = 0

    return False


def validplacement(row, col, board):
    for c, x in enumerate(board[row]):  # Try to rewrite
        if c == col: continue
        if x == board[row, col]: return False

    column = board[:, col]
    for c, x in enumerate(column):
        if c == row: continue
        if x == board[row, col]: return False

    quadrow = row // 3 * 3
    quadcol = col // 3 * 3
    quad = board[quadrow:quadrow+3, quadcol:quadcol+3]
    for c in range(len(quad)):
        for d, x in enumerate(quad[c]):
            if c == row - quadrow and d == col - quadcol: continue
            if x == board[row, col]: return False

    return True


def main():
    board = np.array([[5, 3, 4, 6, 7, 8, 9, 1, 2],  # 5 3 4 6 7 8 9 1 2
                      [6, 7, 2, 1, 9, 5, 3, 4, 8],  # 6 7 2
                      [1, 9, 8, 3, 4, 2, 5, 6, 7],  # 1 9 8
                      [8, 5, 9, 7, 6, 1, 4, 2, 3],
                      [4, 2, 6, 8, 5, 3, 7, 9, 1],
                      [7, 1, 3, 9, 2, 4, 8, 5, 6],
                      [9, 6, 1, 5, 3, 7, 2, 8, 4],
                      [2, 8, 7, 4, 1, 9, 6, 3, 5],
                      [3, 4, 5, 2, 8, 6, 1, 7, 9]])

    x = solve(0, 0, board)
    print(x)
    print(board)


if __name__ == "__main__":
    main()
