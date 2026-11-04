const sampleExpenses = [
    { date: "2026-01-03", category: "Food", amount: 285, description: "Market" },
    { date: "2026-01-08", category: "Transport", amount: 120, description: "Commute" },
    { date: "2026-01-14", category: "Bills", amount: 1450, description: "Internet" },
    { date: "2026-01-22", category: "Food", amount: 430, description: "Groceries" },
    { date: "2026-02-02", category: "Food", amount: 310, description: "Lunch" },
    { date: "2026-02-09", category: "Transport", amount: 180, description: "Commute" },
    { date: "2026-02-15", category: "Learning", amount: 650, description: "Book" },
    { date: "2026-02-24", category: "Food", amount: 520, description: "Groceries" },
    { date: "2026-03-04", category: "Bills", amount: 980, description: "Utilities" },
    { date: "2026-03-10", category: "Food", amount: 360, description: "Lunch" },
    { date: "2026-03-19", category: "Transport", amount: 210, description: "Commute" },
    { date: "2026-03-27", category: "Personal", amount: 790, description: "Essentials" },
    { date: "2026-04-05", category: "Food", amount: 475, description: "Groceries" },
    { date: "2026-04-11", category: "Transport", amount: 160, description: "Commute" },
    { date: "2026-04-17", category: "Learning", amount: 420, description: "Course materials" },
    { date: "2026-04-26", category: "Bills", amount: 1320, description: "Electricity" },
    { date: "2026-05-02", category: "Food", amount: 390, description: "Lunch" },
    { date: "2026-05-13", category: "Transport", amount: 240, description: "Commute" },
    { date: "2026-05-18", category: "Personal", amount: 580, description: "Essentials" },
    { date: "2026-05-29", category: "Food", amount: 610, description: "Groceries" },
    { date: "2026-06-03", category: "Bills", amount: 1100, description: "Internet" },
    { date: "2026-06-12", category: "Food", amount: 340, description: "Lunch" },
    { date: "2026-06-21", category: "Transport", amount: 190, description: "Commute" },
    { date: "2026-06-27", category: "Learning", amount: 850, description: "Workshop" }
];

const currency = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
});

const elements = {
    file: document.querySelector("#csv-file"),
    sampleButton: document.querySelector("#sample-button"),
    exportButton: document.querySelector("#export-button"),
    downloadSample: document.querySelector("#download-sample"),
    rememberData: document.querySelector("#remember-data"),
    clearSavedData: document.querySelector("#clear-saved-data"),
    monthFilter: document.querySelector("#month-filter"),
    categoryFilter: document.querySelector("#category-filter"),
    budgetTarget: document.querySelector("#budget-target"),
    budgetProgress: document.querySelector("#budget-progress"),
    budgetStatus: document.querySelector("#budget-status"),
    status: document.querySelector("#data-status"),
    total: document.querySelector("#total-spending"),
    count: document.querySelector("#transaction-count"),
    average: document.querySelector("#average-transaction"),
    categories: document.querySelector("#category-chart"),
    months: document.querySelector("#monthly-chart"),
    transactionSearch: document.querySelector("#transaction-search"),
    transactionSort: document.querySelector("#transaction-sort"),
    transactionRows: document.querySelector("#transaction-rows"),
    transactionCount: document.querySelector("#transaction-list-count"),
    expenseForm: document.querySelector("#expense-form"),
    expenseFormTitle: document.querySelector("#expense-form-title"),
    expenseDate: document.querySelector("#expense-date"),
    expenseCategory: document.querySelector("#expense-category"),
    expenseDescription: document.querySelector("#expense-description"),
    expenseAmount: document.querySelector("#expense-amount"),
    expenseSubmit: document.querySelector("#expense-submit"),
    expenseCancel: document.querySelector("#expense-cancel")
};

const savedDataKey = "franzearl.expense-insights.saved-data.v1";
const savedBudgetsKey = "franzearl.expense-insights.saved-budgets.v1";
let currentExpenses = sampleExpenses;
const budgetTargets = new Map();
let editingExpenseIndex = null;

