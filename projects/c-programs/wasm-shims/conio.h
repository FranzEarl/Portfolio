#ifndef PORTFOLIO_WASM_CONIO_H
#define PORTFOLIO_WASM_CONIO_H
#include <stdio.h>
#ifndef WEB_CONIO_EXIT_KEY
#define WEB_CONIO_EXIT_KEY 'x'
#endif
static int web_key_pending = -2;
static int _kbhit(void) {
    if (web_key_pending != -2) return 1;
    int key = getchar();
    if (key == '\r' || key == '\n') key = getchar();
    if (key == EOF) key = WEB_CONIO_EXIT_KEY;
    web_key_pending = key;
    return 1;
}
static int _getch(void) {
    if (web_key_pending == -2) _kbhit();
    int key = web_key_pending; web_key_pending = -2; return key;
}
#endif

