#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main() {
    const char uppercase[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const char numbers[] = "1234567890";
    const char characters[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789";
    int len;
    int charCount = sizeof(characters) - 1;
    srand(time(NULL));

    printf("=== Password Generator ===\n");
    printf("Enter Password Length: ");

    if (scanf("%d", &len) != 1) {
        printf("Invalid input.\n");
        return 1;
    }

    if(len < 8) {
        printf("Password length must be at least 8.\n");
        return 1;
    }
    char password[len + 1];

    password[0] = uppercase[rand() % (sizeof(uppercase) - 1)];

    int numberIndex = rand() % (len - 1) + 1;
    password[numberIndex] = numbers[rand() % 10];

    for (int i = 1; i < len; i++) {
        if (i == numberIndex)
            continue;
    
        password[i] = characters[rand() % charCount];
    }
    password[len] = '\0';
    
    printf("Generated Password: %s", password);
    return 0;
}