const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const script = fs.readFileSync(
    path.join(__dirname, "..", "ph-labor-market", "script.js"),
    "utf8"
);
const context = vm.createContext({});
vm.runInContext(script, context, { filename: "ph-labor-market/script.js" });

test("parses World Bank observations, drops missing values, and sorts years", () => {
    const result = vm.runInContext(`parseIndicatorPayload([
        { lastupdated: "2026-10-08" },
        [
            { date: "2025", value: 2.4 },
            { date: "2023", value: null },
            { date: "2024", value: "2.2" }
        ]
    ], { id: "SL.UEM.TOTL.ZS", label: "Unemployment", group: "unemployment" })`, context);

    assert.deepEqual(JSON.parse(JSON.stringify(result.observations)), [
        { year: 2024, value: 2.2 },
        { year: 2025, value: 2.4 }
    ]);
    assert.equal(result.lastUpdated, "2026-10-08");
});

test("rejects malformed or empty World Bank responses", () => {
    assert.throws(
        () => vm.runInContext(
            'parseIndicatorPayload({ message: "Invalid format" }, { label: "Unemployment" })',
            context
        ),
        /invalid response/
    );
    assert.throws(
        () => vm.runInContext(
            'parseIndicatorPayload([{ lastupdated: "2026-10-08" }, []], { label: "Unemployment" })',
            context
        ),
        /No observations/
    );
});

test("splits chart lines at missing observation years", () => {
    const segments = vm.runInContext(`splitObservationGaps([
        { year: 2020, value: 1 },
        { year: 2021, value: 2 },
        { year: 2023, value: 4 },
        { year: 2025, value: 6 },
        { year: 2026, value: 7 }
    ])`, context);

    assert.deepEqual(JSON.parse(JSON.stringify(segments)), [
        [{ year: 2020, value: 1 }, { year: 2021, value: 2 }],
        [{ year: 2023, value: 4 }],
        [{ year: 2025, value: 6 }, { year: 2026, value: 7 }]
    ]);
});

test("builds case-study comparisons from overlapping years and the post-2020 youth series", () => {
    const result = vm.runInContext(`buildCaseStudyInsights([
        { id: "SL.AGR.EMPL.ZS", observations: [{ year: 2000, value: 35 }, { year: 2025, value: 20 }] },
        { id: "SL.IND.EMPL.ZS", observations: [{ year: 2000, value: 17 }, { year: 2025, value: 20 }] },
        { id: "SL.SRV.EMPL.ZS", observations: [{ year: 2000, value: 48 }, { year: 2025, value: 60 }] },
        { id: "SL.UEM.1524.ZS", observations: [
            { year: 2019, value: 6.5 },
            { year: 2020, value: 7 },
            { year: 2021, value: 8.4 },
            { year: 2025, value: 7.1 }
        ] }
    ])`, context);

    assert.deepEqual(JSON.parse(JSON.stringify(result.sector.change)), {
        agriculture: -15,
        industry: 3,
        services: 12
    });
    assert.equal(result.sector.startYear, 2000);
    assert.equal(result.sector.endYear, 2025);
    assert.equal(result.youth.peak.year, 2021);
    assert.equal(result.youth.latest.year, 2025);
    assert.ok(Math.abs(result.youth.changeFromStart - 0.1) < 1e-10);
    assert.ok(Math.abs(result.youth.changeFromPeak + 1.3) < 1e-10);
});

test("exports annual indicator series as a year-aligned CSV", () => {
    const csv = vm.runInContext(`buildAnalysisCsv([
        { id: "SL.UEM.TOTL.ZS", observations: [{ year: 2024, value: 2.2 }, { year: 2025, value: 2.3 }] },
        { id: "SL.UEM.1524.ZS", observations: [{ year: 2025, value: 7.1 }] },
        { id: "SL.TLF.CACT.ZS", observations: [{ year: 2024, value: 61.4 }] },
        { id: "SL.EMP.TOTL.SP.ZS", observations: [{ year: 2025, value: 60 }] },
        { id: "SL.AGR.EMPL.ZS", observations: [{ year: 2024, value: 21 }] },
        { id: "SL.IND.EMPL.ZS", observations: [{ year: 2025, value: 20 }] },
        { id: "SL.SRV.EMPL.ZS", observations: [{ year: 2024, value: 59 }] }
    ])`, context);

    const rows = csv.split("\r\n");
    assert.equal(rows[0], "year,unemployment_rate,youth_unemployment_rate,labor_force_participation,employment_to_population,agriculture_employment,industry_employment,services_employment");
    assert.equal(rows[1], "2024,2.2,,61.4,,21,,59");
    assert.equal(rows[2], "2025,2.3,7.1,,60,,20,");
});
