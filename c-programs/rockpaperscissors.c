#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <ctype.h>

int main() {

    int player, computer, result;
    char you;

    char *choice[] = {"Rock", "Paper", "Scissors"};

    srand(time(NULL));

    computer = rand() % 3;

    printf("***** Rock Paper Scissor *****\n\n");
    printf("Enter (r for rock) (p for paper) (s for scissor):");
    scanf(" %c", &you);

    switch (tolower(you)) {
        case 'r':
            player = 0;
            break;
        case 'p':
            player = 1;
            break;
        case 's':
            player = 2;
            break;
    
        default:
            printf("Invalid Input!");
            return 0;
    }
   
    printf("You picked %s\n", choice[player]);
    printf("Computer picked %s\n", choice[computer]);

    result = (player - computer + 3) % 3;

    if(result == 0) {
        printf("Draw!");
    }
    else if(result == 1) {
        printf("You Won!");
    }
    else {
        printf("You Lost!");
    }
    return 0;
}