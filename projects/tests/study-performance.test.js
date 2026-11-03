const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const dashboardScript = fs.readFileSync(
    path.join(__dirname, "..", "study-performance", "script.js"),
    "utf8"
);
const sampleCsv = fs.readFileSync(
    path.join(__dirname, "..", "study-performance", "sample-study-performance.csv"),
    "utf8"
);

function createElement() {
    return {
        attributes: {},
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
            this.attributes[name] = value;
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
        "#export-button",
        "#sample-button",
        "#remember-data",
        "#clear-saved-data",
        "#data-status",
        "#data-badge",
        "#average-grade",
        "#study-hours",
        "#attendance-rate",
        "#courses-on-track",
        "#course-chart",
        "#study-hours-chart",
        "#course-rows",
        "#course-count"
    ];
    const elements = new Map(selectors.map((selector) => [selector, createElement()]));
    const downloads = [];
    let exportedBlob;
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
            }
        },
        URL: {
            createObjectURL(blob) {
                exportedBlob = blob;
                return "blob:study-performance";
            },
            revokeObjectURL() {}
        },
        setTimeout(callback) {
            callback();
        },
        localStorage: storage
    });

    vm.runInContext(dashboardScript, context, { filename: "study-performance/script.js" });
    return {
        elements,
        storage,
        downloads,
        get exportedCsv() {
            return exportedBlob.text;
        },
        exportCsv() {
            elements.get("#export-button").listeners.click();
        },
        async importCsv(text, name = "courses.csv") {
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

test("study dashboard starts with the built-in sample courses", () => {
    const dashboard = createDashboard();

    assert.equal(element(dashboard, "#course-rows").children.length, 6);
    assert.equal(element(dashboard, "#course-count").textContent, "6 courses");
    assert.equal(element(dashboard, "#average-grade").textContent, "87%");
    assert.equal(element(dashboard, "#study-hours").textContent, "66 hrs");
    assert.equal(element(dashboard, "#attendance-rate").textContent, "93.7%");
    assert.equal(element(dashboard, "#data-badge").textContent, "FICTIONAL SAMPLE DATA");
});

test("study dashboard remembers data only after opting in and restores it on return", async () => {
    const storage = createStorage();
    const dashboard = createDashboard(storage);
    await dashboard.importCsv("course,grade,attendance,study_hours\nMath,90,95,6\n");

    const rememberCheckbox = element(dashboard, "#remember-data");
    assert.equal(rememberCheckbox.checked, false);
    assert.equal(storage.data.size, 0);

    rememberCheckbox.checked = true;
    rememberCheckbox.listeners.change();

    assert.match(storage.getItem("franzearl.study-performance.saved-data.v1"), /Math,90,95,6/);
    assert.equal(element(dashboard, "#data-status").textContent, "Current data remembered on this device.");

    const returnedDashboard = createDashboard(storage);
    assert.equal(element(returnedDashboard, "#remember-data").checked, true);
    assert.equal(element(returnedDashboard, "#course-count").textContent, "1 course");
    assert.equal(element(returnedDashboard, "#course-rows").children[0].children[0].textContent, "Math");
    assert.equal(element(returnedDashboard, "#data-status").textContent, "Restored 1 saved course from this device.");
});

test("study dashboard autosaves imported data when enabled and clears saved data", async () => {
    const storage = createStorage();
    const dashboard = createDashboard(storage);
    const rememberCheckbox = element(dashboard, "#remember-data");
    rememberCheckbox.checked = true;
    rememberCheckbox.listeners.change();

    await dashboard.importCsv("course,grade,attendance,study_hours\nPhysics,88,92,9\n");

    assert.match(storage.getItem("franzearl.study-performance.saved-data.v1"), /Physics,88,92,9/);
    element(dashboard, "#clear-saved-data").listeners.click();

    assert.equal(storage.getItem("franzearl.study-performance.saved-data.v1"), null);
    assert.equal(rememberCheckbox.checked, false);
    assert.equal(element(dashboard, "#course-count").textContent, "1 course");
    assert.match(element(dashboard, "#data-status").textContent, /current dashboard remains/);
    assert.equal(element(createDashboard(storage), "#course-count").textContent, "6 courses");
});

test("downloadable sample CSV imports successfully", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(sampleCsv, "sample-study-performance.csv");

    assert.equal(element(dashboard, "#data-status").textContent, "Loaded 6 courses from sample-study-performance.csv.");
    assert.equal(element(dashboard, "#course-rows").children.length, 6);
    assert.equal(element(dashboard, "#study-hours").textContent, "66 hrs");
    assert.equal(element(dashboard, "#data-badge").textContent, "LOCAL CSV DATA");
});

test("Export CSV downloads the currently displayed sample courses", () => {
    const dashboard = createDashboard();

    dashboard.exportCsv();

    assert.equal(
        dashboard.exportedCsv,
        "course,grade,attendance,study_hours\r\n" +
        "Data Structures,91,96,10\r\n" +
        "Statistics,87,93,12\r\n" +
        "Database Systems,84,92,11\r\n" +
        "Web Development,89,97,13\r\n" +
        "Calculus,78,86,14\r\n" +
        "Communication,93,98,6\r\n"
    );
    assert.deepEqual(dashboard.downloads, [{
        href: "blob:study-performance",
        filename: "study-performance.csv"
    }]);
    assert.equal(element(dashboard, "#data-status").textContent, "Downloaded study-performance.csv.");
});

test("Export CSV preserves imported course names and quotes CSV special characters", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(
        "course,grade,attendance,study_hours\n" +
        '"Research ""Methods"", Part 2\nII",90.5,95,6.25\n'
    );

    dashboard.exportCsv();

    assert.equal(
        dashboard.exportedCsv,
        "course,grade,attendance,study_hours\r\n" +
        '"Research ""Methods"", Part 2\nII",90.5,95,6.25\r\n'
    );
    assert.equal(element(dashboard, "#data-status").textContent, "Downloaded study-performance.csv.");

    await dashboard.importCsv(dashboard.exportedCsv, "study-performance.csv");

    assert.equal(element(dashboard, "#course-count").textContent, "1 course");
    assert.equal(
        element(dashboard, "#course-rows").children[0].children[0].textContent,
        'Research "Methods", Part 2\nII'
    );
});

