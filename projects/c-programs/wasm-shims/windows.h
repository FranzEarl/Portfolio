#ifndef PORTFOLIO_WASM_WINDOWS_H
#define PORTFOLIO_WASM_WINDOWS_H
#include <stdlib.h>
#define Sleep(ms) ((void)(ms))
#define system(command) ((void)(command), 0)
typedef int BOOL;
typedef short SHORT;
typedef struct { SHORT X; SHORT Y; } COORD;
typedef struct { BOOL bVisible; unsigned long dwSize; } CONSOLE_CURSOR_INFO;
#define FALSE 0
#define TRUE 1
#define STD_OUTPUT_HANDLE (-11)
static inline void *GetStdHandle(int handle) { (void)handle; return NULL; }
static inline BOOL GetConsoleCursorInfo(void *handle, CONSOLE_CURSOR_INFO *info) { (void)handle; (void)info; return TRUE; }
static inline BOOL SetConsoleCursorInfo(void *handle, const CONSOLE_CURSOR_INFO *info) { (void)handle; (void)info; return TRUE; }
static inline BOOL SetConsoleCursorPosition(void *handle, COORD position) { (void)handle; (void)position; return TRUE; }
#endif

