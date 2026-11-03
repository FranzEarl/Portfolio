#include <errno.h>
#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define INPUT_SIZE 128

static int readLine(const char *prompt, char input[INPUT_SIZE]) {
    size_t length;

    printf("%s", prompt);
    if (fgets(input, INPUT_SIZE, stdin) == NULL) {
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

static int parseUnsigned(const char *input, uint32_t *value, int base) {
    char *end;
    unsigned long long parsed;

    while (*input == ' ' || *input == '\t') {
        input++;
    }
    if (*input == '\0' || *input == '-') {
        return 0;
    }

    errno = 0;
    parsed = strtoull(input, &end, base);
    if (errno == ERANGE || end == input || parsed > UINT32_MAX) {
        return 0;
    }
    while (*end == ' ' || *end == '\t' || *end == '\r') {
        end++;
    }
    if (*end != '\0') {
        return 0;
    }

    *value = (uint32_t)parsed;
    return 1;
}

static void formatBase(uint32_t value, unsigned int base, char *output) {
    static const char digits[] = "0123456789ABCDEF";
    char reversed[33];
    size_t length = 0;

    do {
        reversed[length++] = digits[value % base];
        value /= base;
    } while (value != 0);

    for (size_t i = 0; i < length; i++) {
        output[i] = reversed[length - i - 1];
    }
    output[length] = '\0';
}

static int convertInput(const char *prompt, int base, uint32_t *value) {
    char input[INPUT_SIZE];
    int result = readLine(prompt, input);

    if (result <= 0) {
        return result;
    }
    if (!parseUnsigned(input, value, base)) {
        printf("Invalid number for base %d or value exceeds 32 bits.\n", base);
        return -1;
    }
    return 1;
}

int main(void) {
    char input[INPUT_SIZE];
    char output[33];
    uint32_t choice;
    uint32_t value;
    int inputResult;

    for (;;) {
        printf("\nMenu:\n");
        printf("1. Decimal to Binary\n");
        printf("2. Binary to Decimal\n");
        printf("3. Decimal to Octal\n");
        printf("4. Octal to Decimal\n");
        printf("5. Hexadecimal to Binary\n");
        printf("6. Binary to Hexadecimal\n");
        printf("7. Exit\n");

        inputResult = readLine("Enter your choice: ", input);
        if (inputResult == 0) {
            break;
        }
        if (inputResult < 0 || !parseUnsigned(input, &choice, 10) ||
            choice < 1 || choice > 7) {
            printf("Invalid choice. Please enter a number from 1 to 7.\n");
            continue;
        }
        if (choice == 7) {
            break;
        }

        switch (choice) {
            case 1:
                inputResult = convertInput("Enter a decimal number: ", 10, &value);
                if (inputResult == 0) return 0;
                if (inputResult > 0) {
                    formatBase(value, 2, output);
                    printf("Decimal to Binary: %s\n", output);
                }
                break;
            case 2:
                inputResult = convertInput("Enter a binary number: ", 2, &value);
                if (inputResult == 0) return 0;
                if (inputResult > 0) {
                    printf("Binary to Decimal: %" PRIu32 "\n", value);
                }
                break;
            case 3:
                inputResult = convertInput("Enter a decimal number: ", 10, &value);
                if (inputResult == 0) return 0;
                if (inputResult > 0) {
                    formatBase(value, 8, output);
                    printf("Decimal to Octal: %s\n", output);
                }
                break;
            case 4:
                inputResult = convertInput("Enter an octal number: ", 8, &value);
                if (inputResult == 0) return 0;
                if (inputResult > 0) {
                    printf("Octal to Decimal: %" PRIu32 "\n", value);
                }
                break;
            case 5:
                inputResult = convertInput("Enter a hexadecimal number: ", 16, &value);
                if (inputResult == 0) return 0;
                if (inputResult > 0) {
                    formatBase(value, 2, output);
                    printf("Hexadecimal to Binary: %s\n", output);
                }
                break;
            case 6:
                inputResult = convertInput("Enter a binary number: ", 2, &value);
                if (inputResult == 0) return 0;
                if (inputResult > 0) {
                    formatBase(value, 16, output);
                    printf("Binary to Hexadecimal: %s\n", output);
                }
                break;
        }
    }

    printf("Goodbye!\n");
    return 0;
}