test("CSV import supports reordered columns, quoted names and any number of rows", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(
        "\uFEFFstudy_hours,course,attendance,grade\r\n" +
        '8.5,"Algorithms, Advanced",91,88\r\n' +
        "4,Databases,100,72\r\n" +
        "0,Design,80,100\r\n",
        "my-courses.csv"
    );

    assert.equal(element(dashboard, "#data-status").textContent, "Loaded 3 courses from my-courses.csv.");
    assert.equal(element(dashboard, "#data-badge").textContent, "LOCAL CSV DATA");
    assert.equal(element(dashboard, "#course-count").textContent, "3 courses");
    assert.equal(element(dashboard, "#course-rows").children.length, 3);
    assert.equal(element(dashboard, "#course-chart").children.length, 3);
    assert.equal(element(dashboard, "#study-hours-chart").children.length, 3);
    assert.equal(element(dashboard, "#average-grade").textContent, "86.7%");
    assert.equal(element(dashboard, "#study-hours").textContent, "12.5 hrs");
    assert.equal(element(dashboard, "#attendance-rate").textContent, "90.3%");
    assert.equal(element(dashboard, "#courses-on-track").textContent, "2 / 3");
    assert.equal(element(dashboard, "#course-rows").children[0].children[0].textContent, "Algorithms, Advanced");
});

test("CSV import supports escaped quotes and newline characters in course names", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(
        "course,grade,attendance,study_hours\n" +
        '"Research ""Methods""\nII",90,95,6\n'
    );

    assert.equal(element(dashboard, "#course-count").textContent, "1 course");
    assert.equal(
        element(dashboard, "#course-rows").children[0].children[0].textContent,
        'Research "Methods"\nII'
    );
    assert.equal(element(dashboard, "#study-hours").textContent, "6 hrs");
});

test("invalid CSV reports errors without replacing the current dashboard", async (t) => {
    const invalidCsvs = [
        {
            name: "missing required header",
            csv: "course,grade,attendance\nMath,90,95\n",
            message: /Required CSV columns: course, grade, attendance, study_hours/
        },
        {
            name: "out-of-range percentage",
            csv: "course,grade,attendance,study_hours\nMath,101,95,6\n",
            message: /Row 2: grade must be between 0 and 100/
        },
        {
            name: "negative hours",
            csv: "course,grade,attendance,study_hours\nMath,90,95,-1\n",
            message: /Row 2: study_hours must be a non-negative number/
        },
        {
            name: "empty course name",
            csv: "course,grade,attendance,study_hours\n,90,95,6\n",
            message: /Row 2: course cannot be empty/
        },
        {
            name: "malformed column count",
            csv: "course,grade,attendance,study_hours\nMath,90,95\n",
            message: /Row 2: expected 4 columns/
        },
        {
            name: "unfinished quoted value",
            csv: 'course,grade,attendance,study_hours\n"Math,90,95,6\n',
            message: /unfinished quoted value/
        }
    ];

    for (const invalid of invalidCsvs) {
        await t.test(invalid.name, async () => {
            const dashboard = createDashboard();
            const originalRows = element(dashboard, "#course-rows").children;
            const originalAverage = element(dashboard, "#average-grade").textContent;

            await dashboard.importCsv(invalid.csv, "invalid.csv");

            assert.match(element(dashboard, "#data-status").textContent, invalid.message);
            assert.equal(element(dashboard, "#data-status").dataset.error, "true");
            assert.equal(element(dashboard, "#course-rows").children, originalRows);
            assert.equal(element(dashboard, "#average-grade").textContent, originalAverage);
            assert.equal(element(dashboard, "#data-badge").textContent, "FICTIONAL SAMPLE DATA");
        });
    }
});

test("Use sample data restores the demo courses after a successful import", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv("course,grade,attendance,study_hours\nMath,90,95,6\n");

    element(dashboard, "#sample-button").listeners.click();

    assert.equal(element(dashboard, "#course-rows").children.length, 6);
    assert.equal(element(dashboard, "#course-count").textContent, "6 courses");
    assert.equal(element(dashboard, "#data-badge").textContent, "FICTIONAL SAMPLE DATA");
    assert.equal(element(dashboard, "#data-status").textContent, "Showing fictional sample data.");
});
