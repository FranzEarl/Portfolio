const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const dashboardScript = fs.readFileSync(
    path.join(__dirname, "..", "expense-insights", "script.js"),
    "utf8"
);

function createElement() {
    return {
        children: [],
        dataset: {},
        listeners: {},
        style: {},
        textContent: "",
        value: "",
        checked: false,
        addEventListener(type, listener) {
            this.listeners[type] = listener;
        },
        append(...children) {
            this.children.push(...children);
        },
        replaceChildren(...children) {
            this.children = children;
        },
        setAttribute(name, value) {
            this[name] = value;
        }
    };
}

function createStorage() {
    const data = new Map();
    return {
        data,
        getItem(key) {
            return data.has(key) ? data.get(key) : null;
        },
        setItem(key, value) {
            data.set(key, String(value));
        },
        removeItem(key) {
            data.delete(key);
        }
    };
}

function createDashboard(storage = createStorage()) {
    const selectors = [
        "#csv-file",
        "#sample-button",
        "#export-button",
        "#download-sample",
        "#remember-data",
        "#clear-saved-data",
        "#month-filter",
        "#category-filter",
        "#data-status",
        "#total-spending",
        "#transaction-count",
        "#average-transaction",
        "#category-chart",
        "#monthly-chart",
        "#transaction-rows",
        "#transaction-list-count"
    ];
    const elements = new Map(selectors.map((selector) => [selector, createElement()]));
    const downloads = [];
    const blobs = [];
    const context = vm.createContext({
        document: {
            querySelector(selector) {
                assert.ok(elements.has(selector), `Unexpected selector: ${selector}`);
                return elements.get(selector);
            },
            createElement() {
                const created = createElement();
                created.click = function click() {
                    if (this.download) {
                        downloads.push({ href: this.href, filename: this.download });
                    }
                };
                return created;
            }
        },
        Blob: class BlobMock {
            constructor(parts, options) {
                this.text = parts.join("");
                this.type = options.type;
                blobs.push(this);
            }
        },
        URL: {
            createObjectURL(blob) {
                return `blob:expense-insights-${blobs.indexOf(blob)}`;
            },
            revokeObjectURL() {}
        },
        setTimeout(callback) {
            callback();
        },
        localStorage: storage
    });

    vm.runInContext(dashboardScript, context, { filename: "expense-insights/script.js" });
    return {
        elements,
        storage,
        downloads,
        get exportedCsv() {
            return blobs.at(-1).text;
        },
        exportCsv() {
            elements.get("#export-button").listeners.click();
        },
        async importCsv(text, name = "expenses.csv") {
            await elements.get("#csv-file").listeners.change({
                target: {
                    files: [{ name, text: async () => text }]
                }
            });
        }
    };
}

function element(dashboard, selector) {
    return dashboard.elements.get(selector);
}

test("expense dashboard exports current transactions in its import format", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(
        "date,category,amount\n" +
        '2026-07-01,"Food, ""takeout""\nnight",12.5\n'
    );

    dashboard.exportCsv();

    assert.equal(
        dashboard.exportedCsv,
        "date,category,amount,description\r\n" +
        '2026-07-01,"Food, ""takeout""\nnight",12.5,\r\n'
    );
    assert.deepEqual(dashboard.downloads, [{
        href: "blob:expense-insights-1",
        filename: "expenses.csv"
    }]);
    assert.equal(element(dashboard, "#data-status").textContent, "Downloaded expenses.csv.");

    await dashboard.importCsv(dashboard.exportedCsv, "expenses.csv");
    assert.equal(element(dashboard, "#transaction-count").textContent, "1");
    assert.equal(element(dashboard, "#total-spending").textContent, "₱12.50");
});

test("transaction list displays descriptions and updates to match filters", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(
        "date,category,amount,description\n" +
        '2026-07-01,"Food, ""takeout""",12.5,"Lunch, with a friend"\n' +
        "2026-08-03,Travel,34,Train\n"
    );

    const rows = element(dashboard, "#transaction-rows").children;
    assert.equal(rows.length, 2);
    assert.equal(rows[0].children[0].textContent, "2026-07-01");
    assert.equal(rows[0].children[1].textContent, 'Food, "takeout"');
    assert.equal(rows[0].children[2].textContent, "Lunch, with a friend");
    assert.equal(rows[0].children[3].textContent, "₱12.50");
    assert.equal(element(dashboard, "#transaction-list-count").textContent, "2 transactions");

    dashboard.exportCsv();
    assert.equal(
        dashboard.exportedCsv,
        "date,category,amount,description\r\n" +
        '2026-07-01,"Food, ""takeout""",12.5,"Lunch, with a friend"\r\n' +
        "2026-08-03,Travel,34,Train\r\n"
    );

    element(dashboard, "#month-filter").value = "2026-07";
    element(dashboard, "#month-filter").listeners.change();

    assert.equal(element(dashboard, "#transaction-rows").children.length, 1);
    assert.equal(element(dashboard, "#transaction-rows").children[0].children[0].textContent, "2026-07-01");
    assert.equal(element(dashboard, "#transaction-list-count").textContent, "1 transaction");

    element(dashboard, "#category-filter").value = "Travel";
    element(dashboard, "#category-filter").listeners.change();

    assert.equal(element(dashboard, "#transaction-rows").children.length, 1);
    assert.equal(
        element(dashboard, "#transaction-rows").children[0].children[0].textContent,
        "No transactions match these filters."
    );
    assert.equal(element(dashboard, "#transaction-list-count").textContent, "0 transactions");
});

