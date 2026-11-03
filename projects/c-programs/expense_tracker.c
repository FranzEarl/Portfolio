#include <ctype.h>
#include <errno.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_EXPENSES 100
#define NAME_SIZE 50
#define CATEGORY_SIZE 30
#define DATE_SIZE 11
#define INPUT_SIZE 128
#define DATA_FILE "expenses.txt"

typedef struct {
    char name[NAME_SIZE];
    char category[CATEGORY_SIZE];
    double amount;
    char date[DATE_SIZE];
} Expense;

static int readLine(const char *prompt, char *buffer, size_t size) {
    size_t length;

    printf("%s", prompt);
    if (fgets(buffer, size, stdin) == NULL) {
        return 0;
    }

    length = strcspn(buffer, "\n");
    if (buffer[length] == '\n') {
        buffer[length] = '\0';
    } else {
        int character = getchar();
        if (character != '\n' && character != EOF) {
            while ((character = getchar()) != '\n' && character != EOF) {
            }
            printf("Input is too long. Please try again.\n");
            return -1;
        }
    }

    if (length > 0 && buffer[length - 1] == '\r') {
        buffer[length - 1] = '\0';
    }
    return 1;
}

static int readInteger(const char *prompt, int minimum, int maximum, int *value) {
    char input[INPUT_SIZE];

    for (;;) {
        char *end;
        long parsed;
        int result = readLine(prompt, input, sizeof(input));
        if (result == 0) {
            return 0;
        }
        if (result < 0) {
            continue;
        }

        errno = 0;
        parsed = strtol(input, &end, 10);
        while (isspace((unsigned char)*end)) {
            end++;
        }
        if (errno != ERANGE && end != input && *end == '\0' &&
            parsed >= minimum && parsed <= maximum) {
            *value = (int)parsed;
            return 1;
        }
        printf("Enter a whole number from %d to %d.\n", minimum, maximum);
    }
}

static int readAmount(double *amount) {
    char input[INPUT_SIZE];

    for (;;) {
        char *end;
        double parsed;
        int result = readLine("Enter amount: ", input, sizeof(input));
        if (result == 0) {
            return 0;
        }
        if (result < 0) {
            continue;
        }

        errno = 0;
        parsed = strtod(input, &end);
        while (isspace((unsigned char)*end)) {
            end++;
        }
        if (errno != ERANGE && end != input && *end == '\0' &&
            isfinite(parsed) && parsed >= 0.0) {
            *amount = parsed;
            return 1;
        }
        printf("Enter a valid non-negative amount.\n");
    }
}

static int readField(const char *prompt, char *buffer, size_t size) {
    for (;;) {
        int result = readLine(prompt, buffer, size);
        if (result == 0) {
            return 0;
        }
        if (result < 0) {
            continue;
        }
        if (buffer[0] == '\0') {
            printf("This field cannot be empty.\n");
            continue;
        }
        if (strchr(buffer, '|') != NULL) {
            printf("The | character cannot be used in this field.\n");
            continue;
        }
        return 1;
    }
}

static int isLeapYear(int year) {
    return year % 400 == 0 || (year % 4 == 0 && year % 100 != 0);
}

static int isValidDate(const char *date) {
    int year;
    int month;
    int day;
    int daysInMonth;

    if (strlen(date) != 10 || date[4] != '-' || date[7] != '-') {
        return 0;
    }
    for (int i = 0; i < 10; i++) {
        if (i != 4 && i != 7 && !isdigit((unsigned char)date[i])) {
            return 0;
        }
    }

    year = (date[0] - '0') * 1000 + (date[1] - '0') * 100 +
           (date[2] - '0') * 10 + (date[3] - '0');
    month = (date[5] - '0') * 10 + (date[6] - '0');
    day = (date[8] - '0') * 10 + (date[9] - '0');

    if (year < 1 || month < 1 || month > 12 || day < 1) {
        return 0;
    }
    switch (month) {
        case 2:
            daysInMonth = isLeapYear(year) ? 29 : 28;
            break;
        case 4: case 6: case 9: case 11:
            daysInMonth = 30;
            break;
        default:
            daysInMonth = 31;
            break;
    }
    return day <= daysInMonth;
}