function parseCsv(text) {
    const records = [];
    let record = [];
    let field = "";
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];

        if (inQuotes) {
            if (character === '"' && text[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (character === '"') {
                inQuotes = false;
            } else {
                field += character;
            }
        } else if (character === '"' && field.length === 0) {
            inQuotes = true;
        } else if (character === ",") {
            record.push(field);
            field = "";
        } else if (character === "\n" || character === "\r") {
            record.push(field);
            if (record.some((value) => value.trim() !== "")) {
                records.push(record);
            }
            record = [];
            field = "";
            if (character === "\r" && text[index + 1] === "\n") {
                index += 1;
            }
        } else {
            field += character;
        }
    }

    if (inQuotes) {
        throw new Error("The CSV has an unfinished quoted field.");
    }
    if (field.length > 0 || record.length > 0) {
        record.push(field);
        records.push(record);
    }

    return records;
}

function parseExpenses(text) {
    const records = parseCsv(text);
    if (records.length < 2) {
        throw new Error("The CSV needs a header row and at least one expense.");
    }

    const headers = records[0].map((header) =>
        header.trim().replace(/^\uFEFF/, "").toLowerCase()
    );
    const dateColumn = headers.indexOf("date");
    const categoryColumn = headers.indexOf("category");
    const amountColumn = headers.indexOf("amount");
    const descriptionColumn = headers.indexOf("description");

    if (dateColumn === -1 || categoryColumn === -1 || amountColumn === -1) {
        throw new Error("Required CSV columns: date, category, amount.");
    }

    const expenses = records.slice(1).map((record, rowIndex) => {
        const date = (record[dateColumn] || "").trim();
        const category = (record[categoryColumn] || "").trim();
        const amountText = (record[amountColumn] || "").trim();
        const amount = Number(amountText);
        const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

        if (!dateMatch || !isValidDate(dateMatch)) {
            throw new Error(`Row ${rowIndex + 2}: use a valid YYYY-MM-DD date.`);
        }
        if (!category) {
            throw new Error(`Row ${rowIndex + 2}: category cannot be empty.`);
        }
        if (amountText === "" || !Number.isFinite(amount) || amount < 0) {
            throw new Error(`Row ${rowIndex + 2}: amount must be a non-negative number.`);
        }

        const description = descriptionColumn === -1
            ? ""
            : (record[descriptionColumn] || "").trim();
        return { date, category, amount, description };
    });

    return expenses;
}

function isValidDate(match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
}

function setStatus(message, isError = false) {
    elements.status.textContent = message;
    elements.status.dataset.error = String(isError);
}

function renderChart(container, entries, emptyMessage) {
    container.replaceChildren();
    if (entries.length === 0) {
        const empty = document.createElement("p");
        empty.className = "chart-empty";
        empty.textContent = emptyMessage;
        container.append(empty);
        return;
    }

    const maximum = Math.max(...entries.map((entry) => entry.amount));
    entries.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "chart-row";

        const labels = document.createElement("div");
        labels.className = "chart-row-labels";

        const name = document.createElement("span");
        name.textContent = entry.label;

        const amount = document.createElement("span");
        amount.textContent = currency.format(entry.amount);

        const track = document.createElement("div");
        track.className = "chart-track";
        track.setAttribute("aria-hidden", "true");

        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.width = `${(entry.amount / maximum) * 100}%`;

        labels.append(name, amount);
        track.append(bar);
        row.append(labels, track);
        container.append(row);
    });
}

