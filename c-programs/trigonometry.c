#include <stdio.h>
#include <math.h>

int main() {
    double num;
    
    printf("Enter num: ");
    scanf("%lf", &num);

    printf("sine: %.2lf\n", sin(num));
    printf("cosine: %.2lf\n", cos(num));
    printf("tangent: %.2lf\n", tan(num));
    printf("cosecant: %.2lf\n", 1.0/sin(num));
    printf("secant: %.2lf\n", 1.0/cos(num));
    printf("cotangent: %.2lf\n", 1.0/tan(num));

    return 0;
}