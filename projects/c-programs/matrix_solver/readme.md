# Matrix Solver

A command-line matrix calculator written in C.

## Features

- Matrix addition and subtraction
- Matrix multiplication
- Matrix transpose
- Determinant calculation
- Matrix inverse
- Reduced Row Echelon Form (RREF)
- System of linear equations solver using Gaussian elimination

## Requirements

- GCC Compiler
- Windows PowerShell (or another compatible terminal)

## Compilation

```powershell
gcc main.c matrix.c -o matrix_solver.exe -std=c11 -Wall -Wextra -lm
```

## Execution

```powershell
.\matrix_solver.exe
```

## Limitations

- Maximum matrix dimensions: 10 × 10
- Uses double-precision floating-point numbers
- Numerical calculations are subject to floating-point precision limitations

## Project Structure

```text
matrix_solver/
├── main.c
├── matrix.h
├── matrix.c
└── README.md
```