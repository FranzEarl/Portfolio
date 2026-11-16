
#ifndef MATRIX_H
#define MATRIX_H

#define MAX_SIZE 10
#define EPSILON 1e-10

typedef struct {
    int rows;
    int cols;
    double data[MAX_SIZE][MAX_SIZE];
} Matrix;

// Input and output
void input_matrix(Matrix *m);
void print_matrix(const Matrix *m);

// Basic operations
Matrix matrix_add(Matrix a, Matrix b);
Matrix matrix_subtract(Matrix a, Matrix b);
Matrix matrix_multiply(Matrix a, Matrix b);
Matrix matrix_transpose(Matrix a);

// Advanced operations
double matrix_determinant(Matrix a);
int matrix_inverse(Matrix a, Matrix *result);
void matrix_rref(Matrix *a);

// Linear equation solver
void solve_system(Matrix a, double b[]);

#endif
