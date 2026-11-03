#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void strReverse(char *str) {
    int i = 0;
    int j = strlen(str) - 1;
    while(i < j) {
        char c = str[i];
        str[i] = str[j];
        str[j] = c;
        i++;
        j--;
    }
}

char *decimalToBinary(int decimal) {
    char *binary = (char *)malloc(33);

    int i = 0;

    while(decimal) {
        binary[i++] = '0' + (decimal & 1);
        decimal >>= 1;
    }
    binary[i] = '\0';
    strrev(binary);
    return binary;
}

int binaryToDecimal(char binary[]) {
    int decimal = 0;
    int length = strlen(binary);
    for(int i = 0; i < length; i++) {
        decimal = decimal * 2 + (binary[i] - '0');
    }
    return decimal;
}

char *decimalToOctal(int decimal) {
    char *octal = (char *)malloc(12);
    if(octal == NULL) {
        printf("Memory allocation failed.\n");
        exit(1);
    }

    sprintf(octal, "%o", decimal);
    return octal;
}

int octalToDecimal(char octal[]) {
    int decimal = 0;
    int length = strlen(octal);
    for(int i = 0; i < length; i++) {
        decimal = decimal * 8 + (octal[i] - '0');
    }
    return decimal;
}

char *hexadecimalToBinary(char hex[]) {
    unsigned int hexNum;
    sscanf(hex, "%x", &hexNum);
    char binary[33] = "";
    int i = 0;
    while(hexNum) {
        binary[i++] = '0' + hexNum % 2;
        hexNum /= 2;
    }
    binary[i] = '\0';
    strrev(binary);
    return strdup(binary);
}

char *binaryToHexadecimal(char binary[]) {
    int length = strlen(binary);
    int padding = (4 - (length % 4)) % 4;
    char paddedBinary[129];
    memset(paddedBinary, '0', padding);
    strcpy(paddedBinary + padding, binary);

    char *binaryHexDigits[] = { "0000", "0001", "0010", "0011", "0100", "0101",
                                "0110", "0111", "1000", "1001", "1010", "1011",
                                "1100", "1101", "1110", "1111" };
    char hexadecimal[33] = "";

    for(int i = 0; i < length + padding; i += 4) {
        char group[5];
        strncpy(group, paddedBinary + i, 4);
        group[4] = '\0';

        for(int j = 0; j < 16; j++) {
            if(strcmp(group, binaryHexDigits[j]) == 0) {
                char hexDigit[2];
                sprintf(hexDigit, "%X", j);
                strcat(hexadecimal, hexDigit);
                break;
            }
        }
    }
    return strdup(hexadecimal);
}

int main() {

    int choice;
    while(1) {
        printf("\nMenu:\n");
        printf("1. Decimal to Binary\n");
        printf("2. Binary to Decimal\n");
        printf("3. Decimal to Octal\n");
        printf("4. Octal to Decimal\n");
        printf("5. Hecadecimal to Binary\n");
        printf("6. Binary to Hexadecimal\n");
        printf("7. Exit\n");
        printf("Enter you choice: ");
        scanf("%d", &choice);

        if(choice == 7) {
            printf("Goodbye!\n");
            break;
        }

        char input[100];

        switch(choice) {
            case 1:
                printf("Enter a decimal number: ");
                scanf("%d", &choice);
                char *result = decimalToBinary(choice);
                printf("Decimal to Binary: %s\n", result);
                free(result);
                break;
            case 2:
                printf("Enter a binary number: ");
                scanf("%s", input);
                int binaryResult = binaryToDecimal(input);
                printf("Binary to Decimal: %d\n", binaryResult);
                break;
            case 3:
                printf("Etner a decimal number: ");
                scanf("%d", &choice);
                result = decimalToOctal(choice);
                printf("Decimal to Octal: %s\n", result);
                free(result);
                break;
            case 4:
                printf("Enter an octal number: ");
                scanf("%s", input);
                int octalResult = octalToDecimal(input);
                printf("Octal to Decimal: %d\n", octalResult);
                break;
            case 5:
                printf("Enter a hexadecimal number: ");
                scanf("%s", input);;
                result = hexadecimalToBinary(input);
                printf("Hexadecimal to Binary: %s\n", result);
                free(result);
                break;
            case 6:
                printf("Enter a binary number: ");
                scanf("%s", input);
                result = binaryToHexadecimal(input);
                printf("Binary to Hexadecimal: %s\n", result);
                free(result);
                break;
            default:
                printf("Invalid choice. Please enter a valid option.\n");
        }
    }

    return 0;
}