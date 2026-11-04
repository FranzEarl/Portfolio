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
