/*
==================================================
          RABBIT SPAWN TRACKER
==================================================

PLATFORM COMPATIBILITY

- Operating systems:
  This version is designed for Windows and uses Windows-specific
  functions and commands, including _kbhit(), _getch(), Sleep(),
  and system("cls"). It will not compile or run as-is on Linux
  or macOS without replacing these platform-specific components.

- Online compilers:
  This program may not work in online compiler environments
  because they may lack the required Windows-specific headers
  and functions, or may not support interactive keyboard input
  while the program is running. Compatibility depends on the
  compiler and its execution environment.


TIMER LIMITATIONS

- The timer starts when SPACE is pressed, not when the mob
  actually dies. Press SPACE immediately after killing it
  for the most accurate timing.

- Timers are not saved when the program closes. All servers
  must be registered again after restarting the program.

- Countdown accuracy depends on the computer's system clock.

- The program estimates respawn times but cannot verify
  whether a mob has actually respawned.


FUNCTIONAL LIMITATIONS

- The program cycles through servers in numerical order.
  Press X to skip to the next server without resetting any
  timer. Direct selection of a specific server is not
  implemented.

- All servers use a fixed 10-minute respawn duration.
  Individual server durations cannot be configured.

- The program does not automatically detect mob kills,
  server changes, or respawn events.

==================================================
*/

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <conio.h>
#include <windows.h>

#define SERVER_COUNT 8
#define RESPAWN_TIME 600

typedef struct {
    time_t respawnAt;
    int active;
} ServerTimer;

ServerTimer servers[SERVER_COUNT] = {0};
int currentServer = 0;

void handleSpace(void) {
    time_t now = time(NULL);

    servers[currentServer].respawnAt = now + RESPAWN_TIME;
    servers[currentServer].active = 1;

    currentServer = (currentServer + 1) % SERVER_COUNT;
}

void displayTimers(void) {
    time_t now = time(NULL);
    struct tm *currentTime = localtime(&now);

    system("cls");

    printf("====== RABBIT SPAWN TRACKER ======\n\n");
    printf("Current time: %02d:%02d:%02d\n\n",
           currentTime->tm_hour,
           currentTime->tm_min,
           currentTime->tm_sec);

    for (int i = 0; i < SERVER_COUNT; i++) {
        printf("%s Server %d: ",
               i == currentServer ? ">" : " ",
               i + 1);

        if (!servers[i].active) {
            printf("NOT STARTED\n");
            continue;
        }
        int remaining = (int)difftime(servers[i].respawnAt, now);

        if (remaining <= 0) {
            printf("READY");
        } else {
            printf("%02d:%02d",
                   remaining / 60,
                   remaining % 60);
        }
        struct tm *respawnTime = localtime(&servers[i].respawnAt);

        printf("  | Respawn: %02d:%02d:%02d\n",
            respawnTime->tm_hour,
            respawnTime->tm_min,
            respawnTime->tm_sec);
    }
    printf("\nSPACE: Confirm kill");
    printf("\nX: Skip to next server");
    printf("\nESC: Exit\n");
}

int main(void) {
    time_t lastDisplay = 0;

    while (1) {
        if (_kbhit()) {
            int key = _getch();

            if (key == 27) {
                break;
            }

            if (key == ' ') {
                handleSpace();
                lastDisplay = 0;
            }
            else if (key == 'x' || key == 'X') {
                currentServer = (currentServer + 1) % SERVER_COUNT;
                lastDisplay = 0;
            }
        }
        time_t now = time(NULL);

        if (now != lastDisplay) {
            displayTimers();
            lastDisplay = now;
        }
        Sleep(10);
    }
    return 0;
}
