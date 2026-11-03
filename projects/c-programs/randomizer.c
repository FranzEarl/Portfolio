#if defined(__MINGW32__)
#define __USE_MINGW_ANSI_STDIO 1
#endif
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <windows.h>

#define NAME_SIZE 100
#define INPUT_SIZE 128

static int readCount(size_t *count) {
    char input[INPUT_SIZE];
    char *end;
    unsigned long long parsed;

    printf("Enter number of item/s: ");
    if (fgets(input, sizeof(input), stdin) == NULL) {
        return 0;
    }

    if (strchr(input, '\n') == NULL) {
        int character;
        while ((character = getchar()) != '\n' && character != EOF) {
        }
        fprintf(stderr, "Enter a whole number from 1 to %d.\n", RAND_MAX);
        return -1;
    }

    errno = 0;
    parsed = strtoull(input, &end, 10);
    while (*end == ' ' || *end == '\t' || *end == '\r' || *end == '\n') {
        end++;
    }
    if (errno == ERANGE || end == input || *end != '\0' ||
        parsed == 0 || parsed > (unsigned long long)RAND_MAX) {
        fprintf(stderr, "Enter a whole number from 1 to %d.\n", RAND_MAX);
        return -1;
    }

    *count = (size_t)parsed;
    return 1;
}

static int readItemName(char *name, size_t index) {
    for (;;) {
        size_t length;

        printf("Item #%zu name: ", index + 1);
        if (fgets(name, NAME_SIZE, stdin) == NULL) {
            return 0;
        }

        length = strcspn(name, "\n");
        if (name[length] == '\n') {
            name[length] = '\0';
        } else {
            int character = getchar();
            if (character != '\n' && character != EOF) {
                while ((character = getchar()) != '\n' && character != EOF) {
                }
                printf("Item name is too long. Please try again.\n");
                continue;
            }
        }

        if (name[0] == '\0') {
            printf("Item name cannot be empty.\n");
            continue;
        }
        return 1;
    }
}

int main(void) {
    size_t count;
    int countResult = readCount(&count);
    if (countResult <= 0) {
        return countResult == 0 ? 0 : 1;
    }

    char (*items)[NAME_SIZE] = calloc(count, sizeof(*items));
    if (items == NULL) {
        perror("Could not allocate item list");
        return 1;
    }

    for (size_t i = 0; i < count; i++) {
        if (!readItemName(items[i], i)) {
            free(items);
            return 0;
        }
    }

    srand((unsigned int)time(NULL));
    size_t winner = (size_t)rand() % count;

    printf("The winner will be revealed in 5...");
    fflush(stdout);

    for (int i = 4; i >= 1; i--) {
        Sleep(1000);
        printf("\b\b\b\b%d...", i);
        fflush(stdout);
    }
    Sleep(1000);
    printf("\r                                   \r\nWinner: %s\n", items[winner]);
    free(items);
    return 0;
}
