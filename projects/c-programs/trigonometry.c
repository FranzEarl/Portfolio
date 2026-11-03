#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

#define ZERO_TOLERANCE 1e-12

static int readNumber(double *value) {
    char input[128];
    char *end;

    printf("Enter angle in radians: ");
    if (fgets(input, sizeof(input), stdin) == NULL) {
        return 0;
    }

    errno = 0;
    *value = strtod(input, &end);
    while (*end == ' ' || *end == '\t' || *end == '\r' || *end == '\n') {
        end++;
    }
    if (errno == ERANGE || end == input || *end != '\0' || !isfinite(*value)) {
        return -1;
    }
    return 1;
}

static void printReciprocal(const char *label, double denominator) {
    if (fabs(denominator) < ZERO_TOLERANCE) {
        printf("%s: undefined\n", label);
    } else {
        printf("%s: %.2f\n", label, 1.0 / denominator);
    }
}

int main(void) {
    double angle;
    int result = readNumber(&angle);
    if (result <= 0) {
        fprintf(stderr, result == 0 ? "Input ended.\n" : "Invalid angle.\n");
        return result == 0 ? 0 : 1;
    }

    double sine = sin(angle);
    double cosine = cos(angle);
    double tangent = tan(angle);

    printf("sine: %.2f\n", sine);
    printf("cosine: %.2f\n", cosine);
    printf("tangent: %.2f\n", tangent);
    printReciprocal("cosecant", sine);
    printReciprocal("secant", cosine);
    printReciprocal("cotangent", tangent);
    return 0;
}
