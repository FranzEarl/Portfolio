const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");

const sourceDirectory = path.join(__dirname, "..", "c-programs");
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-c-tests-"));
const executables = new Map();

before(() => {
    for (const name of [
        "number_converter",
        "online_voting_system",
        "expense_tracker",
        "date_calculator",
        "calculator",
        "trigonometry",
        "lights_out",
        "randomizer"
    ]) {
        const executable = path.join(temporaryDirectory, `${name}.exe`);
        const result = spawnSync("gcc", [
            "-std=c11",
            "-Wall",
            "-Wextra",
            "-Wpedantic",
            path.join(sourceDirectory, `${name}.c`),
            "-o",
            executable
        ], { encoding: "utf8" });

        assert.equal(result.status, 0, `${name} compilation failed:\n${result.stderr}`);
        assert.equal(result.stderr, "", `${name} compiled with warnings:\n${result.stderr}`);
        executables.set(name, executable);
    }
});

after(() => {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

function runProgram(name, input, workingDirectory = temporaryDirectory) {
    const result = spawnSync(executables.get(name), [], {
        cwd: workingDirectory,
        encoding: "utf8",
        input,
        timeout: 5000
    });

    assert.equal(result.error, undefined, `${name} could not run: ${result.error}`);
    assert.equal(result.status, 0, `${name} exited unsuccessfully:\n${result.stderr}`);
    return result.stdout;
}

test("number converter handles valid values and rejects invalid or overflowing input", () => {
    const output = runProgram(
        "number_converter",
        "1\n10\n2\n111111111111111111111111111111111\n4\n8\n3\n4294967296\n7\n"
    );

    assert.match(output, /Decimal to Binary: 1010/);
    assert.match(output, /Invalid number for base 2/);
    assert.match(output, /Invalid number for base 8/);
    assert.match(output, /Invalid number for base 10 or value exceeds 32 bits/);
});

test("voting validates counts and choices without recursive retries or overflowing names", () => {
    const longName = "X".repeat(60);
    const output = runProgram(
        "online_voting_system",
        `0\n2\n1\n${longName}\nAlice Example\n1\n1\n2\nBob\n3\n0\n1\n2\n1\n`
    );

    assert.match(output, /Enter a whole number from 1 to 10/);
    assert.match(output, /Input is too long/);
    assert.match(output, /That symbol is already taken/);
    assert.match(output, /Voter 1, enter your choice/);
    assert.match(output, /Enter a whole number from 1 to 2/);
    assert.match(output, /Winner: Alice Example/);
});

test("expense tracker validates amounts and calendar dates and persists valid expenses", () => {
    const workingDirectory = path.join(temporaryDirectory, "expense-tracker");
    fs.mkdirSync(workingDirectory);

    const output = runProgram(
        "expense_tracker",
        "1\nCoffee\nFood\n-4\n12.50\n2025-02-29\n1\nCoffee\nFood\n12.50\n2024-02-29\n2\n3\n4\n",
        workingDirectory
    );

    assert.match(output, /Enter a valid non-negative amount/);
    assert.match(output, /Enter a valid date in YYYY-MM-DD format/);
    assert.match(output, /Expense added successfully/);
    assert.match(output, /Total expenses: 1/);
    assert.equal(
        fs.readFileSync(path.join(workingDirectory, "expenses.txt"), "utf8")
            .replace(/\r\n/g, "\n"),
        "Coffee|Food|12.50|2024-02-29\n"
    );

    const reloadOutput = runProgram("expense_tracker", "2\n4\n", workingDirectory);
    assert.match(reloadOutput, /Loaded 1 expenses/);
    assert.match(reloadOutput, /Coffee/);
});

test("date calculator compiles cleanly and computes date differences", () => {
    const output = runProgram(
        "date_calculator",
        "1\n01-01-2024\n02-01-2024\n6\n"
    );

    assert.match(output, /Days between: 1/);
    assert.match(output, /Absolute difference: 1 days/);
});

test("calculator rejects invalid numbers and zero divisors", () => {
    const output = runProgram("calculator", "3\n4\n+\n");
    assert.match(output, /Result: 7\.00/);

    const zeroDivision = spawnSync(executables.get("calculator"), [], {
        encoding: "utf8",
        input: "3\n0\n/\n",
        timeout: 5000
    });
    assert.equal(zeroDivision.status, 1);
    assert.match(zeroDivision.stderr, /Cannot divide by zero/);
});

test("trigonometry validates input and reports undefined reciprocals", () => {
    const output = runProgram("trigonometry", "0\n");
    assert.match(output, /cosecant: undefined/);
    assert.match(output, /secant: 1\.00/);
    assert.match(output, /cotangent: undefined/);

    const invalid = spawnSync(executables.get("trigonometry"), [], {
        encoding: "utf8",
        input: "not-an-angle\n",
        timeout: 5000
    });
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /Invalid angle/);
});

test("Lights Out rejects malformed boards and accepts nine binary cells", () => {
    const valid = runProgram("lights_out", "0 0 0 0 0 0 0 0 0\n");
    assert.match(valid, /Press these buttons/);

    const invalid = spawnSync(executables.get("lights_out"), [], {
        encoding: "utf8",
        input: "0 0 0 0 0 0 0 0 2\n",
        timeout: 5000
    });
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /either 0 or 1/);
});

test("randomizer rejects zero and malformed item counts before allocating", () => {
    for (const input of ["0\n", "not-a-number\n"]) {
        const result = spawnSync(executables.get("randomizer"), [], {
            encoding: "utf8",
            input,
            timeout: 5000
        });
        assert.equal(result.status, 1);
        assert.match(result.stderr, /whole number from 1 to/);
    }
});
