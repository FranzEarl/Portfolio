#include <stdio.h>
#include <string.h>

#define MAX_TEXT 5000
#define MAX_LINE 256

int main() {
    char text[MAX_TEXT] = "";
    char line[MAX_LINE];
    int withoutSpaces = 0;
    int words = 0;
    int sentences = 0;
    int lines = 0;

    printf("Enter you text (type END on its own line to finish):\n\n");

    while(fgets(line, sizeof(line), stdin) != NULL) {
        if(strcmp(line, "END\n") == 0 ||
           strcmp(line, "END") == 0) {
            break;
        }

        if(strlen(text) + strlen(line) >= sizeof(text)) {
            printf("Text limit reached:\n");
            break;
        }

        strcat(text, line);
    }
    printf("\nYour input:\n%s", text);

    for(int i = 0; text[i] != '\0'; i++) {
        if(text[i] != ' ' && text[i] != '\t' && text[i] != '\n') {
            withoutSpaces++;
        }
    }
    int withSpaces = strlen(text);

    for(int i = 0; text[i] != '\0'; i++) {
        if(text[i] != ' ' && text[i] != '\t' && text[i] != '\n') {
            if(i == 0 || text[i - 1] == ' ' || text[i - 1] == '\t' ||
                         text[i - 1] == '\n') {
                words++;
            }
        }
    }

    for(int i = 0; text[i] != '\0'; i++) {
        if(text[i] == '.' || text[i] == '!' || text[i] == '?'){
            sentences++;
        }
    }

    if(text[0] != '\0') {
        lines = 1;

        for(int i = 0; text[i] != '\0'; i++) {
            if(text[i] == '\n') {
                lines++;
            }
        }
        if(text[strlen(text) - 1] == '\n') {
            lines--;
        }
    }
    
    printf("\n========== TEXT ANALYSIS ==========\n");
    printf("Characters (with whitespace):    %d\n", withSpaces);
    printf("Characters (without whitespace): %d\n", withoutSpaces);
    printf("Words:                           %d\n", words);
    printf("Sentences:                       %d\n", sentences);
    printf("Lines:                           %d\n", lines);
    printf("===================================\n");

    return 0;
}