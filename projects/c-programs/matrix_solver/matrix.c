
#include <stdio.h>
#include <math.h>
#include "matrix.h"

// ---------- Input and Output ----------

void input_matrix(Matrix *m) {
    printf("Enter number of rows (1-%d): ", MAX_SIZE);
    scanf("%d", &m->rows);

    printf("Enter number of columns (1-%d): ", MAX_SIZE);
    scanf("%d", &m->cols);

    if (m->rows < 1 || m->rows > MAX_SIZE ||
        m->cols < 1 || m->cols > MAX_SIZE) {
        printf("Invalid matrix dimensions.\n");
        m->rows = 0;
        m->cols = 0;
        return;
    }

    printf("\nEnter matrix elements:\n");

    for (int i = 0; i < m->rows; i++) {
        for (int j = 0; j < m->cols; j++) {
            printf("[%d][%d]: ", i + 1, j + 1);
            scanf("%lf", &m->data[i][j]);
        }
    }
}

void print_matrix(const Matrix *m) {
    if (m->rows == 0 || m->cols == 0) {
        printf("Empty matrix.\n");
        return;
    }

    for (int i = 0; i < m->rows; i++) {
        printf("| ");

        for (int j = 0; j < m->cols; j++) {
            printf("%10.4f ", m->data[i][j]);
        }

        printf("|\n");
    }
}

// ---------- Basic Operations ----------

Matrix matrix_add(Matrix a, Matrix b) {
    Matrix result = {0};

    result.rows = a.rows;
    result.cols = a.cols;

    for (int i = 0; i < a.rows; i++) {
        for (int j = 0; j < a.cols; j++) {
            result.data[i][j] =
                a.data[i][j] + b.data[i][j];
        }
    }

    return result;
}

Matrix matrix_subtract(Matrix a, Matrix b) {
    Matrix result = {0};

    result.rows = a.rows;
    result.cols = a.cols;

    for (int i = 0; i < a.rows; i++) {
        for (int j = 0; j < a.cols; j++) {
            result.data[i][j] =
                a.data[i][j] - b.data[i][j];
        }
    }

    return result;
}

Matrix matrix_multiply(Matrix a, Matrix b) {
    Matrix result = {0};

    result.rows = a.rows;
    result.cols = b.cols;

    for (int i = 0; i < a.rows; i++) {
        for (int j = 0; j < b.cols; j++) {
            for (int k = 0; k < a.cols; k++) {
                result.data[i][j] +=
                    a.data[i][k] * b.data[k][j];
            }
        }
    }

    return result;
}

Matrix matrix_transpose(Matrix a) {
    Matrix result = {0};

    result.rows = a.cols;
    result.cols = a.rows;

    for (int i = 0; i < a.rows; i++) {
        for (int j = 0; j < a.cols; j++) {
            result.data[j][i] = a.data[i][j];
        }
    }

    return result;
}

// ---------- Determinant ----------

double matrix_determinant(Matrix a) {
    double det = 1.0;
    int sign = 1;

    if (a.rows != a.cols) {
        return NAN;
    }

    int n = a.rows;

    for (int i = 0; i < n; i++) {
        int pivot = i;

        for (int j = i + 1; j < n; j++) {
            if (fabs(a.data[j][i]) >
                fabs(a.data[pivot][i])) {
                pivot = j;
            }
        }

        if (fabs(a.data[pivot][i]) < EPSILON) {
            return 0.0;
        }

        if (pivot != i) {
            for (int j = 0; j < n; j++) {
                double temp = a.data[i][j];
                a.data[i][j] = a.data[pivot][j];
                a.data[pivot][j] = temp;
            }

            sign *= -1;
        }

        double divisor = a.data[i][i];
        det *= divisor;

        for (int j = i + 1; j < n; j++) {
            double factor = a.data[j][i] / divisor;

            for (int k = i + 1; k < n; k++) {
                a.data[j][k] -=
                    factor * a.data[i][k];
            }
        }
    }

    return det * sign;
}

// ---------- Matrix Inverse ----------

