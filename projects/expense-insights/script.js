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
    status: document.querySelector("#data-status"),
    total: document.querySelector("#total-spending"),
    count: document.querySelector("#transaction-count"),
    average: document.querySelector("#average-transaction"),
    categories: document.querySelector("#category-chart"),
    months: document.querySelector("#monthly-chart")
};

const savedDataKey = "franzearl.expense-insights.saved-data.v1";
let currentExpenses = sampleExpenses;

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

        return { date, category, amount };
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
    currentExpenses = expenses;
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

function loadExpenses(expenses, sourceMessage) {
    renderDashboard(expenses);
    if (elements.rememberData.checked) {
        saveCurrentExpenses(sourceMessage);
    } else {
        setStatus(sourceMessage);
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
        "date,category,amount",
        ...expenses.map((expense) =>
            [expense.date, expense.category, expense.amount].map(csvEscape).join(",")
        )
    ].join("\r\n") + "\r\n";
}

function saveCurrentExpenses(successMessage = "Current data remembered on this device.") {
    try {
        localStorage.setItem(savedDataKey, serializeExpenses(currentExpenses));
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
        renderDashboard(expenses);
        const label = expenses.length === 1 ? "transaction" : "transactions";
        setStatus(`Restored ${expenses.length} saved ${label} from this device.`);
    } catch (error) {
        setStatus(`Unable to restore saved data: ${error.message}`, true);
    }
}

function clearSavedExpenses() {
    try {
        localStorage.removeItem(savedDataKey);
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
        setStatus("Remembering is off. Previously saved data was removed.");
    } catch (error) {
        elements.rememberData.checked = true;
        setStatus(`Unable to remove saved data: ${error.message}`, true);
    }
});

elements.clearSavedData.addEventListener("click", clearSavedExpenses);

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
    loadExpenses(sampleExpenses, "Showing fictional sample data.");
});

loadExpenses(sampleExpenses, "Showing fictional sample data.");
restoreSavedExpenses();
