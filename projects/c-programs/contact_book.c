#include <ctype.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_CONTACTS 100
#define NAME_SIZE 100
#define PHONE_SIZE 32
#define EMAIL_SIZE 100
#define CONTACTS_FILE "contacts.txt"

typedef struct {
    char name[NAME_SIZE];
    char phone[PHONE_SIZE];
    char email[EMAIL_SIZE];
} Contact;

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

int hasDelimiter(const char *value) {
    return strchr(value, '|') != NULL;
}

int readContactFields(Contact *contact) {
    int result = readLine("Name: ", contact->name, sizeof(contact->name));
    if (result != 1) {
        return result;
    }
    if (contact->name[0] == '\0' || hasDelimiter(contact->name)) {
        printf("Name must not be empty or contain '|'.\n");
        return -1;
    }

    result = readLine("Phone: ", contact->phone, sizeof(contact->phone));
    if (result != 1) {
        return result;
    }
    if (contact->phone[0] == '\0' || hasDelimiter(contact->phone)) {
        printf("Phone must not be empty or contain '|'.\n");
        return -1;
    }

    result = readLine("Email (optional): ", contact->email,
                      sizeof(contact->email));
    if (result != 1) {
        return result;
    }
    if (hasDelimiter(contact->email)) {
        printf("Email must not contain '|'.\n");
        return -1;
    }

    return 1;
}

int loadContacts(Contact contacts[], int *count) {
    FILE *file = fopen(CONTACTS_FILE, "r");
    if (file == NULL) {
        if (errno == ENOENT) {
            return 1;
        }
        perror("Could not open contacts file");
        return 0;
    }

    char line[NAME_SIZE + PHONE_SIZE + EMAIL_SIZE + 4];
    int lineNumber = 0;

    while (fgets(line, sizeof(line), file) != NULL) {
        lineNumber++;
        size_t length = strlen(line);
        if (length > 0 && line[length - 1] == '\n') {
            line[--length] = '\0';
        } else if (!feof(file)) {
            fprintf(stderr, "Contact record on line %d is too long.\n",
                    lineNumber);
            fclose(file);
            return 0;
        }

        if (length > 0 && line[length - 1] == '\r') {
            line[length - 1] = '\0';
        }

        char *nameEnd = strchr(line, '|');
        char *phoneEnd = nameEnd == NULL ? NULL : strchr(nameEnd + 1, '|');
        if (nameEnd == NULL || phoneEnd == NULL ||
            strchr(phoneEnd + 1, '|') != NULL) {
            fprintf(stderr, "Invalid contact record on line %d.\n", lineNumber);
            fclose(file);
            return 0;
        }

        *nameEnd = '\0';
        *phoneEnd = '\0';
        size_t nameLength = strlen(line);
        size_t phoneLength = strlen(nameEnd + 1);
        size_t emailLength = strlen(phoneEnd + 1);
        if (nameLength == 0 || phoneLength == 0 ||
            nameLength >= NAME_SIZE || phoneLength >= PHONE_SIZE ||
            emailLength >= EMAIL_SIZE) {
            fprintf(stderr, "Invalid contact fields on line %d.\n", lineNumber);
            fclose(file);
            return 0;
        }
        if (*count >= MAX_CONTACTS) {
            fprintf(stderr, "Contact file contains more than %d contacts.\n",
                    MAX_CONTACTS);
            fclose(file);
            return 0;
        }

        strcpy(contacts[*count].name, line);
        strcpy(contacts[*count].phone, nameEnd + 1);
        strcpy(contacts[*count].email, phoneEnd + 1);
        (*count)++;
    }

    if (ferror(file)) {
        perror("Could not read contacts file");
        fclose(file);
        return 0;
    }

    if (fclose(file) != 0) {
        perror("Could not close contacts file");
        return 0;
    }

    return 1;
}

int saveContacts(const Contact contacts[], int count) {
    FILE *file = fopen(CONTACTS_FILE, "w");
    if (file == NULL) {
        perror("Could not save contacts");
        return 0;
    }

    int success = 1;
    for (int i = 0; i < count; i++) {
        if (fprintf(file, "%s|%s|%s\n", contacts[i].name, contacts[i].phone,
                    contacts[i].email) < 0) {
            success = 0;
            break;
        }
    }

    if (fclose(file) != 0) {
        success = 0;
    }
    if (!success) {
        perror("Could not save contacts");
    }

    return success;
}

void displayContact(const Contact *contact, int number) {
    printf("\nContact #%d\n", number);
    printf("Name:  %s\n", contact->name);
    printf("Phone: %s\n", contact->phone);
    printf("Email: %s\n", contact->email[0] == '\0' ? "(not provided)" :
                                                        contact->email);
}

