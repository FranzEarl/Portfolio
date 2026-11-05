#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define SHIFT 3

void generatePassword();
void encryptPassword();
void decryptPassword();

int main() {
    int choice;
    srand(time(NULL));

    do {
        printf("\n===== Password Tools =====\n");
        printf("[1] Generate Password\n");
        printf("[2] Encrypt Password\n");
        printf("[3] Decrypt Password\n");
        printf("[0] Exit\n");
        printf("=====================\n");
        printf("Enter choice: ");
        scanf("%d", &choice);

        switch(choice) {
            case 1:
                generatePassword();
                break;
            case 2:
                encryptPassword();
                break;
            case 3:
                decryptPassword();
                break;
            case 0:
                printf("Exiting PassCrypt...\n");
                break;
            default:
                printf("Invalid choice.\n");
        }

    } while(choice != 0);
    return 0;
}

void generatePassword() {
    const char uppercase[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const char numbers[] = "1234567890";
    const char characters[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789";
    int len;
    int charCount = sizeof(characters) - 1;

    printf("=== Password Generator ===\n");
    printf("Enter Password Length: ");

    if (scanf("%d", &len) != 1) {
        printf("Invalid input.\n");
        return;
    }
    if(len < 8) {
        printf("Password length must be at least 8.\n");
        return;
    }
    if(len > 255) {
        printf("Password length must not exceed 255.\n");
        return;
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
    
    printf("Generated Password: %s\n", password);
}

void encryptPassword() {
    char password[256];

    printf("Enter password to encrypt: ");
    scanf("%255s", password);

    for(int i = 0; password[i] != '\0'; i++) {
        if(password[i] >= 'A' && password[i] <= 'Z') {
            password[i] = (password[i] - 'A' + SHIFT) % 26 + 'A';
        }
        else if(password[i] >= 'a' && password[i] <= 'z') {
            password[i] = (password[i] - 'a' + SHIFT) % 26 + 'a';
        }
        else if(password[i] >= '0' && password[i] <= '9') {
            password[i] = (password[i] - '0' + SHIFT) % 10 + '0';
        }
    }
    printf("Encrypted password: %s\n", password);
}

void decryptPassword() {
    char password[256];

    printf("Enter password to decrypt: ");
    scanf("%255s", password);

    for(int i = 0; password[i] != '\0'; i++) {
        if(password[i] >= 'A' && password[i] <= 'Z') {
            password[i] = (password[i] - 'A' - SHIFT + 26) % 26 + 'A';
        }
        else if(password[i] >= 'a' && password[i] <= 'z') {
            password[i] = (password[i] - 'a' - SHIFT + 26) % 26 + 'a';
        }
        else if(password[i] >= '0' && password[i] <= '9') {
            password[i] = (password[i] - '0' - SHIFT + 10) % 10 + '0';
        }
    }
    printf("Decrypted password: %s\n", password);
}