test("transaction list provides a clear description placeholder when descriptions are omitted", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv("date,category,amount\n2026-07-01,Food,12.5\n");

    assert.equal(element(dashboard, "#transaction-rows").children[0].children[2].textContent, "—");
});

test("month and category filters update summary cards and charts together", () => {
    const dashboard = createDashboard();
    const monthFilter = element(dashboard, "#month-filter");
    const categoryFilter = element(dashboard, "#category-filter");

    monthFilter.value = "2026-01";
    monthFilter.listeners.change();

    assert.equal(element(dashboard, "#transaction-count").textContent, "4");
    assert.equal(element(dashboard, "#total-spending").textContent, "₱2,285.00");
    assert.equal(element(dashboard, "#average-transaction").textContent, "₱571.25");
    assert.equal(element(dashboard, "#category-chart").children.length, 3);
    assert.equal(element(dashboard, "#monthly-chart").children.length, 1);
    assert.equal(element(dashboard, "#transaction-rows").children.length, 4);
    assert.equal(element(dashboard, "#transaction-list-count").textContent, "4 transactions");
    assert.equal(element(dashboard, "#data-status").textContent, "Showing 4 of 24 transactions.");

    categoryFilter.value = "Food";
    categoryFilter.listeners.change();

    assert.equal(element(dashboard, "#transaction-count").textContent, "2");
    assert.equal(element(dashboard, "#total-spending").textContent, "₱715.00");
    assert.equal(element(dashboard, "#average-transaction").textContent, "₱357.50");
    assert.equal(element(dashboard, "#category-chart").children.length, 1);
    assert.equal(element(dashboard, "#monthly-chart").children.length, 1);
    assert.equal(element(dashboard, "#transaction-rows").children.length, 2);
    assert.equal(element(dashboard, "#data-status").textContent, "Showing 2 of 24 transactions.");
});

test("filters with no matches show empty chart states and leave exports unfiltered", () => {
    const dashboard = createDashboard();

    element(dashboard, "#month-filter").value = "2026-01";
    element(dashboard, "#category-filter").value = "Learning";
    element(dashboard, "#month-filter").listeners.change();
    element(dashboard, "#category-filter").listeners.change();

    assert.equal(element(dashboard, "#transaction-count").textContent, "0");
    assert.equal(element(dashboard, "#total-spending").textContent, "₱0.00");
    assert.equal(element(dashboard, "#average-transaction").textContent, "₱0.00");
    assert.equal(element(dashboard, "#category-chart").children[0].textContent, "No expense categories to show.");
    assert.equal(element(dashboard, "#monthly-chart").children[0].textContent, "No monthly spending to show.");
    assert.equal(element(dashboard, "#transaction-rows").children[0].children[0].textContent, "No transactions match these filters.");

    dashboard.exportCsv();
    assert.equal(dashboard.exportedCsv.trim().split("\r\n").length, 25);
});

test("expense dashboard does not save imported data until the user opts in", async () => {
    const storage = createStorage();
    const dashboard = createDashboard(storage);
    await dashboard.importCsv("date,category,amount\n2026-07-01,Food,12.5\n");

    assert.equal(storage.data.size, 0);
    assert.equal(element(dashboard, "#transaction-count").textContent, "1");

    const rememberCheckbox = element(dashboard, "#remember-data");
    rememberCheckbox.checked = true;
    rememberCheckbox.listeners.change();

    assert.equal(
        storage.getItem("franzearl.expense-insights.saved-data.v1"),
        "date,category,amount,description\r\n2026-07-01,Food,12.5,\r\n"
    );

    const returnedDashboard = createDashboard(storage);
    assert.equal(element(returnedDashboard, "#remember-data").checked, true);
    assert.equal(element(returnedDashboard, "#transaction-count").textContent, "1");
    assert.equal(element(returnedDashboard, "#total-spending").textContent, "₱12.50");
    assert.equal(
        element(returnedDashboard, "#data-status").textContent,
        "Restored 1 saved transaction from this device."
    );
});

test("expense dashboard autosaves when enabled and clears saved data", async () => {
    const storage = createStorage();
    const dashboard = createDashboard(storage);
    const rememberCheckbox = element(dashboard, "#remember-data");
    rememberCheckbox.checked = true;
    rememberCheckbox.listeners.change();

    await dashboard.importCsv("date,category,amount\n2026-07-02,Travel,34\n");

    assert.match(storage.getItem("franzearl.expense-insights.saved-data.v1"), /Travel,34/);
    element(dashboard, "#clear-saved-data").listeners.click();

    assert.equal(storage.getItem("franzearl.expense-insights.saved-data.v1"), null);
    assert.equal(rememberCheckbox.checked, false);
    assert.equal(element(dashboard, "#transaction-count").textContent, "1");
    assert.match(element(dashboard, "#data-status").textContent, /current dashboard remains/);
    assert.equal(element(createDashboard(storage), "#transaction-count").textContent, "24");
});
