#include <stdio.h>
#include <string.h>
#include <time.h>

typedef struct {
    int day;
    int month;
    int year;
} Date;

void clearInputBuffer() {
    int ch;

    while((ch = getchar()) != '\n' && ch != EOF) {
    }
}

Date inputDate() {
    Date date = {0, 0, 0};
    char input[100];

    printf("Enter date (DD-MM-YYYY) or 'today': ");
    if(scanf("%99s", input) != 1) {
        printf("Invalid input!\n");
        clearInputBuffer();
        return date;
    }
    clearInputBuffer();

    char extra;

    if(strcmp(input, "today") == 0) {
        time_t currentTime = time(NULL);
        struct tm *date0 = localtime(&currentTime);

        date.day = date0->tm_mday;
        date.month = date0->tm_mon + 1;
        date.year = date0->tm_year + 1900;
    }
    else if(sscanf(input, "%d-%d-%d %c",
                   &date.day, &date.month, &date.year, &extra) != 3) {
        printf("Invalid input!\n");
    }

    return date;
}

int isLeapYear(int year) {
    if(year % 400 == 0) {
        return 1;
    }
    if(year % 100 == 0) {
        return 0;
    }
    if(year % 4 == 0) {
        return 1;
    }
    return 0;
}

int daysInMonth(int month, int year) {
    switch(month) {
        case 1: case 3: case 5:
        case 7: case 8: case 10: case 12:
            return 31;
        case 4: case 6: case 9: case 11:
            return 30;
        case 2:
            return isLeapYear(year) ? 29 : 28;
        default:
            return 0;
    }
}

int isValidDate(Date date) {
    if(date.year < 1) {
        return 0;
    }
    if(date.month < 1 || date.month > 12) {
        return 0;
    }
    if(date.day < 1 || date.day > daysInMonth(date.month, date.year)) {
        return 0;
    }
    return 1;
}

int dayOfWeek(Date date) {
    int day = date.day;
    int month = date.month;
    int year = date.year;

    if(month < 3) {
        month += 12;
        year --;
    }

    int k = year % 100;
    int j = year / 100;
    int h = (day + (13 * (month + 1)) / 5 + k + k / 4 + j / 4 + 5 * j) % 7;

    return (h + 6) % 7;
}

long long dateToDays(Date date) {
    long long year = date.year - 1;

    long long days = year * 365
                   + year / 4
                   - year / 100
                   + year / 400;
    
    for(int month = 1; month < date.month; month++) {
        days += daysInMonth(month, date.year);
    }

    days += date.day - 1;

    return days;
}

long long daysBetween(Date date1, Date date2) {
    long long days1 = dateToDays(date1);
    long long days2 = dateToDays(date2);

    return days2 - days1;
}

Date daysToDate(long long days) {
    Date date;

    int year = 1;

    while(1) {
        int daysInYear = isLeapYear(year) ? 366 : 365;

        if(days < daysInYear) {
            break;
        }
        days -= daysInYear;
        year++;
    }
    date.year = year;

    int month = 1;

    while(1) {
        int daysInCurrentMonth = daysInMonth(month, year);

        if(days < daysInCurrentMonth) {
            break;
        }
        days -= daysInCurrentMonth;
        month++;
    }
    date.month = month;
    date.day = days + 1;

    return date;
}

Date addDays(Date date, long long days) {
    long long totalDays = dateToDays(date);

    return daysToDate(totalDays + days);
}

Date subtractDays(Date date, long long days) {
    long long totalDays = dateToDays(date);

    return daysToDate(totalDays - days);
}

void displayMenu() {
    printf("\n========== DATE CALCULATOR ==========\n");
    printf("1. Calculate days between two dates\n");
    printf("2. Calculate date after N days\n");
    printf("3. Calculate date before N days\n");
    printf("4. Check leap year\n");
    printf("5. Find day of the week\n");
    printf("6. Exit\n");
    printf("=====================================\n");
    printf("Choose an option: ");
}

void calculateDaysBetween() {
    printf("\n--- Calculate Days Between ---\n");

    Date date1 = inputDate();

    if(!isValidDate(date1)) {
        printf("Invalid date!\n");
        return;
    }

    Date date2 = inputDate();

    if(!isValidDate(date2)) {
        printf("Invalid date!\n");
        return;
    }

    long long result = daysBetween(date1, date2);

    printf("\nDays between: %lld\n", result);

    if(result < 0)
        result = -result;

    printf("Absolute difference: %lld days\n", result);
}

void calculateDateAfter() {
    printf("\n--- Calculate Date After N Days ---\n");

    Date date = inputDate();

    if(!isValidDate(date)) {
        printf("Invalid date!\n");
        return;
    }

    long long days;

    printf("How many days to add? ");
    
    if(scanf("%lld", &days) != 1) {
        printf("Invalid input!\n");
        clearInputBuffer();
        return;
    }

    clearInputBuffer();

    if(days < 0) {
        printf("Please enter a non-negative number.\n");
        return;
    }

    Date result = addDays(date, days);

    printf("\nResult: %02d-%02d-%04d\n",
            result.day, result.month, result.year);
}

void calculateDateBefore() {
    printf("\n--- Calculate Date Before N Days ---\n");

    Date date = inputDate();

    if(!isValidDate(date)) {
        printf("Invalid date!\n");
        return;
    }
    
    long long days;

    printf("How many days to subtract? ");
    
    if(scanf("%lld", &days) != 1) {
        printf("Invalid input!\n");
        clearInputBuffer();
        return;
    }

    clearInputBuffer();

    if(days < 0) {
        printf("Please enter a non-negative number.\n");
        return;
    }

    if(days > dateToDays(date)) {
        printf("Result would be before 01-01-0001.\n");
        return;
    }

    Date result = subtractDays(date, days);

    printf("\nResult: %02d-%02d-%04d\n",
            result.day, result.month, result.year);
}

void checkLeapYear() {
    int year;

    printf("\n--- Leap Year Checker ---\n");
    printf("Enter year: ");
    
    if(scanf("%d", &year) != 1) {
        printf("Invalid input!\n");
        clearInputBuffer();
        return;
    }

    clearInputBuffer();

    if(year < 1) {
        printf("Invalid year!\n");
        return;
    }
    if(isLeapYear(year)) {
        printf("%d is a leap year.\n", year);
    }
    else {
        printf("%d is not a leap year.\n", year);
    }
}

void findDayOfWeek() {
    printf("\n--- Day of the Week ---\n");

    Date date = inputDate();

    if(!isValidDate(date)) {
        printf("Invalid date!\n");
        return;
    }

    char *days[] = {
        "Sunday", "Monday", "Tuesday",
        "Wednesday", "Thursday", "Friday", "Saturday"
    };
    printf("\n%s\n", days[dayOfWeek(date)]);
}

int main() {
    int choice;

    do {
        displayMenu();
        
        if(scanf("%d", &choice) != 1) {
            printf("Invalid input!\n");
            clearInputBuffer();
            continue;
        }
        clearInputBuffer();

        switch(choice) {
            case 1:
                calculateDaysBetween();
                break;
            case 2:
                calculateDateAfter();
                break;
            case 3:
                calculateDateBefore();
                break;
            case 4:
                checkLeapYear();
                break;
            case 5:
                findDayOfWeek();
                break;
            case 6:
                printf("Exiting...\n");
                break;

            default:
                printf("Invalid option!\n");
        }
    } while(choice != 6);
    return 0;
}