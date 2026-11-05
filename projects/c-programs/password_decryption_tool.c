#include <stdio.h>

#define SHIFT 3

int main() {
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

    return 0;
}