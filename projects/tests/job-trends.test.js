const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const dashboardScript = fs.readFileSync(
    path.join(__dirname, "..", "job-trends", "script.js"),
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
        disabled: false,
        hidden: false,
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

function createDashboard() {
    const selectors = [
        "#job-csv-file",
        "#clear-data",
        "#job-data-status",
        "#job-search",
        "#location-filter",
        "#listing-count",
        "#skill-count",
        "#top-skill",
        "#top-skill-share",
        "#location-count",
        "#skill-chart",
        "#category-chart",
        "#timeline-chart",
        "#skill-chart-note",
        "#job-results-count",
        "#job-listing-rows",
        "#show-more-jobs"
    ];
    const elements = new Map(selectors.map((selector) => [selector, createElement()]));
    const context = vm.createContext({
        document: {
            querySelector(selector) {
                assert.ok(elements.has(selector), `Unexpected selector: ${selector}`);
                return elements.get(selector);
            },
            createElement() {
                return createElement();
            }
        },
        URL
    });

    vm.runInContext(dashboardScript, context, { filename: "job-trends/script.js" });
    return {
        elements,
        async importCsv(text, name = "listings.csv", size = text.length) {
            await elements.get("#job-csv-file").listeners.change({
                target: {
                    files: [{ name, size, text: async () => text }]
                }
            });
        },
        search(query) {
            const input = elements.get("#job-search");
            input.value = query;
            input.listeners.input();
        },
        filterLocation(location) {
            const select = elements.get("#location-filter");
            select.value = location;
            select.listeners.change();
        }
    };
}

function element(dashboard, selector) {
    return dashboard.elements.get(selector);
}

const listingsCsv = [
    "job_title,company,location,job_description,posted_date,work_arrangement,job_url",
    'Data Analyst,North Star,Manila,"Build reports with SQL, Python, Excel, and Power BI. Machine learning is a plus.",2025-01-02,Hybrid,https://example.com/jobs/1',
    'Business Intelligence Analyst,Blue Bay,Cebu,"Create Tableau dashboards with SQL and PowerBI.",1/15/2025,Remote,https://example.com/jobs/2',
    'Data Scientist,Green Field,Manila,"Build ML models in Python.\nUse R programming for statistical analysis.",,On-site,javascript:alert(1)'
].join("\r\n");

test("imports current listing CSV, normalizes skills, and computes listing shares", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(listingsCsv);

    assert.equal(element(dashboard, "#listing-count").textContent, "3");
    assert.equal(element(dashboard, "#top-skill").textContent, "Machine Learning");
    assert.equal(element(dashboard, "#top-skill-share").textContent, "2 of 3 listings (67%)");
    assert.equal(element(dashboard, "#location-count").textContent, "2");
    assert.equal(element(dashboard, "#job-data-status").dataset.error, "false");
    assert.match(element(dashboard, "#job-data-status").textContent, /3 listings analyzed/);
    assert.equal(element(dashboard, "#job-listing-rows").children.length, 3);
    assert.equal(element(dashboard, "#timeline-chart").children.length, 1);
    assert.equal(element(dashboard, "#timeline-chart").children[0].children[2].textContent, "2025-01");
});

test("filters listings and recomputes counts from the selected location", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(listingsCsv);

    dashboard.filterLocation("Cebu");

    assert.equal(element(dashboard, "#listing-count").textContent, "1");
    assert.equal(element(dashboard, "#top-skill").textContent, "Power BI");
    assert.equal(element(dashboard, "#top-skill-share").textContent, "1 of 1 listings (100%)");
    assert.equal(element(dashboard, "#job-listing-rows").children.length, 1);

    dashboard.search("Tableau");
    assert.equal(element(dashboard, "#listing-count").textContent, "1");
    dashboard.search("no such skill");
    assert.equal(element(dashboard, "#listing-count").textContent, "0");
    assert.equal(element(dashboard, "#job-results-count").textContent, "No matching listings");
});

test("accepts canonical column names, escaped quotes, and embedded newlines", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(
        "title,description,company,location\n" +
        '"Data ""Platform"" Engineer","Build ETL pipelines with Apache Spark.\nUse BigQuery.",Example,Cebu'
    );

    assert.equal(element(dashboard, "#listing-count").textContent, "1");
    assert.equal(element(dashboard, "#skill-count").textContent, "3");
    assert.equal(element(dashboard, "#job-listing-rows").children[0].children[0].children[0].textContent, 'Data "Platform" Engineer');
    assert.equal(element(dashboard, "#timeline-chart").children[0].textContent, "Add a date or posted_date column to see posting activity.");
});

test("imports Techmap CSV dates, work types, and source URLs from JSON-LD", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(
        "title,description,company,city,dateCreated,workType,jsonLD\n" +
        'Analyst,Analyze data with SQL,Example,Manila,2026-10-30T01:17:41.210125Z,"[""FlexTime""]","{""url"":""https://example.com/jobs/1""}"'
    );

    const row = element(dashboard, "#job-listing-rows").children[0];
    assert.equal(element(dashboard, "#listing-count").textContent, "1");
    assert.equal(row.children[1].textContent, "Manila");
    assert.equal(row.children[2].textContent, "FlexTime");
    assert.equal(row.children[3].textContent, "2026-10-30");
    assert.equal(row.children[5].children[0].href, "https://example.com/jobs/1");
    assert.equal(element(dashboard, "#timeline-chart").children[0].children[2].textContent, "2026-10");
});

test("rejects malformed or oversized CSV without replacing the current results", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(listingsCsv);
    const originalCount = element(dashboard, "#listing-count").textContent;

    await dashboard.importCsv("name,description\nAnalyst,SQL");
    assert.equal(element(dashboard, "#job-data-status").dataset.error, "true");
    assert.match(element(dashboard, "#job-data-status").textContent, /Required CSV columns/);
    assert.equal(element(dashboard, "#listing-count").textContent, originalCount);

    await dashboard.importCsv(listingsCsv, "large.csv", 5 * 1024 * 1024 + 1);
    assert.match(element(dashboard, "#job-data-status").textContent, /larger than 5 MB/);
    assert.equal(element(dashboard, "#listing-count").textContent, originalCount);
});

test("does not turn imported titles into markup and ignores non-web source links", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(
        "title,description,source_url\n" +
        '"<img src=x onerror=alert(1)>","Python SQL",javascript:alert(1)'
    );

    const row = element(dashboard, "#job-listing-rows").children[0];
    assert.equal(row.children[0].children[0].textContent, "<img src=x onerror=alert(1)>");
    assert.equal(row.children[5].textContent, "—");
});

test("skips rows without required text and clears imported data on request", async () => {
    const dashboard = createDashboard();
    await dashboard.importCsv(
        "title,description\n" +
        "Data Analyst,Python SQL\n" +
        ",Missing title\n" +
        "Missing description,"
    );

    assert.equal(element(dashboard, "#listing-count").textContent, "1");
    assert.match(element(dashboard, "#job-data-status").textContent, /2 rows were skipped/);
    element(dashboard, "#clear-data").listeners.click();
    assert.equal(element(dashboard, "#listing-count").textContent, "0");
    assert.equal(element(dashboard, "#clear-data").disabled, true);
    assert.match(element(dashboard, "#job-data-status").textContent, /Data cleared/);
});
