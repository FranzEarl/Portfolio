#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <windows.h>

int main() {
    int n, winner;
    srand(time(NULL));

    printf("Enter number of item/s: ");
    scanf("%d", &n);
    getchar();

    char *items[n];
    char buffer[n][100];

    for(int i = 0; i < n; i++) {
        items[i] = buffer[i];

        printf("Item #%d name: ", i + 1);
        fgets(items[i], 100, stdin);
        items[i][strcspn(items[i], "\n")] = '\0';
    }
    winner = rand() % n;

    printf("The winner will be revealed in 5...");
    fflush(stdout);

    for(int i = 4; i >= 1; i--) {
        Sleep(1000);
        printf("\b\b\b\b%d...", i);
        fflush(stdout);
    }
    Sleep(1000);
    printf("\r                                   \r\nWinner: %s", items[winner]);
    return 0;
}