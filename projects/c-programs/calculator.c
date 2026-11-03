#include <stdio.h>

float add(float a, float b) {
    return a + b;
}

float subtract(float a, float b) {
    return a - b;
}

float multiply(float a, float b) {
    return a * b;
}

float divide(float a, float b) {
    return a / b;
}

float modulo(float a, float b) {
    return (int)a % (int)b;
}

int main() {

    float a, b, result;
    char op;
    int flag = 0;

    printf("***** Calculator *****\n");
    printf("Enter first number: ");
    scanf("%f", &a);
    printf("Enter second number: ");
    scanf("%f", &b);
    printf("Enter operation: ");
    scanf(" %c", &op);

    switch (op) {
        case '+':
            result = add(a, b);
            break;
        case '-':
            result = subtract(a, b);
            break;
        case '*':
            result = multiply(a, b);
            break;
        case '/':
            result = divide(a, b);
            break;
        case '%':
            result = modulo(a, b);
            break;
        default:
            flag = 1;
            break;
    }

    if(flag == 1) {
        printf("Invalid Operation!");
    }
    else {
        printf("Result: %.2f", result);
    }

    return 0;
}