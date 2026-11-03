
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define SIDE 3
#define COMPUTER 'O'
#define HUMAN 'X'
#define EMPTY ' '

struct Move {
    int row;
    int col;
};

// Check whether any empty cells remain
bool isMovesLeft(char board[SIDE][SIDE])
{
    for (int i = 0; i < SIDE; i++) {
        for (int j = 0; j < SIDE; j++) {
            if (board[i][j] == EMPTY)
                return true;
        }
    }

    return false;
}

// +10 = computer wins, -10 = human wins, 0 = no winner
int evaluate(char board[SIDE][SIDE])
{
    // Check rows and columns
    for (int i = 0; i < SIDE; i++) {
        if (board[i][0] != EMPTY &&
            board[i][0] == board[i][1] &&
            board[i][1] == board[i][2]) {
            return board[i][0] == COMPUTER ? 10 : -10;
        }

        if (board[0][i] != EMPTY &&
            board[0][i] == board[1][i] &&
            board[1][i] == board[2][i]) {
            return board[0][i] == COMPUTER ? 10 : -10;
        }
    }

    // Check diagonals
    if (board[0][0] != EMPTY &&
        board[0][0] == board[1][1] &&
        board[1][1] == board[2][2]) {
        return board[0][0] == COMPUTER ? 10 : -10;
    }

    if (board[0][2] != EMPTY &&
        board[0][2] == board[1][1] &&
        board[1][1] == board[2][0]) {
        return board[0][2] == COMPUTER ? 10 : -10;
    }

    return 0;
}

// Minimax algorithm
int minimax(char board[SIDE][SIDE], int depth, bool maximizing)
{
    int score = evaluate(board);

    // Computer wins
    if (score == 10)
        return score - depth;

    // Human wins
    if (score == -10)
        return score + depth;

    // Draw
    if (!isMovesLeft(board))
        return 0;

    if (maximizing) {
        int best = -1000;

        for (int i = 0; i < SIDE; i++) {
            for (int j = 0; j < SIDE; j++) {
                if (board[i][j] == EMPTY) {
                    board[i][j] = COMPUTER;

                    int value = minimax(board, depth + 1, false);

                    if (value > best)
                        best = value;

                    board[i][j] = EMPTY;
                }
            }
        }

        return best;
    }
    else {
        int best = 1000;

        for (int i = 0; i < SIDE; i++) {
            for (int j = 0; j < SIDE; j++) {
                if (board[i][j] == EMPTY) {
                    board[i][j] = HUMAN;

                    int value = minimax(board, depth + 1, true);

                    if (value < best)
                        best = value;

                    board[i][j] = EMPTY;
                }
            }
        }

        return best;
    }
}

// Find the computer's best move using Minimax
struct Move findBestMove(char board[SIDE][SIDE])
{
    struct Move bestMove = {-1, -1};
    int bestValue = -1000;

    for (int i = 0; i < SIDE; i++) {
        for (int j = 0; j < SIDE; j++) {
            if (board[i][j] == EMPTY) {
                board[i][j] = COMPUTER;

                int value = minimax(board, 0, false);

                board[i][j] = EMPTY;

                if (value > bestValue) {
                    bestValue = value;
                    bestMove.row = i;
                    bestMove.col = j;
                }
            }
        }
    }

    return bestMove;
}

// Find a random empty cell
struct Move randomMove(char board[SIDE][SIDE])
{
    struct Move move;
    int cell;

    do {
        cell = rand() % (SIDE * SIDE);
        move.row = cell / SIDE;
        move.col = cell % SIDE;
    } while (board[move.row][move.col] != EMPTY);

    return move;
}

// Display the board

void showBoard(char board[SIDE][SIDE])
{
    printf("\n");

    for (int i = 0; i < SIDE; i++) {
        for (int j = 0; j < SIDE; j++) {
            printf(" %c ", board[i][j]);

            if (j < SIDE - 1)
                printf("|");
        }

        printf("\n");

        if (i < SIDE - 1)
            printf("---+---+---\n");
    }

    printf("\n");
}


// Read and validate the player's move
int getHumanMove(char board[SIDE][SIDE])
{
    int move;

    while (true) {
        printf("Enter your move (1-9): ");

        if (scanf("%d", &move) != 1) {
            int ch;

            while ((ch = getchar()) != '\n' && ch != EOF) {
                // Discard invalid input
            }

            printf("Invalid input! Enter a number.\n");
            continue;
        }

        if (move < 1 || move > SIDE * SIDE) {
            printf("Choose a number between 1 and 9.\n");
            continue;
        }

        int row = (move - 1) / SIDE;
        int col = (move - 1) % SIDE;

        if (board[row][col] != EMPTY) {
            printf("That cell is occupied. Try again.\n");
            continue;
        }

        return move;
    }
}

// Play one game
void playTicTacToe(char board[SIDE][SIDE], char turn)
{
    bool computerMoved = false;

    while (true) {
        showBoard(board);

        if (turn == COMPUTER) {
            struct Move move;

            if (!computerMoved) {
                // Randomize the computer's first move
                move = randomMove(board);
                computerMoved = true;
            }
            else {
                // Use Minimax for subsequent moves
                move = findBestMove(board);
            }

            board[move.row][move.col] = COMPUTER;

            printf("Computer chooses cell %d.\n",
                   move.row * SIDE + move.col + 1);
        }
        else {
            int move = getHumanMove(board);

            int row = (move - 1) / SIDE;
            int col = (move - 1) % SIDE;

            board[row][col] = HUMAN;
        }

        int score = evaluate(board);

        if (score == 10) {
            showBoard(board);
            printf("Computer wins!\n");
            return;
        }

        if (score == -10) {
            showBoard(board);
            printf("You win!\n");
            return;
        }

        if (!isMovesLeft(board)) {
            showBoard(board);
            printf("It's a draw!\n");
            return;
        }

        // Switch turns
        turn = (turn == COMPUTER) ? HUMAN : COMPUTER;
    }
}

int main(void)
{
    srand((unsigned int) time(NULL));

    char board[SIDE][SIDE];
    int choice;

    // Initialize the board
    for (int i = 0; i < SIDE; i++) {
        for (int j = 0; j < SIDE; j++) {
            board[i][j] = EMPTY;
        }
    }

    printf("=== TIC-TAC-TOE ===\n\n");
    printf("1. Computer goes first\n");
    printf("2. You go first\n");

    while (true) {
        printf("Choose who goes first (1 or 2): ");

        if (scanf("%d", &choice) != 1) {
            int ch;

            while ((ch = getchar()) != '\n' && ch != EOF) {
                // Discard invalid input
            }

            printf("Invalid input! Enter 1 or 2.\n");
            continue;
        }

        if (choice == 1 || choice == 2)
            break;

        printf("Choose either 1 or 2.\n");
    }

    char turn = (choice == 1) ? COMPUTER : HUMAN;

    playTicTacToe(board, turn);

    return 0;
}
