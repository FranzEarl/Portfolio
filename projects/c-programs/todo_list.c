#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_TASKS 100
#define TASK_SIZE 160
#define TASKS_FILE "tasks.txt"

typedef struct {
    char description[TASK_SIZE];
    int completed;
} Task;

int readLine(const char *prompt, char *buffer, size_t size) {
    printf("%s", prompt);

    if (fgets(buffer, size, stdin) == NULL) {
        return 0;
    }

    size_t length = strlen(buffer);
    if (length > 0 && buffer[length - 1] == '\n') {
        buffer[--length] = '\0';
    } else if (!feof(stdin)) {
        int character = getchar();
        if (character != '\n' && character != EOF) {
            while ((character = getchar()) != '\n' && character != EOF) {
            }
            printf("Input is too long. Try again.\n");
            return -1;
        }
    }

    if (length > 0 && buffer[length - 1] == '\r') {
        buffer[length - 1] = '\0';
    }

    return 1;
}

int loadTasks(Task tasks[], int *count) {
    FILE *file = fopen(TASKS_FILE, "r");
    if (file == NULL) {
        if (errno == ENOENT) {
            return 1;
        }
        perror("Could not open tasks file");
        return 0;
    }

    char line[TASK_SIZE + 4];
    int lineNumber = 0;
    while (fgets(line, sizeof(line), file) != NULL) {
        lineNumber++;
        size_t length = strlen(line);
        if (length > 0 && line[length - 1] == '\n') {
            line[--length] = '\0';
        } else if (!feof(file)) {
            fprintf(stderr, "Task record on line %d is too long.\n", lineNumber);
            fclose(file);
            return 0;
        }

        if (length > 0 && line[length - 1] == '\r') {
            line[--length] = '\0';
        }

        char *separator = strchr(line, '|');
        if (separator == NULL || separator != line + 1 ||
            (line[0] != '0' && line[0] != '1') ||
            separator[1] == '\0' || strlen(separator + 1) >= TASK_SIZE) {
            fprintf(stderr, "Invalid task record on line %d.\n", lineNumber);
            fclose(file);
            return 0;
        }
        if (*count >= MAX_TASKS) {
            fprintf(stderr, "Task file contains more than %d tasks.\n",
                    MAX_TASKS);
            fclose(file);
            return 0;
        }

        tasks[*count].completed = line[0] == '1';
        strcpy(tasks[*count].description, separator + 1);
        (*count)++;
    }

    if (ferror(file)) {
        perror("Could not read tasks file");
        fclose(file);
        return 0;
    }
    if (fclose(file) != 0) {
        perror("Could not close tasks file");
        return 0;
    }

    return 1;
}

int saveTasks(const Task tasks[], int count) {
    FILE *file = fopen(TASKS_FILE, "w");
    if (file == NULL) {
        perror("Could not save tasks");
        return 0;
    }

    int success = 1;
    for (int i = 0; i < count; i++) {
        if (fprintf(file, "%d|%s\n", tasks[i].completed,
                    tasks[i].description) < 0) {
            success = 0;
            break;
        }
    }

    if (fclose(file) != 0) {
        success = 0;
    }
    if (!success) {
        perror("Could not save tasks");
    }

    return success;
}

void listTasks(const Task tasks[], int count) {
    if (count == 0) {
        printf("\nNo tasks yet.\n");
        return;
    }

    printf("\n========== TO-DO LIST ==========\n");
    for (int i = 0; i < count; i++) {
        printf("%d. [%c] %s\n", i + 1, tasks[i].completed ? 'x' : ' ',
               tasks[i].description);
    }
    printf("================================\n");
}

void addTask(Task tasks[], int *count) {
    if (*count >= MAX_TASKS) {
        printf("Task limit reached (%d).\n", MAX_TASKS);
        return;
    }

    Task task;
    int result = readLine("Task description: ", task.description,
                          sizeof(task.description));
    if (result != 1) {
        return;
    }
    if (task.description[0] == '\0' ||
        strchr(task.description, '|') != NULL) {
        printf("Task description must not be empty or contain '|'.\n");
        return;
    }

    task.completed = 0;
    tasks[*count] = task;
    (*count)++;
    if (saveTasks(tasks, *count)) {
        printf("Task added.\n");
    } else {
        (*count)--;
    }
}

int readTaskNumber(int count, int *index) {
    char input[32];
    char *end;
    int result = readLine("Task number: ", input, sizeof(input));
    if (result != 1) {
        return result;
    }

    errno = 0;
    long parsed = strtol(input, &end, 10);
    while (*end == ' ' || *end == '\t') {
        end++;
    }
    if (errno != 0 || end == input || *end != '\0' ||
        parsed < 1 || parsed > count) {
        printf("Enter a number from 1 to %d.\n", count);
        return -1;
    }

    *index = (int)parsed - 1;
    return 1;
}

void toggleTask(Task tasks[], int count) {
    if (count == 0) {
        printf("No tasks to update.\n");
        return;
    }

    listTasks(tasks, count);
    int index;
    if (readTaskNumber(count, &index) != 1) {
        return;
    }

    tasks[index].completed = !tasks[index].completed;
    if (saveTasks(tasks, count)) {
        printf("Task marked %s.\n",
               tasks[index].completed ? "complete" : "incomplete");
    } else {
        tasks[index].completed = !tasks[index].completed;
    }
}

void deleteTask(Task tasks[], int *count) {
    if (*count == 0) {
        printf("No tasks to delete.\n");
        return;
    }

    listTasks(tasks, *count);
    int index;
    if (readTaskNumber(*count, &index) != 1) {
        return;
    }

    Task remaining[MAX_TASKS];
    int remainingCount = 0;
    for (int i = 0; i < *count; i++) {
        if (i != index) {
            remaining[remainingCount++] = tasks[i];
        }
    }

    if (saveTasks(remaining, remainingCount)) {
        memcpy(tasks, remaining, sizeof(Task) * remainingCount);
        (*count)--;
        printf("Task deleted.\n");
    }
}

int main(void) {
    Task tasks[MAX_TASKS];
    int count = 0;

    if (!loadTasks(tasks, &count)) {
        return 1;
    }
    printf("Loaded %d task%s.\n", count, count == 1 ? "" : "s");

    char input[32];
    while (1) {
        printf("\n========== TO-DO LIST ==========\n");
        printf("1. Add task\n");
        printf("2. View tasks\n");
        printf("3. Mark task complete/incomplete\n");
        printf("4. Delete task\n");
        printf("5. Exit\n");
        printf("================================\n");

        int result = readLine("Choose an option: ", input, sizeof(input));
        if (result == 0) {
            printf("\nExiting to-do list.\n");
            break;
        }
        if (result != 1 || input[0] < '1' || input[0] > '5' ||
            input[1] != '\0') {
            printf("Choose a number from 1 to 5.\n");
            continue;
        }

        switch (input[0] - '0') {
            case 1:
                addTask(tasks, &count);
                break;
            case 2:
                listTasks(tasks, count);
                break;
            case 3:
                toggleTask(tasks, count);
                break;
            case 4:
                deleteTask(tasks, &count);
                break;
            case 5:
                printf("Exiting to-do list.\n");
                return 0;
        }
    }

    return 0;
}