static int saveExpenses(const Expense expenses[], int count) {
    FILE *file = fopen(DATA_FILE, "w");

    if (file == NULL) {
        perror("Could not save expenses");
        return 0;
    }

    for (int i = 0; i < count; i++) {
        if (fprintf(file, "%s|%s|%.2f|%s\n",
                    expenses[i].name,
                    expenses[i].category,
                    expenses[i].amount,
                    expenses[i].date) < 0) {
            perror("Could not write expenses");
            fclose(file);
            return 0;
        }
    }
    if (fclose(file) != 0) {
        perror("Could not finish saving expenses");
        return 0;
    }
    return 1;
}

static void loadExpenses(Expense expenses[], int *count) {
    FILE *file = fopen(DATA_FILE, "r");

    if (file == NULL) {
        return;
    }

    char name[NAME_SIZE];
    char category[CATEGORY_SIZE];
    char date[DATE_SIZE];
    double amount;
    while (*count < MAX_EXPENSES &&
           fscanf(file, "%49[^|]|%29[^|]|%lf|%10s\n",
                  name, category, &amount, date) == 4) {
        if (!isfinite(amount) || amount < 0.0 ||
            strchr(name, '|') != NULL || strchr(category, '|') != NULL ||
            !isValidDate(date)) {
            fprintf(stderr, "Skipping an invalid record in %s.\n", DATA_FILE);
            continue;
        }

        snprintf(expenses[*count].name, NAME_SIZE, "%s", name);
        snprintf(expenses[*count].category, CATEGORY_SIZE, "%s", category);
        snprintf(expenses[*count].date, DATE_SIZE, "%s", date);
        expenses[*count].amount = amount;
        (*count)++;
    }

    if (ferror(file)) {
        perror("Could not read expenses");
    }
    fclose(file);
}

static int addExpense(Expense expenses[], int *count) {
    Expense expense;
    char date[DATE_SIZE + 1];

    if (*count >= MAX_EXPENSES) {
        printf("Expense limit reached!\n");
        return 1;
    }
    if (!readField("Enter expense name: ", expense.name, sizeof(expense.name)) ||
        !readField("Enter category: ", expense.category, sizeof(expense.category)) ||
        !readAmount(&expense.amount) ||
        !readField("Enter date (YYYY-MM-DD): ", date, sizeof(date))) {
        return 0;
    }
    if (strlen(date) >= sizeof(expense.date) || !isValidDate(date)) {
        printf("Enter a valid date in YYYY-MM-DD format.\n");
        return 1;
    }

    memcpy(expense.date, date, DATE_SIZE - 1);
    expense.date[DATE_SIZE - 1] = '\0';
    expenses[*count] = expense;
    (*count)++;
    if (!saveExpenses(expenses, *count)) {
        (*count)--;
        return 1;
    }
    printf("Expense added successfully!\n");
    return 1;
}

static void viewExpenses(const Expense expenses[], int count) {
    if (count == 0) {
        printf("\nNo expenses recorded yet.\n");
        return;
    }

    printf("\n========== ALL EXPENSES ==========\n");
    for (int i = 0; i < count; i++) {
        printf("\nExpense #%d\n", i + 1);
        printf("Name:     %s\n", expenses[i].name);
        printf("Category: %s\n", expenses[i].category);
        printf("Amount:   %.2f\n", expenses[i].amount);
        printf("Date:     %s\n", expenses[i].date);
    }
    printf("\n==================================\n");
}

static void viewTotal(const Expense expenses[], int count) {
    double total = 0.0;

    if (count == 0) {
        printf("\nNo expenses recorded yet.\n");
        return;
    }

    for (int i = 0; i < count; i++) {
        total += expenses[i].amount;
    }

    printf("\n========== TOTAL SPENDING ==========\n");
    printf("Total expenses: %d\n", count);
    printf("Total spent:    %.2f\n", total);
    printf("====================================\n");
}

int main(void) {
    Expense expenses[MAX_EXPENSES];
    int count = 0;
    int choice;

    loadExpenses(expenses, &count);
    printf("Loaded %d expenses.\n", count);

    for (;;) {
        printf("\n========== EXPENSE TRACKER ==========\n");
        printf("1. Add expense\n");
        printf("2. View all expenses\n");
        printf("3. View total spending\n");
        printf("4. Exit\n");
        printf("=====================================\n");

        if (!readInteger("Choose an option: ", 1, 4, &choice)) {
            break;
        }
        switch (choice) {
            case 1:
                if (!addExpense(expenses, &count)) {
                    return 0;
                }
                break;
            case 2:
                viewExpenses(expenses, count);
                break;
            case 3:
                viewTotal(expenses, count);
                break;
            case 4:
                printf("Exiting expense tracker...\n");
                return 0;
        }
    }

    return 0;
}
