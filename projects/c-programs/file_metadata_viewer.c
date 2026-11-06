#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <time.h>
#include <io.h>

int main() {
    char filepath[256];
    struct stat fileInfo;

    printf("==== File Metadata Viewer ====\n");
    printf("Enter file path: ");
    fgets(filepath, sizeof(filepath), stdin);
    filepath[strcspn(filepath, "\n")] = '\0';

    if(stat(filepath, &fileInfo) != 0) {
        perror("stat failed");
        printf("Received path: %s\n", filepath);
        return 1;
    }

    if(S_ISDIR(fileInfo.st_mode)) {
        printf("File Type: Directory\n");
    }
    else if(S_ISREG(fileInfo.st_mode)) {
        printf("File Type: Regular File\n");
    }   
    else {
        printf("File Type: Other\n");
    }

    char *filename = strrchr(filepath, '\\');

    if(filename == NULL) {
        filename = strrchr(filepath, '/');
    }
    filename = (filename == NULL) ? filepath : filename + 1;

    char *extension = strrchr(filename, '.');

    printf("\n==== File Information ====\n");
    printf("File Name: %s\n", filename);
    printf("File Path: %s\n", filepath);
    
    if(S_ISREG(fileInfo.st_mode)) {
        printf("Extension: %s\n", extension != NULL ? extension : "None");
    }
    else {
        printf("Extension: N/A\n");
    }

    double fileSize = (double)fileInfo.st_size;

    if(fileSize < 1024) {
        printf("File Size: %.2f Bytes\n", fileSize);
    }
    else if(fileSize < 1024 * 1024) {
        printf("File Size: %.2f KB\n", fileSize / 1024);
    }
    else if(fileSize < 1024 * 1024 * 1024) {
        printf("File Size: %.2f MB\n", fileSize / (1024 * 1024));
    }
    else if(fileSize < 1024LL * 1024 * 1024 * 1024) {
        printf("File Size: %.2f GB\n", fileSize / (1024.0 * 1024 * 1024));
    }
    else {
        printf("File Size: %.2f TB\n", fileSize / (1024.0 * 1024 * 1024 * 1024));
    }

    struct tm *modified = localtime(&fileInfo.st_mtime);
    char date[50];

    strftime(date, sizeof(date), "%Y-%m-%d %H:%M:%S", modified);

    struct tm *accessed = localtime(&fileInfo.st_atime);
    char accessDate[50];

    strftime(accessDate, sizeof(accessDate), "%Y-%m-%d %H:%M:%S", accessed);

    printf("Last Modified: %s\n", date);
    printf("Last Accessed: %s\n", accessDate);

    printf("Readable: %s\n", _access(filepath, 4) == 0 ? "Yes" : "No");
    printf("Writable: %s\n", _access(filepath, 2) == 0 ? "Yes" : "No");
    printf("Exists: %s\n", _access(filepath, 0) == 0 ? "Yes" : "No");

    return 0;
}