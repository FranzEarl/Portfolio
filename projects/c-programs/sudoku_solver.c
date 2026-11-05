#include <stdio.h>
#include <string.h>

#define GRID_SIZE 9
#define BOX_SIZE 3
#define ROW_INPUT_SIZE 32

typedef int SudokuGrid[GRID_SIZE][GRID_SIZE];

int readRow(int row, int values[GRID_SIZE]) {
    char input[ROW_INPUT_SIZE];
    printf("Row %d (use 1-9 for clues and 0 or . for blanks): ", row + 1);
    if (fgets(input, sizeof(input), stdin) == NULL) {
        return 0;
    }

    size_t length = strlen(input);
    if (length > 0 && input[length - 1] == '\n') {
        input[--length] = '\0';
    } else if (!feof(stdin)) {
        int character;
        while ((character = getchar()) != '\n' && character != EOF) {
        }
        printf("Enter exactly 9 cells.\n");
        return -1;
    }

    if (length > 0 && input[length - 1] == '\r') {
        input[--length] = '\0';
    }
    if (length != GRID_SIZE) {
        printf("Enter exactly 9 cells.\n");
        return -1;
    }

    for (int column = 0; column < GRID_SIZE; column++) {
        if (input[column] >= '1' && input[column] <= '9') {
            values[column] = input[column] - '0';
        } else if (input[column] == '0' || input[column] == '.') {
            values[column] = 0;
        } else {
            printf("Use only digits 1-9, 0, or '.'.\n");
            return -1;
        }
    }

    return 1;
}

void printGrid(SudokuGrid grid) {
    printf("\n+-------+-------+-------+\n");
    for (int row = 0; row < GRID_SIZE; row++) {
        printf("| ");
        for (int column = 0; column < GRID_SIZE; column++) {
            if (grid[row][column] == 0) {
                printf(". ");
            } else {
                printf("%d ", grid[row][column]);
            }
            if ((column + 1) % BOX_SIZE == 0) {
                printf("| ");
            }
        }
        printf("\n");
        if ((row + 1) % BOX_SIZE == 0) {
            printf("+-------+-------+-------+\n");
        }
    }
}

int findConflict(SudokuGrid grid, int *row, int *column) {
    for (int currentRow = 0; currentRow < GRID_SIZE; currentRow++) {
        for (int currentColumn = 0; currentColumn < GRID_SIZE; currentColumn++) {
            int value = grid[currentRow][currentColumn];
            if (value == 0) {
                continue;
            }

            for (int otherColumn = currentColumn + 1;
                 otherColumn < GRID_SIZE; otherColumn++) {
                if (grid[currentRow][otherColumn] == value) {
                    *row = currentRow;
                    *column = otherColumn;
                    return 1;
                }
            }
            for (int otherRow = currentRow + 1;
                 otherRow < GRID_SIZE; otherRow++) {
                if (grid[otherRow][currentColumn] == value) {
                    *row = otherRow;
                    *column = currentColumn;
                    return 1;
                }
            }

            int boxRow = (currentRow / BOX_SIZE) * BOX_SIZE;
            int boxColumn = (currentColumn / BOX_SIZE) * BOX_SIZE;
            for (int otherRow = boxRow; otherRow < boxRow + BOX_SIZE;
                 otherRow++) {
                for (int otherColumn = boxColumn;
                     otherColumn < boxColumn + BOX_SIZE; otherColumn++) {
                    if ((otherRow > currentRow ||
                         (otherRow == currentRow &&
                          otherColumn > currentColumn)) &&
                        grid[otherRow][otherColumn] == value) {
                        *row = otherRow;
                        *column = otherColumn;
                        return 1;
                    }
                }
            }
        }
    }

    return 0;
}

int canPlace(SudokuGrid grid, int row, int column, int value) {
    for (int index = 0; index < GRID_SIZE; index++) {
        if (grid[row][index] == value || grid[index][column] == value) {
            return 0;
        }
    }

    int boxRow = (row / BOX_SIZE) * BOX_SIZE;
    int boxColumn = (column / BOX_SIZE) * BOX_SIZE;
    for (int currentRow = boxRow; currentRow < boxRow + BOX_SIZE;
         currentRow++) {
        for (int currentColumn = boxColumn;
             currentColumn < boxColumn + BOX_SIZE; currentColumn++) {
            if (grid[currentRow][currentColumn] == value) {
                return 0;
            }
        }
    }

    return 1;
}

int findBestEmptyCell(SudokuGrid grid, int *bestRow, int *bestColumn) {
    int fewestCandidates = GRID_SIZE + 1;
    int foundEmpty = 0;

    for (int row = 0; row < GRID_SIZE; row++) {
        for (int column = 0; column < GRID_SIZE; column++) {
            if (grid[row][column] != 0) {
                continue;
            }

            int candidates = 0;
            for (int value = 1; value <= GRID_SIZE; value++) {
                if (canPlace(grid, row, column, value)) {
                    candidates++;
                }
            }
            if (candidates < fewestCandidates) {
                fewestCandidates = candidates;
                *bestRow = row;
                *bestColumn = column;
                foundEmpty = 1;
            }
            if (candidates == 0) {
                return 1;
            }
        }
    }

    return foundEmpty;
}

int solveSudoku(SudokuGrid grid) {
    int row;
    int column;
    if (!findBestEmptyCell(grid, &row, &column)) {
        return 1;
    }

    for (int value = 1; value <= GRID_SIZE; value++) {
        if (canPlace(grid, row, column, value)) {
            grid[row][column] = value;
            if (solveSudoku(grid)) {
                return 1;
            }
            grid[row][column] = 0;
        }
    }

    return 0;
}

int main(void) {
    SudokuGrid grid = {0};
    int row;
    int column;

    printf("========== SUDOKU SOLVER ==========\n");
    printf("Enter a Sudoku puzzle one row at a time.\n");
    printf("Use 1-9 for clues and 0 or . for empty cells.\n\n");

    for (int currentRow = 0; currentRow < GRID_SIZE;) {
        int result = readRow(currentRow, grid[currentRow]);
        if (result == 0) {
            printf("\nNo puzzle entered.\n");
            return 0;
        }
        if (result == 1) {
            currentRow++;
        }
    }

    printf("\nYour puzzle:");
    printGrid(grid);

    if (findConflict(grid, &row, &column)) {
        printf("The puzzle has a duplicate clue at row %d, column %d.\n",
               row + 1, column + 1);
        return 1;
    }
    printf("The clues are valid: no duplicates in any row, column, or box.\n");

    if (!solveSudoku(grid)) {
        printf("This puzzle has no solution.\n");
        return 1;
    }

    printf("\nSolved puzzle:");
    printGrid(grid);
    return 0;
}
