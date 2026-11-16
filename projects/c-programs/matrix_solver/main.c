
#include <stdio.h>
#include "matrix.h"

int main(void) {
    Matrix A, B, result;
    double b[MAX_SIZE];
    double det;
    int choice;

    do {
        printf("\n");
        printf("================================\n");
        printf("         MATRIX SOLVER\n");
        printf("================================\n");
        printf("1. Matrix Addition\n");
        printf("2. Matrix Subtraction\n");
        printf("3. Matrix Multiplication\n");
        printf("4. Matrix Transpose\n");
        printf("5. Determinant\n");
        printf("6. Matrix Inverse\n");
        printf("7. Reduced Row Echelon Form\n");
        printf("8. Solve Linear Equations\n");
        printf("0. Exit\n");
        printf("================================\n");
        printf("Enter choice: ");

        if (scanf("%d", &choice) != 1) {
            printf("Invalid input. Exiting.\n");
            break;
        }

        switch (choice) {

            case 1:
                printf("\nEnter Matrix A:\n");
                input_matrix(&A);

                if (A.rows == 0) break;

                printf("\nEnter Matrix B:\n");
                input_matrix(&B);

                if (B.rows == 0) break;

                if (A.rows != B.rows ||
                    A.cols != B.cols) {
                    printf("Error: Matrix dimensions "
                           "must be equal.\n");
                    break;
                }

                result = matrix_add(A, B);

                printf("\nResult:\n");
                print_matrix(&result);
                break;

            case 2:
                printf("\nEnter Matrix A:\n");
                input_matrix(&A);

                if (A.rows == 0) break;

                printf("\nEnter Matrix B:\n");
                input_matrix(&B);

                if (B.rows == 0) break;

                if (A.rows != B.rows ||
                    A.cols != B.cols) {
                    printf("Error: Matrix dimensions "
                           "must be equal.\n");
                    break;
                }

                result = matrix_subtract(A, B);

                printf("\nResult:\n");
                print_matrix(&result);
                break;

            case 3:
                printf("\nEnter Matrix A:\n");
                input_matrix(&A);

                if (A.rows == 0) break;

                printf("\nEnter Matrix B:\n");
                input_matrix(&B);

                if (B.rows == 0) break;

                if (A.cols != B.rows) {
                    printf("Error: Columns of A must "
                           "equal rows of B.\n");
                    break;
                }

                result = matrix_multiply(A, B);

                printf("\nResult:\n");
                print_matrix(&result);
                break;

            case 4:
                printf("\nEnter Matrix:\n");
                input_matrix(&A);

                if (A.rows == 0) break;

                result = matrix_transpose(A);

                printf("\nTranspose:\n");
                print_matrix(&result);
                break;

            case 5:
                printf("\nEnter Matrix:\n");
                input_matrix(&A);

                if (A.rows == 0) break;

                if (A.rows != A.cols) {
                    printf("Error: Determinant requires "
                           "a square matrix.\n");
                    break;
                }

                det = matrix_determinant(A);

                printf("\nDeterminant: %.6f\n", det);
                break;

            case 6:
                printf("\nEnter Matrix:\n");
                input_matrix(&A);

                if (A.rows == 0) break;

                if (A.rows != A.cols) {
                    printf("Error: Inverse requires "
                           "a square matrix.\n");
                    break;
                }

                if (matrix_inverse(A, &result)) {
                    printf("\nInverse:\n");
                    print_matrix(&result);
                } else {
                    printf("\nMatrix is singular "
                           "and has no inverse.\n");
                }
                break;

            case 7:
                printf("\nEnter Matrix:\n");
                input_matrix(&A);

                if (A.rows == 0) break;

                matrix_rref(&A);

                printf("\nReduced Row Echelon Form:\n");
                print_matrix(&A);
                break;

            case 8:
                printf("\nEnter coefficient matrix A:\n");
                input_matrix(&A);

                if (A.rows == 0) break;

                printf("\nEnter constants vector b:\n");

                for (int i = 0; i < A.rows; i++) {
                    printf("b[%d]: ", i + 1);
                    scanf("%lf", &b[i]);
                }

                solve_system(A, b);
                break;

            case 0:
                printf("\nExiting Matrix Solver...\n");
                break;

            default:
                printf("\nInvalid choice. Try again.\n");
        }

    } while (choice != 0);

    return 0;
}