void listContacts(const Contact contacts[], int count) {
    if (count == 0) {
        printf("\nNo contacts saved yet.\n");
        return;
    }

    printf("\n========== CONTACTS ==========\n");
    for (int i = 0; i < count; i++) {
        displayContact(&contacts[i], i + 1);
    }
    printf("\n==============================\n");
}

int containsIgnoreCase(const char *text, const char *query) {
    for (; *text != '\0'; text++) {
        const char *textPosition = text;
        const char *queryPosition = query;

        while (*queryPosition != '\0' &&
               tolower((unsigned char)*textPosition) ==
                   tolower((unsigned char)*queryPosition)) {
            textPosition++;
            queryPosition++;
        }

        if (*queryPosition == '\0') {
            return 1;
        }
    }

    return 0;
}

void searchContacts(const Contact contacts[], int count) {
    char query[NAME_SIZE];
    int result = readLine("Search name: ", query, sizeof(query));
    if (result != 1) {
        return;
    }
    if (query[0] == '\0') {
        printf("Search text must not be empty.\n");
        return;
    }

    int matches = 0;
    for (int i = 0; i < count; i++) {
        if (containsIgnoreCase(contacts[i].name, query)) {
            displayContact(&contacts[i], i + 1);
            matches++;
        }
    }
    if (matches == 0) {
        printf("No contacts matched \"%s\".\n", query);
    }
}

int readContactNumber(int count, int *number) {
    char input[32];
    char *end;
    int result = readLine("Contact number: ", input, sizeof(input));
    if (result != 1) {
        return result;
    }

    errno = 0;
    long parsed = strtol(input, &end, 10);
    while (isspace((unsigned char)*end)) {
        end++;
    }
    if (errno != 0 || end == input || *end != '\0' ||
        parsed < 1 || parsed > count) {
        printf("Enter a number from 1 to %d.\n", count);
        return -1;
    }

    *number = (int)parsed - 1;
    return 1;
}

void editContact(Contact contacts[], int count) {
    if (count == 0) {
        printf("No contacts to edit.\n");
        return;
    }

    listContacts(contacts, count);
    int index;
    if (readContactNumber(count, &index) != 1) {
        return;
    }

    Contact updated;
    if (readContactFields(&updated) != 1) {
        return;
    }

    contacts[index] = updated;
    if (saveContacts(contacts, count)) {
        printf("Contact updated.\n");
    }
}

void addContact(Contact contacts[], int *count) {
    if (*count >= MAX_CONTACTS) {
        printf("Contact limit reached (%d).\n", MAX_CONTACTS);
        return;
    }

    Contact contact;
    if (readContactFields(&contact) != 1) {
        return;
    }

    contacts[*count] = contact;
    (*count)++;
    if (saveContacts(contacts, *count)) {
        printf("Contact added.\n");
    }
}

void deleteContact(Contact contacts[], int *count) {
    if (*count == 0) {
        printf("No contacts to delete.\n");
        return;
    }

    listContacts(contacts, *count);
    int index;
    if (readContactNumber(*count, &index) != 1) {
        return;
    }

    char confirmation[8];
    int result = readLine("Delete this contact? (y/n): ", confirmation,
                          sizeof(confirmation));
    if (result != 1) {
        return;
    }
    if (tolower((unsigned char)confirmation[0]) != 'y' ||
        confirmation[1] != '\0') {
        printf("Deletion cancelled.\n");
        return;
    }

    for (int i = index; i < *count - 1; i++) {
        contacts[i] = contacts[i + 1];
    }
    (*count)--;
    if (saveContacts(contacts, *count)) {
        printf("Contact deleted.\n");
    }
}

int main(void) {
    Contact contacts[MAX_CONTACTS];
    int count = 0;

    if (!loadContacts(contacts, &count)) {
        return 1;
    }
    printf("Loaded %d contact%s.\n", count, count == 1 ? "" : "s");

    char input[32];
    while (1) {
        printf("\n========== CONTACT BOOK ==========\n");
        printf("1. Add contact\n");
        printf("2. View all contacts\n");
        printf("3. Search contacts\n");
        printf("4. Edit contact\n");
        printf("5. Delete contact\n");
        printf("6. Exit\n");
        printf("==================================\n");

        int result = readLine("Choose an option: ", input, sizeof(input));
        if (result == 0) {
            printf("\nExiting contact book.\n");
            break;
        }
        if (result != 1 || input[0] < '1' || input[0] > '6' ||
            input[1] != '\0') {
            printf("Choose a number from 1 to 6.\n");
            continue;
        }

        switch (input[0] - '0') {
            case 1:
                addContact(contacts, &count);
                break;
            case 2:
                listContacts(contacts, count);
                break;
            case 3:
                searchContacts(contacts, count);
                break;
            case 4:
                editContact(contacts, count);
                break;
            case 5:
                deleteContact(contacts, &count);
                break;
            case 6:
                printf("Exiting contact book.\n");
                return 0;
        }
    }

    return 0;
}
