#include <stdio.h>
#include <math.h>

double hypotenuse(double a, double b) {
    return sqrt(pow(a, 2) + pow(b, 2));
}
double opposite(double a, double c) {
    return sqrt(pow(c, 2) - pow(a, 2));
}
double adjacent(double b, double c) {
    return sqrt(pow(c, 2) - pow(b, 2));
}

int main() {
    double a = 3, b = 4, c = 5;

    printf("Hypotenuse: %.2lf\n", hypotenuse(a, b));
    printf("Opposite: %.2lf\n", opposite(a, c));
    printf("Adjacent: %.2lf", adjacent(b, c));

}