function renderDashboard(expenses) {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    elements.total.textContent = currency.format(total);
    elements.count.textContent = expenses.length.toLocaleString("en-PH");
    elements.average.textContent = currency.format(expenses.length ? total / expenses.length : 0);

    const categories = new Map();
    const months = new Map();
    expenses.forEach((expense) => {
        categories.set(
            expense.category,
            (categories.get(expense.category) || 0) + expense.amount
        );
        const month = expense.date.slice(0, 7);
        months.set(month, (months.get(month) || 0) + expense.amount);
    });

    const categoryEntries = [...categories]
        .map(([label, amount]) => ({ label, amount }))
        .sort((left, right) => right.amount - left.amount);
    const monthEntries = [...months]
        .map(([label, amount]) => ({ label, amount }))
        .sort((left, right) => left.label.localeCompare(right.label))
        .slice(-8)
        .map((entry) => ({
            ...entry,
            label: new Intl.DateTimeFormat("en", {
                month: "short",
                year: "numeric",
                timeZone: "UTC"
            }).format(new Date(`${entry.label}-01T00:00:00Z`))
        }));

    renderChart(elements.categories, categoryEntries, "No expense categories to show.");
    renderChart(elements.months, monthEntries, "No monthly spending to show.");
}

function renderTransactions(expenses) {
    elements.transactionCount.textContent =
        `${expenses.length} ${expenses.length === 1 ? "transaction" : "transactions"}`;

    if (expenses.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.className = "transaction-empty";
        cell.textContent = "No transactions match the search or selected filters.";
        row.append(cell);
        elements.transactionRows.replaceChildren(row);
        return;
    }

    const rows = expenses.map((expense) => {
        const row = document.createElement("tr");
        const values = [
            expense.date,
            expense.category,
            expense.description || "—",
            currency.format(expense.amount)
        ];
        const expenseIndex = currentExpenses.indexOf(expense);

        values.forEach((value, index) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            if (index === 3) {
                cell.className = "transaction-amount";
            }
            row.append(cell);
        });

        const actions = document.createElement("td");
        actions.className = "transaction-actions";
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.setAttribute("aria-label", `Edit ${expense.category} expense from ${expense.date}`);
        editButton.addEventListener("click", () => editExpense(expenseIndex));
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete ${expense.category} expense from ${expense.date}`);
        deleteButton.addEventListener("click", () => deleteExpense(expenseIndex));
        actions.append(editButton, deleteButton);
        row.append(actions);
        return row;
    });

    elements.transactionRows.replaceChildren(...rows);
}

function resetExpenseForm() {
    editingExpenseIndex = null;
    elements.expenseFormTitle.textContent = "Add an expense";
    elements.expenseSubmit.textContent = "Add expense";
    elements.expenseCancel.hidden = true;
    elements.expenseDate.value = "";
    elements.expenseCategory.value = "";
    elements.expenseDescription.value = "";
    elements.expenseAmount.value = "";
}

function editExpense(index) {
    const expense = currentExpenses[index];
    if (!expense) return;

    editingExpenseIndex = index;
    elements.expenseFormTitle.textContent = "Edit an expense";
    elements.expenseSubmit.textContent = "Save changes";
    elements.expenseCancel.hidden = false;
    elements.expenseDate.value = expense.date;
    elements.expenseCategory.value = expense.category;
    elements.expenseDescription.value = expense.description || "";
    elements.expenseAmount.value = String(expense.amount);
    setStatus(`Editing the ${expense.category} expense from ${expense.date}.`);
}

function deleteExpense(index) {
    const expense = currentExpenses[index];
    if (!expense) return;
    if (!confirm(`Delete the ${expense.category} expense from ${expense.date}?`)) return;

    const updatedExpenses = currentExpenses.filter((_, expenseIndex) => expenseIndex !== index);
    loadExpenses(updatedExpenses, "Expense deleted.");
}

function saveExpense(event) {
    event.preventDefault();

    const date = elements.expenseDate.value.trim();
    const category = elements.expenseCategory.value.trim();
    const description = elements.expenseDescription.value.trim();
    const amountText = elements.expenseAmount.value.trim();
    const amount = Number(amountText);
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (!dateMatch || !isValidDate(dateMatch)) {
        setStatus("Use a valid YYYY-MM-DD date.", true);
        return;
    }
    if (!category || category.length > 80) {
        setStatus("Enter a category with at most 80 characters.", true);
        return;
    }
    if (description.length > 200) {
        setStatus("Keep the description to 200 characters or fewer.", true);
        return;
    }
    if (amountText === "" || !Number.isFinite(amount) || amount < 0) {
        setStatus("Amount must be a non-negative number.", true);
        return;
    }

    const expense = { date, category, amount, description };
    const updatedExpenses = [...currentExpenses];
    const isEditing = editingExpenseIndex !== null;
    if (isEditing) {
        if (!updatedExpenses[editingExpenseIndex]) return;
        updatedExpenses[editingExpenseIndex] = expense;
    } else {
        updatedExpenses.push(expense);
    }

    resetExpenseForm();
    loadExpenses(updatedExpenses, isEditing ? "Expense updated." : "Expense added.");
}

function filterExpenses() {
    const month = elements.monthFilter.value;
    const category = elements.categoryFilter.value;
    return currentExpenses.filter((expense) =>
        (!month || expense.date.slice(0, 7) === month) &&
        (!category || expense.category === category)
    );
}

function renderFilteredExpenses(statusMessage) {
    const filteredExpenses = filterExpenses();
    const matchingExpenses = filterTransactions(filteredExpenses);
    renderDashboard(filteredExpenses);
    renderTransactions(matchingExpenses);
    renderBudget();
    if (statusMessage) {
        setStatus(statusMessage);
    } else if (elements.transactionSearch.value.trim()) {
        setStatus(
            `Showing ${matchingExpenses.length} of ${filteredExpenses.length} transactions ` +
            "matching the search."
        );
    } else {
        setStatus(`Showing ${filteredExpenses.length} of ${currentExpenses.length} transactions.`);
    }
}

function filterTransactions(expenses) {
    const query = elements.transactionSearch.value.trim().toLocaleLowerCase();
    const matchingExpenses = query
        ? expenses.filter((expense) =>
            [expense.date, expense.category, expense.description]
                .some((value) => value.toLocaleLowerCase().includes(query))
        )
        : [...expenses];

    switch (elements.transactionSort.value) {
        case "date-desc":
            matchingExpenses.sort((left, right) => right.date.localeCompare(left.date));
            break;
        case "date-asc":
            matchingExpenses.sort((left, right) => left.date.localeCompare(right.date));
            break;
        case "amount-desc":
            matchingExpenses.sort((left, right) => right.amount - left.amount);
            break;
        case "amount-asc":
            matchingExpenses.sort((left, right) => left.amount - right.amount);
            break;
    }

    return matchingExpenses;
}

function renderBudget() {
    const month = elements.monthFilter.value;
    const rawBudget = elements.budgetTarget.value.trim();

    elements.budgetProgress.hidden = true;
    if (!month) {
        elements.budgetStatus.textContent = "Choose a month to view monthly budget progress.";
        return;
    }
    if (rawBudget === "") {
        elements.budgetStatus.textContent = "Enter a monthly budget to track spending.";
        return;
    }

    const budget = Number(rawBudget);
    if (!Number.isFinite(budget) || budget <= 0) {
        elements.budgetStatus.textContent = "Enter a budget greater than zero.";
        return;
    }

    const spent = currentExpenses
        .filter((expense) => expense.date.slice(0, 7) === month)
        .reduce((total, expense) => total + expense.amount, 0);
    const remaining = budget - spent;
    elements.budgetProgress.hidden = false;
    elements.budgetProgress.value = Math.min((spent / budget) * 100, 100);

    if (remaining > 0) {
        elements.budgetStatus.textContent =
            `${currency.format(remaining)} remaining of ${currency.format(budget)} ` +
            `(${currency.format(spent)} spent this month).`;
    } else if (remaining === 0) {
        elements.budgetStatus.textContent =
            `Monthly budget reached: ${currency.format(spent)} of ${currency.format(budget)} spent.`;
    } else {
        elements.budgetStatus.textContent =
            `Over budget by ${currency.format(Math.abs(remaining))} ` +
            `(${currency.format(spent)} spent of ${currency.format(budget)}).`;
    }
}

function saveBudgetTargets() {
    if (!elements.rememberData.checked) return;

    if (budgetTargets.size === 0) {
        localStorage.removeItem(savedBudgetsKey);
        return;
    }

    localStorage.setItem(savedBudgetsKey, JSON.stringify(Object.fromEntries(budgetTargets)));
}

function restoreBudgetTargets() {
    const savedBudgets = localStorage.getItem(savedBudgetsKey);
    if (savedBudgets === null) return;

    const parsedBudgets = JSON.parse(savedBudgets);
    if (!parsedBudgets || typeof parsedBudgets !== "object" || Array.isArray(parsedBudgets)) {
        throw new Error("Saved monthly budgets have an invalid format.");
    }

    const targets = Object.entries(parsedBudgets);
    targets.forEach(([month, budget]) => {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
            typeof budget !== "number" || !Number.isFinite(budget) || budget <= 0) {
            throw new Error("Saved monthly budgets contain an invalid target.");
        }
    });
    targets.forEach(([month, budget]) => {
        budgetTargets.set(month, budget);
    });
}

function syncBudgetTargetToMonth() {
    const target = budgetTargets.get(elements.monthFilter.value);
    elements.budgetTarget.value = target === undefined ? "" : String(target);
    renderBudget();
}

function updateBudgetTarget() {
    const month = elements.monthFilter.value;
    const rawBudget = elements.budgetTarget.value.trim();

    if (month && rawBudget === "") {
        budgetTargets.delete(month);
    } else if (month && Number.isFinite(Number(rawBudget)) && Number(rawBudget) > 0) {
        budgetTargets.set(month, Number(rawBudget));
    }

    try {
        saveBudgetTargets();
    } catch (error) {
        setStatus(`Unable to save monthly budget on this device: ${error.message}`, true);
    }
    renderBudget();
}

function updateFilterOptions(reset = false) {
    const selections = [
        {
            element: elements.monthFilter,
            placeholder: "All months",
            values: [...new Set(currentExpenses.map((expense) => expense.date.slice(0, 7)))]
                .sort((left, right) => right.localeCompare(left))
                .map((month) => ({
                    value: month,
                    label: new Intl.DateTimeFormat("en", {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC"
                    }).format(new Date(`${month}-01T00:00:00Z`))
                }))
        },
        {
            element: elements.categoryFilter,
            placeholder: "All categories",
            values: [...new Set(currentExpenses.map((expense) => expense.category))]
                .sort((left, right) => left.localeCompare(right))
                .map((category) => ({ value: category, label: category }))
        }
    ];

    selections.forEach(({ element, placeholder, values }) => {
        const selectedValue = reset ? "" : element.value;
        const options = [document.createElement("option"), ...values.map(() =>
            document.createElement("option")
        )];
        options[0].value = "";
        options[0].textContent = placeholder;
        values.forEach((option, index) => {
            options[index + 1].value = option.value;
            options[index + 1].textContent = option.label;
        });
        element.replaceChildren(...options);
        element.value = values.some((option) => option.value === selectedValue)
            ? selectedValue
            : "";
    });
}

function loadExpenses(expenses, sourceMessage, resetFilters = false) {
    resetExpenseForm();
    currentExpenses = expenses;
    updateFilterOptions(resetFilters);
    syncBudgetTargetToMonth();
    renderFilteredExpenses(sourceMessage);
    if (elements.rememberData.checked) {
        saveCurrentExpenses(`${sourceMessage} Remembered on this device.`);
    }
}

function csvEscape(value) {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const sampleCsv = [
    "date,category,amount,description",
    ...sampleExpenses.map((expense) =>
        [expense.date, expense.category, expense.amount, expense.description]
            .map(csvEscape)
            .join(",")
    )
].join("\r\n");
function serializeExpenses(expenses) {
    return [
        "date,category,amount,description",
        ...expenses.map((expense) =>
            [expense.date, expense.category, expense.amount, expense.description || ""]
                .map(csvEscape)
                .join(",")
        )
    ].join("\r\n") + "\r\n";
}

function saveCurrentExpenses(successMessage = "Current data remembered on this device.") {
    try {
        localStorage.setItem(savedDataKey, serializeExpenses(currentExpenses));
        saveBudgetTargets();
        setStatus(successMessage);
    } catch (error) {
        setStatus(`Unable to save data on this device: ${error.message}`, true);
    }
}

function restoreSavedExpenses() {
    try {
        const savedCsv = localStorage.getItem(savedDataKey);
        if (savedCsv === null) return;

        const expenses = parseExpenses(savedCsv);
        elements.rememberData.checked = true;
        let budgetRestoreError = null;
        try {
            restoreBudgetTargets();
        } catch (error) {
            budgetRestoreError = error;
        }
        currentExpenses = expenses;
        updateFilterOptions();
        syncBudgetTargetToMonth();
        renderFilteredExpenses();
        const label = expenses.length === 1 ? "transaction" : "transactions";
        const status = `Restored ${expenses.length} saved ${label} from this device.`;
        setStatus(
            budgetRestoreError
                ? `${status} Monthly budgets could not be restored: ${budgetRestoreError.message}`
                : status,
            Boolean(budgetRestoreError)
        );
    } catch (error) {
        setStatus(`Unable to restore saved data: ${error.message}`, true);
    }
}

function clearSavedExpenses() {
    try {
        localStorage.removeItem(savedDataKey);
        localStorage.removeItem(savedBudgetsKey);
        elements.rememberData.checked = false;
        setStatus("Saved data cleared. The current dashboard remains until you leave or reload.");
    } catch (error) {
        setStatus(`Unable to clear saved data: ${error.message}`, true);
    }
}

elements.downloadSample.href = URL.createObjectURL(
    new Blob([sampleCsv], { type: "text/csv;charset=utf-8" })
);

elements.rememberData.addEventListener("change", () => {
    if (elements.rememberData.checked) {
        saveCurrentExpenses();
        if (elements.status.dataset.error === "true") {
            elements.rememberData.checked = false;
        }
        return;
    }

    try {
        localStorage.removeItem(savedDataKey);
        localStorage.removeItem(savedBudgetsKey);
        setStatus("Remembering is off. Previously saved data was removed.");
    } catch (error) {
        elements.rememberData.checked = true;
        setStatus(`Unable to remove saved data: ${error.message}`, true);
    }
});

elements.clearSavedData.addEventListener("click", clearSavedExpenses);
elements.expenseForm.addEventListener("submit", saveExpense);
elements.expenseCancel.addEventListener("click", () => {
    resetExpenseForm();
    setStatus("Expense edit canceled.");
});

elements.monthFilter.addEventListener("change", () => {
    syncBudgetTargetToMonth();
    renderFilteredExpenses();
});
elements.categoryFilter.addEventListener("change", () => renderFilteredExpenses());
elements.budgetTarget.addEventListener("input", updateBudgetTarget);
elements.transactionSearch.addEventListener("input", () => {
    const filteredExpenses = filterExpenses();
    const matchingExpenses = filterTransactions(filteredExpenses);
    renderTransactions(matchingExpenses);
    setStatus(
        `Showing ${matchingExpenses.length} of ${filteredExpenses.length} transactions ` +
        "matching the search."
    );
});
elements.transactionSort.addEventListener("change", () => {
    renderTransactions(filterTransactions(filterExpenses()));
});

elements.exportButton.addEventListener("click", () => {
    const filename = "expenses.csv";

    try {
        const blob = new Blob([serializeExpenses(currentExpenses)], {
            type: "text/csv;charset=utf-8"
        });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        try {
            link.click();
        } finally {
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
        }
        setStatus(`Downloaded ${filename}.`);
    } catch (error) {
        setStatus(`Unable to export CSV: ${error.message}`, true);
    }
});

elements.file.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;

    try {
        const expenses = parseExpenses(await file.text());
        loadExpenses(expenses, `Loaded ${expenses.length} transactions from ${file.name}.`);
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        elements.file.value = "";
    }
});

elements.sampleButton.addEventListener("click", () => {
    loadExpenses(sampleExpenses, "Showing fictional sample data.", true);
});

loadExpenses(sampleExpenses, "Showing fictional sample data.");
restoreSavedExpenses();
