#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define INPUT_SIZE 128

static int readNumber(const char *prompt, float *value) {
    char input[INPUT_SIZE];
    char *end;

    printf("%s", prompt);
    if (fgets(input, sizeof(input), stdin) == NULL) {
        return 0;
    }

    errno = 0;
    *value = strtof(input, &end);
    while (*end == ' ' || *end == '\t' || *end == '\r' || *end == '\n') {
        end++;
    }
    if (errno == ERANGE || end == input || *end != '\0' || !isfinite(*value)) {
        return -1;
    }
    return 1;
}

static int readOperator(char *operator) {
    char input[INPUT_SIZE];
    char *start;
    char *end;

    printf("Enter operation (+, -, *, /, %%): ");
    if (fgets(input, sizeof(input), stdin) == NULL) {
        return 0;
    }

    start = input;
    while (*start == ' ' || *start == '\t') {
        start++;
    }
    if (*start == '\0' || *start == '\n') {
        return -1;
    }
    *operator = *start++;
    end = start;
    while (*end == ' ' || *end == '\t' || *end == '\r' || *end == '\n') {
        end++;
    }
    return *end == '\0' ? 1 : -1;
}

int main(void) {
    float a;
    float b;
    float result;
    char operator;
    int inputResult;

    printf("***** Calculator *****\n");
    inputResult = readNumber("Enter first number: ", &a);
    if (inputResult <= 0) {
        fprintf(stderr, inputResult == 0 ? "Input ended.\n" : "Invalid first number.\n");
        return inputResult == 0 ? 0 : 1;
    }

    inputResult = readNumber("Enter second number: ", &b);
    if (inputResult <= 0) {
        fprintf(stderr, inputResult == 0 ? "Input ended.\n" : "Invalid second number.\n");
        return inputResult == 0 ? 0 : 1;
    }

    inputResult = readOperator(&operator);
    if (inputResult <= 0) {
        fprintf(stderr, inputResult == 0 ? "Input ended.\n" : "Enter one valid operator.\n");
        return inputResult == 0 ? 0 : 1;
    }

    switch (operator) {
        case '+':
            result = a + b;
            break;
        case '-':
            result = a - b;
            break;
        case '*':
            result = a * b;
            break;
        case '/':
            if (b == 0.0f) {
                fprintf(stderr, "Cannot divide by zero.\n");
                return 1;
            }
            result = a / b;
            break;
        case '%':
            if (b == 0.0f) {
                fprintf(stderr, "Cannot take a remainder with a zero divisor.\n");
                return 1;
            }
            result = fmodf(a, b);
            break;
        default:
            fprintf(stderr, "Invalid operation.\n");
            return 1;
    }

    if (!isfinite(result)) {
        fprintf(stderr, "The result is outside the supported numeric range.\n");
        return 1;
    }
    printf("Result: %.2f\n", result);
    return 0;
}
