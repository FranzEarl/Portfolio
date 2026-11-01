#include <stdio.h>
#include <string.h>

#define MAX_EXPENSES 100

typedef struct {
    char name[50];
    char category[30];
    double amount;
    char date[11];
} Expense;

void saveExpenses(Expense expenses[], int count) {
    FILE *file = fopen("expenses.txt", "w");

    if(file == NULL) {
        printf("Error saving expenses!\n");
        return;
    }
    
    for (int i = 0; i < count; i++) {
        fprintf(file, "%s|%s|%.2f|%s\n",
                expenses[i].name,
                expenses[i].category,
                expenses[i].amount,
                expenses[i].date);
    }
    fclose(file);
}

void loadExpenses(Expense expenses[], int *count) {
    FILE *file = fopen("expenses.txt", "r");

    if (file == NULL) {
        return;
    }

    char name[50];
    char category[30];
    char date[11];
    double amount;

    while (*count < MAX_EXPENSES &&
           fscanf(file, "%49[^|]|%29[^|]|%lf|%10s\n",
                  name, category, &amount, date) == 4) {

        strcpy(expenses[*count].name, name);
        strcpy(expenses[*count].category, category);
        strcpy(expenses[*count].date, date);
        expenses[*count].amount = amount;

        (*count)++;
    }

    fclose(file);
}

void addExpenses(Expense expenses[], int *count) {
    if(*count >= MAX_EXPENSES) {
        printf("Expense limit reached!\n");
        return;
    }

    printf("Enter expense name: ");
    fgets(expenses[*count].name, sizeof(expenses[*count].name), stdin);
    expenses[*count].name[strcspn(expenses[*count].name, "\n")] = '\0';

    printf("Enter category: ");
    fgets(expenses[*count].category, sizeof(expenses[*count].category), stdin);
    expenses[*count].category[strcspn(expenses[*count].category, "\n")] = '\0';

    printf("Enter amount: ");
    scanf("%lf", &expenses[*count].amount);
    getchar();

    printf("Enter date (YYYY-MM-DD): ");
    fgets(expenses[*count].date,sizeof(expenses[*count].date), stdin);
    expenses[*count].date[strcspn(expenses[*count].date, "\n")] = '\0';

    (*count)++;
    saveExpenses(expenses, *count);
    printf("Expense added successfully!\n");
}

void viewExpenses(Expense expenses[], int count) {
    if(count == 0) {
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

void viewTotal(Expense expenses[], int count) {
    if(count == 0) {
        printf("\nNo expenses recorded yet.\n");
        return;
    }

    double total = 0;

    for(int i = 0; i < count; i++) {
        total += expenses[i].amount;
    }

    printf("\n========== TOTAL SPENDING ==========\n");
    printf("Total expenses: %d\n", count);
    printf("Total spent:    %.2f\n", total);
    printf("====================================\n");
}

int main() {
    Expense expenses[MAX_EXPENSES];
    int count = 0;
    int choice;

    loadExpenses(expenses, &count);
    printf("Loaded %d expenses.\n", count);

    do {
        printf("\n========== EXPENSE TRACKER ==========\n");
        printf("1. Add expense\n");
        printf("2. View all expenses\n");
        printf("3. View total spending\n");
        printf("4. Exit\n");
        printf("=====================================\n");
        printf("Choose an option: ");

        scanf("%d", &choice);
        getchar();

        switch (choice) {
            case 1:
                addExpenses(expenses, &count);
                break;
            case 2:
                viewExpenses(expenses, count);
                break;
            case 3:
                viewTotal(expenses, count);
                break;
            case 4:
                printf("Exiting expense tracker...\n");
                break;
            default:
                printf("Invalid option. Try again.\n");
        } 
    } while(choice != 4);

    return 0;
}