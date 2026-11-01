#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_WORD_LENGTH 50
#define MAX_TRIES 6

// Structure to hold a word and its hint
struct WordWithHint {
    char word[MAX_WORD_LENGTH];
    char hint[MAX_WORD_LENGTH];
};

// Function declarations
void displayWord(const char guessedWord[]);
void drawHangman(int tries);

int main()
{
    // Seed the random number generator
    srand(time(NULL));

    // Array of words with hints
    struct WordWithHint wordList[] = {
        {"geeksforgeeks", "Computer coding"},
        {"elephant", "A large mammal with a trunk"},
        {"pizza", "A popular Italian dish"},
        {"beach", "Sandy shore by the sea"}
    };

    // Select a random word
    int wordIndex = rand() % 4;

    const char *secretWord = wordList[wordIndex].word;
    const char *hint = wordList[wordIndex].hint;

    int wordLength = strlen(secretWord);

    // Store the current guessed word
    char guessedWord[MAX_WORD_LENGTH];

    // Track guessed letters
    bool guessedLetters[26] = {false};

    // Initialize guessedWord with '_'
    for (int i = 0; i < wordLength; i++) {
        guessedWord[i] = '_';
    }
    guessedWord[wordLength] = '\0';

    printf("Welcome to Hangman!\n");
    printf("Hint: %s\n", hint);

    int tries = 0;

    while (tries < MAX_TRIES) {

        printf("\n");
        displayWord(guessedWord);
        drawHangman(tries);

        char guess;
        printf("Enter a letter: ");
        scanf(" %c", &guess);

        guess = tolower(guess);

        // Validate input
        if (guess < 'a' || guess > 'z') {
            printf("Please enter a valid alphabet.\n");
            continue;
        }

        // Check duplicate guess
        if (guessedLetters[guess - 'a']) {
            printf("You've already guessed that letter. Try again.\n");
            continue;
        }

        guessedLetters[guess - 'a'] = true;

        bool found = false;

        // Search the guessed letter
        for (int i = 0; i < wordLength; i++) {
            if (secretWord[i] == guess) {
                guessedWord[i] = guess;
                found = true;
            }
        }

        if (found) {
            printf("Good guess!\n");
        } else {
            printf("Sorry, the letter '%c' is not in the word.\n", guess);
            tries++;
        }

        // Check win condition
        if (strcmp(secretWord, guessedWord) == 0) {
            printf("\n");
            displayWord(guessedWord);
            printf("\nCongratulations! You've guessed the word: %s\n",
                   secretWord);
            break;
        }
    }

    // Check lose condition
    if (tries >= MAX_TRIES) {
        drawHangman(tries);
        printf("\nSorry, you've run out of tries.\n");
        printf("The word was: %s\n", secretWord);
    }

    return 0;
}

// Function to display the guessed word
void displayWord(const char guessedWord[])
{
    printf("Word: ");

    for (int i = 0; guessedWord[i] != '\0'; i++) {
        printf("%c ", guessedWord[i]);
    }

    printf("\n");
}

// Function to draw the Hangman
void drawHangman(int tries)
{
    const char *hangmanParts[] = {
        "     _________",
        "    |         |",
        "    |         O",
        "    |        /|\\",
        "    |        / \\",
        "    |"
    };

    printf("\n");

    for (int i = 0; i <= tries && i < 6; i++) {
        printf("%s\n", hangmanParts[i]);
    }
}