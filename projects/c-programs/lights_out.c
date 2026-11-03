#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define SIZE 3
#define N (SIZE * SIZE)

int A[N][N + 1];

int indexOf(int r, int c)
{
    return r * SIZE + c;
}

void buildMatrix()
{
    for (int r = 0; r < SIZE; r++)
    {
        for (int c = 0; c < SIZE; c++)
        {
            int button = indexOf(r, c);

            A[button][button] = 1;

            if (r > 0)
                A[indexOf(r - 1, c)][button] = 1;

            if (r < SIZE - 1)
                A[indexOf(r + 1, c)][button] = 1;

            if (c > 0)
                A[indexOf(r, c - 1)][button] = 1;

            if (c < SIZE - 1)
                A[indexOf(r, c + 1)][button] = 1;
        }
    }
}

void solve()
{
    int row = 0;

    for (int col = 0; col < N && row < N; col++)
    {
        int pivot = row;

        while (pivot < N && A[pivot][col] == 0)
            pivot++;

        if (pivot == N)
            continue;

        if (pivot != row)
        {
            for (int j = col; j <= N; j++)
            {
                int temp = A[row][j];
                A[row][j] = A[pivot][j];
                A[pivot][j] = temp;
            }
        }

        for (int i = 0; i < N; i++)
        {
            if (i != row && A[i][col])
            {
                for (int j = col; j <= N; j++)
                    A[i][j] ^= A[row][j];
            }
        }

        row++;
    }
}

int main()
{
    char input[128];
    buildMatrix();

    printf("Enter current board (9 values: 0 or 1, separated by spaces):\n");
    if (fgets(input, sizeof(input), stdin) == NULL ||
        strchr(input, '\n') == NULL) {
        fprintf(stderr, "Enter all 9 board values on one line.\n");
        return 1;
    }

    char *token = strtok(input, " \t\r\n");
    for (int i = 0; i < N; i++) {
        char *end;
        long value;

        if (token == NULL) {
            fprintf(stderr, "Enter exactly 9 values, each either 0 or 1.\n");
            return 1;
        }
        value = strtol(token, &end, 10);
        if (end == token || *end != '\0' || (value != 0 && value != 1)) {
            fprintf(stderr, "Each board value must be either 0 or 1.\n");
            return 1;
        }
        A[i][N] = value ^ 1;
        token = strtok(NULL, " \t\r\n");
    }
    if (token != NULL) {
        fprintf(stderr, "Enter exactly 9 values, each either 0 or 1.\n");
        return 1;
    }

    solve();

    printf("\nPress these buttons:\n");

    for (int i = 0; i < N; i++)
    {
        printf("%d ", A[i][N]);

        if ((i + 1) % SIZE == 0)
            printf("\n");
    }
    return 0;
}