int matrix_inverse(Matrix a, Matrix *result) {
    if (a.rows != a.cols) {
        return 0;
    }

    int n = a.rows;
    double aug[MAX_SIZE][MAX_SIZE * 2] = {0};

    // Construct augmented matrix [A | I]
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            aug[i][j] = a.data[i][j];
        }

        aug[i][i + n] = 1.0;
    }

    // Gauss-Jordan elimination
    for (int i = 0; i < n; i++) {
        int pivot = i;

        for (int j = i + 1; j < n; j++) {
            if (fabs(aug[j][i]) >
                fabs(aug[pivot][i])) {
                pivot = j;
            }
        }

        if (fabs(aug[pivot][i]) < EPSILON) {
            return 0;
        }

        // Swap rows
        if (pivot != i) {
            for (int j = 0; j < 2 * n; j++) {
                double temp = aug[i][j];
                aug[i][j] = aug[pivot][j];
                aug[pivot][j] = temp;
            }
        }

        // Normalize pivot row
        double divisor = aug[i][i];

        for (int j = 0; j < 2 * n; j++) {
            aug[i][j] /= divisor;
        }

        // Eliminate other rows
        for (int j = 0; j < n; j++) {
            if (j == i) continue;

            double factor = aug[j][i];

            for (int k = 0; k < 2 * n; k++) {
                aug[j][k] -= factor * aug[i][k];
            }
        }
    }

    result->rows = n;
    result->cols = n;

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            result->data[i][j] = aug[i][j + n];
        }
    }

    return 1;
}

// ---------- Reduced Row Echelon Form ----------

void matrix_rref(Matrix *a) {
    int pivot_row = 0;

    for (int col = 0;
         col < a->cols && pivot_row < a->rows;
         col++) {

        int pivot = pivot_row;

        for (int i = pivot_row + 1; i < a->rows; i++) {
            if (fabs(a->data[i][col]) >
                fabs(a->data[pivot][col])) {
                pivot = i;
            }
        }

        if (fabs(a->data[pivot][col]) < EPSILON) {
            continue;
        }

        // Swap rows
        if (pivot != pivot_row) {
            for (int j = 0; j < a->cols; j++) {
                double temp = a->data[pivot_row][j];
                a->data[pivot_row][j] = a->data[pivot][j];
                a->data[pivot][j] = temp;
            }
        }

        // Make pivot equal to 1
        double divisor = a->data[pivot_row][col];

        for (int j = 0; j < a->cols; j++) {
            a->data[pivot_row][j] /= divisor;
        }

        // Eliminate other entries in pivot column
        for (int i = 0; i < a->rows; i++) {
            if (i == pivot_row) continue;

            double factor = a->data[i][col];

            for (int j = 0; j < a->cols; j++) {
                a->data[i][j] -=
                    factor * a->data[pivot_row][j];
            }
        }

        pivot_row++;
    }

    // Clean up floating-point errors
    for (int i = 0; i < a->rows; i++) {
        for (int j = 0; j < a->cols; j++) {
            if (fabs(a->data[i][j]) < EPSILON) {
                a->data[i][j] = 0.0;
            }
        }
    }
}

// ---------- Linear Equation Solver ----------

void solve_system(Matrix a, double b[]) {
    Matrix aug = {0};

    aug.rows = a.rows;
    aug.cols = a.cols + 1;

    int variables = a.cols;

    // Construct augmented matrix [A | b]
    for (int i = 0; i < a.rows; i++) {
        for (int j = 0; j < variables; j++) {
            aug.data[i][j] = a.data[i][j];
        }

        aug.data[i][variables] = b[i];
    }

    matrix_rref(&aug);

    printf("\nReduced augmented matrix:\n");
    print_matrix(&aug);

    int pivot_cols[MAX_SIZE];
    int pivot_count = 0;

    // Identify pivot columns
    for (int i = 0; i < aug.rows; i++) {
        for (int j = 0; j < variables; j++) {
            if (fabs(aug.data[i][j]) > EPSILON) {
                pivot_cols[pivot_count++] = j;
                break;
            }
        }
    }

    // Check for inconsistency
    for (int i = 0; i < aug.rows; i++) {
        int zero_row = 1;

        for (int j = 0; j < variables; j++) {
            if (fabs(aug.data[i][j]) > EPSILON) {
                zero_row = 0;
                break;
            }
        }

        if (zero_row &&
            fabs(aug.data[i][variables]) > EPSILON) {
            printf("\nNo solution (inconsistent system).\n");
            return;
        }
    }

    if (pivot_count == variables) {
        printf("\nUnique solution:\n");

        for (int i = 0; i < pivot_count; i++) {
            int col = pivot_cols[i];

            printf("x%d = %.6f\n",
                   col + 1,
                   aug.data[i][variables]);
        }
    } else {
        printf("\nInfinitely many solutions.\n");

        printf("Free variables: ");

        int is_pivot[MAX_SIZE] = {0};

        for (int i = 0; i < pivot_count; i++) {
            is_pivot[pivot_cols[i]] = 1;
        }

        for (int j = 0; j < variables; j++) {
            if (!is_pivot[j]) {
                printf("x%d ", j + 1);
            }
        }

        printf("\nUse the reduced augmented matrix above "
               "to express the dependent variables.\n");
    }
}
