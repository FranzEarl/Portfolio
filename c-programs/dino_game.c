
#include <stdio.h>
#include <stdbool.h>
#include <conio.h>
#include <windows.h>
#include <stdlib.h>
#include <time.h>

#define WIDTH 82
#define HEIGHT 29
#define GROUND_Y 25

#define DINO_X 5
#define DINO_WIDTH 5

#define OBSTACLE_WIDTH 3
#define INITIAL_SPEED 45
#define MIN_SPEED 20

// Jump physics
#define JUMP_FORCE 1.5f
#define GRAVITY 0.15f

// Game state
typedef struct {
    float height;
    float velocity;
    bool jumping;
} Dino;

typedef struct {
    int x;
    int height;
} Obstacle;

char screen[HEIGHT][WIDTH + 1];

// Move the console cursor
void moveTo(int x, int y)
{
    COORD coord = {(SHORT)x, (SHORT)y};

    SetConsoleCursorPosition(
        GetStdHandle(STD_OUTPUT_HANDLE), coord
    );
}

// Hide the console cursor
void hideCursor(void)
{
    CONSOLE_CURSOR_INFO info;

    GetConsoleCursorInfo(
        GetStdHandle(STD_OUTPUT_HANDLE), &info
    );

    info.bVisible = FALSE;

    SetConsoleCursorInfo(
        GetStdHandle(STD_OUTPUT_HANDLE), &info
    );
}

// Show the console cursor
void showCursor(void)
{
    CONSOLE_CURSOR_INFO info;

    GetConsoleCursorInfo(
        GetStdHandle(STD_OUTPUT_HANDLE), &info
    );

    info.bVisible = TRUE;

    SetConsoleCursorInfo(
        GetStdHandle(STD_OUTPUT_HANDLE), &info
    );
}

// Clear the drawing buffer
void clearBuffer(void)
{
    for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
            screen[y][x] = ' ';
        }

        screen[y][WIDTH] = '\0';
    }
}

// Draw text into the buffer
void putText(int x, int y, const char *text)
{
    if (y < 0 || y >= HEIGHT) {
        return;
    }

    for (int i = 0; text[i] != '\0'; i++) {
        int pos = x + i;

        if (pos >= 0 && pos < WIDTH) {
            screen[y][pos] = text[i];
        }
    }
}

// Draw the ground
void drawGround(void)
{
    for (int x = 0; x < WIDTH; x++) {
        screen[GROUND_Y][x] = '=';
    }
}

// Draw the dinosaur
void drawDino(const Dino *dino, int frame)
{
    int height = (int)(dino->height + 0.5f);
    int y = GROUND_Y - 4 - height;

    putText(DINO_X, y,     "  __ ");
    putText(DINO_X, y + 1, " /o \\");
    putText(DINO_X, y + 2, "/|___>");

    if (dino->jumping) {
        putText(DINO_X, y + 3, " | | ");
    }
    else if (frame % 2 == 0) {
        putText(DINO_X, y + 3, " / \\ ");
    }
    else {
        putText(DINO_X, y + 3, " | | ");
    }
}

// Draw the obstacle
void drawObstacle(const Obstacle *obstacle)
{
    for (int i = 0; i < obstacle->height; i++) {
        putText(
            obstacle->x,
            GROUND_Y - 1 - i,
            " || "
        );
    }
}

// Draw the score and controls
void drawInfo(int score)
{
    char scoreText[30];

    putText(2, 1, "SPACE: Jump");
    putText(2, 2, "X: Exit");

    sprintf(scoreText, "SCORE: %d", score);
    putText(65, 2, scoreText);
}

// Render the complete frame
void renderGame(
    const Dino *dino,
    const Obstacle *obstacle,
    int score,
    int frame
)
{
    clearBuffer();

    drawGround();
    drawDino(dino, frame);
    drawObstacle(obstacle);
    drawInfo(score);

    moveTo(0, 0);

    for (int y = 0; y < HEIGHT; y++) {
        printf("%s", screen[y]);

        if (y < HEIGHT - 1) {
            putchar('\n');
        }
    }

    fflush(stdout);
}

// Start a jump
void startJump(Dino *dino)
{
    if (!dino->jumping) {
        dino->jumping = true;
        dino->velocity = JUMP_FORCE;
    }
}

// Update jump physics
void updateJump(Dino *dino)
{
    if (!dino->jumping) {
        return;
    }

    dino->height += dino->velocity;
    dino->velocity -= GRAVITY;

    if (dino->height <= 0.0f && dino->velocity < 0.0f) {
        dino->height = 0.0f;
        dino->velocity = 0.0f;
        dino->jumping = false;
    }
}

// Check whether the dinosaur and obstacle overlap
bool checkCollision(
    const Dino *dino,
    const Obstacle *obstacle
)
{
    int dinoLeft = DINO_X;
    int dinoRight = DINO_X + DINO_WIDTH - 1;

    int obstacleLeft = obstacle->x;
    int obstacleRight = obstacle->x + OBSTACLE_WIDTH - 1;

    bool horizontalOverlap =
        dinoRight >= obstacleLeft &&
        dinoLeft <= obstacleRight;

    // The dinosaur clears the obstacle when its
    // rendered feet are above the obstacle.
    int height = (int)(dino->height + 0.5f);

    bool verticalOverlap = height < obstacle->height;

    return horizontalOverlap && verticalOverlap;
}

// Reset the game
void resetGame(
    Dino *dino,
    Obstacle *obstacle,
    int *score,
    int *speed,
    int *frame
)
{
    dino->height = 0.0f;
    dino->velocity = 0.0f;
    dino->jumping = false;

    obstacle->x = WIDTH - 4;
    obstacle->height = 2 + rand() % 3;

    *score = 0;
    *speed = INITIAL_SPEED;
    *frame = 0;
}

int main(void)
{
    system("mode con: cols=82 lines=29");
    system("cls");
    hideCursor();
    srand((unsigned int)time(NULL));

    Dino dino = {0.0f, 0.0f, false};
    Obstacle obstacle = {WIDTH - 4, 2 + rand() % 3};

    int score = 0;
    int speed = INITIAL_SPEED;
    int frame = 0;

    bool gameOver = false;
    bool running = true;

    while (running) {

        // Handle keyboard input
        if (_kbhit()) {
            int key = _getch();

            if (key == 'x' || key == 'X') {
                running = false;
                continue;
            }

            if (gameOver) {
                if (key == ' ') {
                    resetGame(
                        &dino, &obstacle,
                        &score, &speed, &frame
                    );

                    gameOver = false;
                    system("cls");
                }

                continue;
            }

            if (key == ' ') {
                startJump(&dino);
            }
        }

        if (gameOver) {
            Sleep(20);
            continue;
        }

        // Update the dinosaur
        updateJump(&dino);

        // Move the obstacle
        obstacle.x--;

        // Obstacle passed the dinosaur
        if (obstacle.x + OBSTACLE_WIDTH <= DINO_X) {
            score++;

            obstacle.x = WIDTH - 4;
            obstacle.height = 2 + rand() % 3;

            if (speed > MIN_SPEED) {
                speed--;
            }
        }

        // Check collision
        if (checkCollision(&dino, &obstacle)) {
            gameOver = true;
        }

        // Draw the current frame
        renderGame(&dino, &obstacle, score, frame);

        if (gameOver) {
            moveTo(15, 12);
            printf("GAME OVER! Score: %d\n   Press Space to restart and Press X to exit!", score);

            fflush(stdout);
        }

        frame++;

        Sleep(speed);
    }

    showCursor();
    system("cls");

    printf("Thanks for playing!\n");

    return 0;
}
