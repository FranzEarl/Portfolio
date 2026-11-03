#include <errno.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_CANDIDATES 10
#define MAX_NAME_LENGTH 50
#define INPUT_SIZE 128

typedef struct {
    char name[MAX_NAME_LENGTH];
    int votes;
    char symbol;
} Candidate;

static Candidate candidates[MAX_CANDIDATES];
static const char symbols[MAX_CANDIDATES] = {
    '!', '@', '#', '$', '%', '^', '&', '*', '~', '+'
};

static int readLine(const char *prompt, char *input, size_t size) {
    size_t length;

    printf("%s", prompt);
    if (fgets(input, size, stdin) == NULL) {
        return 0;
    }

    length = strcspn(input, "\n");
    if (input[length] == '\n') {
        input[length] = '\0';
    } else {
        int character;
        while ((character = getchar()) != '\n' && character != EOF) {
        }
        printf("Input is too long. Please try again.\n");
        return -1;
    }
    return 1;
}

static int readInteger(const char *prompt, int minimum, int maximum, int *value) {
    char input[INPUT_SIZE];

    for (;;) {
        char *end;
        long parsed;
        int result = readLine(prompt, input, sizeof(input));
        if (result == 0) {
            return 0;
        }
        if (result < 0) {
            continue;
        }

        errno = 0;
        parsed = strtol(input, &end, 10);
        while (*end == ' ' || *end == '\t' || *end == '\r') {
            end++;
        }
        if (errno != ERANGE && end != input && *end == '\0' &&
            parsed >= minimum && parsed <= maximum) {
            *value = (int)parsed;
            return 1;
        }
        printf("Enter a whole number from %d to %d.\n", minimum, maximum);
    }
}

static int readCandidateName(int candidateNumber, char name[MAX_NAME_LENGTH]) {
    char prompt[64];

    snprintf(prompt, sizeof(prompt), "Enter the name of candidate %d: ",
             candidateNumber);
    for (;;) {
        int result = readLine(prompt, name, MAX_NAME_LENGTH);
        if (result == 0) {
            return 0;
        }
        if (result < 0) {
            continue;
        }
        if (name[0] == '\0') {
            printf("Candidate name cannot be empty.\n");
            continue;
        }
        return 1;
    }
}

static int chooseCandidateSymbol(int candidateNumber, int taken[MAX_CANDIDATES],
                                 int *symbolIndex) {
    char prompt[80];
    int choice;

    for (;;) {
        printf("Available symbols:\n");
        for (int i = 0; i < MAX_CANDIDATES; i++) {
            if (!taken[i]) {
                printf("%d  %c\n", i + 1, symbols[i]);
            }
        }
        snprintf(prompt, sizeof(prompt),
                 "Choose a symbol number for candidate %d: ", candidateNumber);
        if (!readInteger(prompt, 1, MAX_CANDIDATES, &choice)) {
            return 0;
        }
        if (!taken[choice - 1]) {
            *symbolIndex = choice - 1;
            return 1;
        }
        printf("That symbol is already taken. Choose an available one.\n");
    }
}

static void displayCandidates(int candidateCount) {
    printf("\n");
    for (int i = 0; i < candidateCount; i++) {
        printf("%d. %s (%c)\n", i + 1, candidates[i].name,
               candidates[i].symbol);
    }
}

static int getVotes(int candidateCount, int voterCount) {
    char prompt[96];
    int choice;

    for (int voter = 0; voter < voterCount; voter++) {
        displayCandidates(candidateCount);
        snprintf(prompt, sizeof(prompt), "Voter %d, enter your choice (1-%d): ",
                 voter + 1, candidateCount);
        if (!readInteger(prompt, 1, candidateCount, &choice)) {
            return 0;
        }
        candidates[choice - 1].votes++;
    }
    return 1;
}

static void displayResults(int candidateCount) {
    int highestVotes = -1;
    int winnerIndex = -1;
    int tiedCandidates = 0;

    for (int i = 0; i < candidateCount; i++) {
        if (candidates[i].votes > highestVotes) {
            highestVotes = candidates[i].votes;
            winnerIndex = i;
            tiedCandidates = 1;
        } else if (candidates[i].votes == highestVotes) {
            tiedCandidates++;
        }
    }

    printf("\n----- Results -----\n");
    if (tiedCandidates > 1) {
        printf("The election is tied.\n");
    } else {
        printf("Winner: %s (%c) with %d vote%s.\n",
               candidates[winnerIndex].name, candidates[winnerIndex].symbol,
               highestVotes, highestVotes == 1 ? "" : "s");
    }
}

int main(void) {
    int candidateCount;
    int voterCount;
    int taken[MAX_CANDIDATES] = {0};

    if (!readInteger("Enter the number of candidates (1-10): ",
                     1, MAX_CANDIDATES, &candidateCount)) {
        return 0;
    }

    for (int i = 0; i < candidateCount; i++) {
        int symbolIndex;
        if (!chooseCandidateSymbol(i + 1, taken, &symbolIndex)) {
            return 0;
        }
        taken[symbolIndex] = 1;
        candidates[i].symbol = symbols[symbolIndex];
        candidates[i].votes = 0;
        if (!readCandidateName(i + 1, candidates[i].name)) {
            return 0;
        }
    }

    if (!readInteger("Enter the number of voters (0 or more): ",
                     0, INT_MAX, &voterCount)) {
        return 0;
    }
    if (!getVotes(candidateCount, voterCount)) {
        return 0;
    }

    displayResults(candidateCount);
    return 0;
}
