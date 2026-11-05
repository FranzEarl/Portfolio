#include <stdio.h>
#include <time.h>
#include <stdbool.h>
#include <unistd.h>

int main() {

    time_t rawtime = 0;
    struct tm *pTime = NULL;
    bool isRunning = true;

    printf("Digital Clock\n");

#ifdef __wasi__
    /* A browser run is a short snapshot instead of an endless live clock. */
    int browserUpdates = 0;
    while (isRunning && browserUpdates < 5) {
#else
    while (isRunning) {
#endif
        
        time(&rawtime);
        
        pTime = localtime(&rawtime);

        printf("\r%02d:%02d:%02d", pTime->tm_hour, pTime->tm_min, pTime->tm_sec);

        sleep(1);
#ifdef __wasi__
        browserUpdates++;
#endif
    }
    return 0;
}

