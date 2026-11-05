#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_QUESTIONS 100
#define QUESTION_SIZE 200
#define OPTION_COUNT 4
#define OPTION_SIZE 100
#define FIELD_COUNT (OPTION_COUNT + 2)
#define LINE_SIZE (QUESTION_SIZE + OPTION_COUNT * OPTION_SIZE + 16)
#define DEFAULT_QUESTIONS_FILE "quiz_questions.txt"

typedef struct {
    char prompt[QUESTION_SIZE];
    char options[OPTION_COUNT][OPTION_SIZE];
    int correctOption;
} Question;

int loadQuestions(const char *filename, Question questions[], int *count) {
    FILE *file = fopen(filename, "r");
    if (file == NULL) {
        perror("Could not open questions file");
        return 0;
    }

    char line[LINE_SIZE];
    int lineNumber = 0;
    while (fgets(line, sizeof(line), file) != NULL) {
        lineNumber++;
        size_t length = strlen(line);
        if (length > 0 && line[length - 1] == '\n') {
            line[--length] = '\0';
        } else if (!feof(file)) {
            fprintf(stderr, "Question on line %d is too long.\n", lineNumber);
            fclose(file);
            return 0;
        }
        if (length > 0 && line[length - 1] == '\r') {
            line[--length] = '\0';
        }

        char *fields[FIELD_COUNT];
        fields[0] = line;
        int fieldCount = 1;
        for (char *position = line; *position != '\0'; position++) {
            if (*position == '|') {
                if (fieldCount >= FIELD_COUNT) {
                    fieldCount++;
                    break;
                }
                *position = '\0';
                fields[fieldCount++] = position + 1;
            }
        }
        if (fieldCount != FIELD_COUNT) {
            fprintf(stderr, "Question on line %d must have %d fields.\n",
                    lineNumber, FIELD_COUNT);
            fclose(file);
            return 0;
        }

        if (strlen(fields[0]) >= QUESTION_SIZE || fields[0][0] == '\0') {
            fprintf(stderr, "Invalid question text on line %d.\n", lineNumber);
            fclose(file);
            return 0;
        }
        for (int i = 0; i < OPTION_COUNT; i++) {
            if (fields[i + 1][0] == '\0' ||
                strlen(fields[i + 1]) >= OPTION_SIZE) {
                fprintf(stderr, "Invalid answer option on line %d.\n",
                        lineNumber);
                fclose(file);
                return 0;
            }
        }

        errno = 0;
        char *end;
        long correctOption = strtol(fields[FIELD_COUNT - 1], &end, 10);
        if (errno != 0 || end == fields[FIELD_COUNT - 1] || *end != '\0' ||
            correctOption < 1 || correctOption > OPTION_COUNT) {
            fprintf(stderr, "Invalid correct answer number on line %d.\n",
                    lineNumber);
            fclose(file);
            return 0;
        }
        if (*count >= MAX_QUESTIONS) {
            fprintf(stderr, "Questions file contains more than %d questions.\n",
                    MAX_QUESTIONS);
            fclose(file);
            return 0;
        }

        strcpy(questions[*count].prompt, fields[0]);
        for (int i = 0; i < OPTION_COUNT; i++) {
            strcpy(questions[*count].options[i], fields[i + 1]);
        }
        questions[*count].correctOption = (int)correctOption - 1;
        (*count)++;
    }

    if (ferror(file)) {
        perror("Could not read questions file");
        fclose(file);
        return 0;
    }
    if (fclose(file) != 0) {
        perror("Could not close questions file");
        return 0;
    }
    if (*count == 0) {
        fprintf(stderr, "The questions file contains no questions.\n");
        return 0;
    }

    return 1;
}

void shuffleQuestions(Question questions[], int count) {
    for (int i = count - 1; i > 0; i--) {
        int other = rand() % (i + 1);
        Question temporary = questions[i];
        questions[i] = questions[other];
        questions[other] = temporary;
    }
}

int readAnswer(void) {
    char input[32];
    printf("Your answer (1-%d): ", OPTION_COUNT);
    if (fgets(input, sizeof(input), stdin) == NULL) {
        return -1;
    }

    size_t length = strlen(input);
    if (length > 0 && input[length - 1] == '\n') {
        input[--length] = '\0';
    } else if (!feof(stdin)) {
        int character;
        while ((character = getchar()) != '\n' && character != EOF) {
        }
        printf("Input is too long. Try again.\n");
        return -2;
    }

    errno = 0;
    char *end;
    long answer = strtol(input, &end, 10);
    if (errno != 0 || end == input || *end != '\0' ||
        answer < 1 || answer > OPTION_COUNT) {
        printf("Enter a number from 1 to %d.\n", OPTION_COUNT);
        return -2;
    }

    return (int)answer - 1;
}

int main(int argc, char *argv[]) {
    if (argc > 2) {
        fprintf(stderr, "Usage: %s [questions-file]\n", argv[0]);
        return 1;
    }

    const char *filename =
        argc == 2 ? argv[1] : DEFAULT_QUESTIONS_FILE;
    Question questions[MAX_QUESTIONS];
    int count = 0;
    if (!loadQuestions(filename, questions, &count)) {
        return 1;
    }

    srand((unsigned int)time(NULL));
    shuffleQuestions(questions, count);

    printf("========== QUIZ GAME ==========\n");
    printf("Answer each question by entering its option number.\n");

    int score = 0;
    int answered = 0;
    for (int i = 0; i < count; i++) {
        printf("\nQuestion %d of %d: %s\n", i + 1, count,
               questions[i].prompt);
        for (int j = 0; j < OPTION_COUNT; j++) {
            printf("%d. %s\n", j + 1, questions[i].options[j]);
        }

        int answer;
        do {
            answer = readAnswer();
            if (answer == -1) {
                printf("\nQuiz ended early.\n");
                printf("Score: %d / %d answered\n", score, answered);
                return 0;
            }
        } while (answer == -2);

        answered++;
        if (answer == questions[i].correctOption) {
            printf("Correct!\n");
            score++;
        } else {
            printf("Incorrect. The correct answer is %d. %s\n",
                   questions[i].correctOption + 1,
                   questions[i].options[questions[i].correctOption]);
        }
    }

    printf("\n========== QUIZ COMPLETE ==========\n");
    printf("Final score: %d / %d\n", score, count);
    return 0;
}
