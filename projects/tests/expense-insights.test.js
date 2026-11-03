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
        "#data-status",
        "#total-spending",
        "#transaction-count",
        "#average-transaction",
        "#category-chart",
        "#monthly-chart"
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
        "date,category,amount\r\n" +
        '2026-07-01,"Food, ""takeout""\nnight",12.5\r\n'
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
        "date,category,amount\r\n2026-07-01,Food,12.5\r\n"
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
