const sampleCourses = [
    { name: "Data Structures", grade: 91, attendance: 96, studyHours: 10 },
    { name: "Statistics", grade: 87, attendance: 93, studyHours: 12 },
    { name: "Database Systems", grade: 84, attendance: 92, studyHours: 11 },
    { name: "Web Development", grade: 89, attendance: 97, studyHours: 13 },
    { name: "Calculus", grade: 78, attendance: 86, studyHours: 14 },
    { name: "Communication", grade: 93, attendance: 98, studyHours: 6 }
];

const elements = {
    file: document.querySelector("#csv-file"),
    exportButton: document.querySelector("#export-button"),
    sampleButton: document.querySelector("#sample-button"),
    status: document.querySelector("#data-status"),
    badge: document.querySelector("#data-badge"),
    averageGrade: document.querySelector("#average-grade"),
    studyHours: document.querySelector("#study-hours"),
    attendanceRate: document.querySelector("#attendance-rate"),
    coursesOnTrack: document.querySelector("#courses-on-track"),
    courseChart: document.querySelector("#course-chart"),
    studyHoursChart: document.querySelector("#study-hours-chart"),
    courseRows: document.querySelector("#course-rows"),
    courseCount: document.querySelector("#course-count")
};

let currentCourses = sampleCourses;

function formatNumber(value, maximumFractionDigits = 0) {
    return new Intl.NumberFormat("en", { maximumFractionDigits }).format(value);
}

function escapeCsvField(value) {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function serializeCourses(courses) {
    const rows = [
        ["course", "grade", "attendance", "study_hours"],
        ...courses.map((course) => [
            course.name,
            course.grade,
            course.attendance,
            course.studyHours
        ])
    ];
    return `${rows.map((row) => row.map(escapeCsvField).join(",")).join("\r\n")}\r\n`;
}

function parseCsv(text) {
    const records = [];
    let record = [];
    let field = "";
    let inQuotes = false;
    let quoteClosed = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];

        if (inQuotes) {
            if (character === '"' && text[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (character === '"') {
                inQuotes = false;
                quoteClosed = true;
            } else {
                field += character;
            }
            continue;
        }

        if (quoteClosed && character !== "," && character !== "\r" &&
            character !== "\n" && character !== " " && character !== "\t") {
            throw new Error("The CSV has unexpected characters after a quoted value.");
        }

        if (character === '"' && field.trim() === "" && !quoteClosed) {
            field = "";
            inQuotes = true;
        } else if (character === ",") {
            record.push(field);
            field = "";
            quoteClosed = false;
        } else if (character === "\r" || character === "\n") {
            record.push(field);
            if (record.some((value) => value.trim() !== "")) {
                records.push(record);
            }
            record = [];
            field = "";
            quoteClosed = false;
            if (character === "\r" && text[index + 1] === "\n") {
                index += 1;
            }
        } else if (!quoteClosed) {
            if (character === '"') {
                throw new Error("The CSV contains a quote in an unquoted value.");
            }
            field += character;
        }
    }

    if (inQuotes) {
        throw new Error("The CSV has an unfinished quoted value.");
    }
    if (field.length > 0 || record.length > 0) {
        record.push(field);
        if (record.some((value) => value.trim() !== "")) {
            records.push(record);
        }
    }

    return records;
}

function parseCourses(text) {
    const records = parseCsv(text);
    if (records.length < 2) {
        throw new Error("The CSV needs a header row and at least one course.");
    }

    const headers = records[0].map((header) =>
        header.trim().replace(/^\uFEFF/, "").toLowerCase()
    );
    const columns = {
        course: headers.indexOf("course"),
        grade: headers.indexOf("grade"),
        attendance: headers.indexOf("attendance"),
        studyHours: headers.indexOf("study_hours")
    };

    if (Object.values(columns).some((column) => column === -1) ||
        new Set(Object.values(columns)).size !== Object.keys(columns).length) {
        throw new Error("Required CSV columns: course, grade, attendance, study_hours.");
    }

    return records.slice(1).map((row, index) => {
        if (row.length !== headers.length) {
            throw new Error(`Row ${index + 2}: expected ${headers.length} columns.`);
        }

        const name = row[columns.course].trim();
        const grade = parseMetric(row[columns.grade], "grade", index + 2, 100);
        const attendance = parseMetric(row[columns.attendance], "attendance", index + 2, 100);
        const studyHours = parseMetric(row[columns.studyHours], "study_hours", index + 2);

        if (!name) {
            throw new Error(`Row ${index + 2}: course cannot be empty.`);
        }

        return { name, grade, attendance, studyHours };
    });
}

function parseMetric(value, label, rowNumber, maximum = Infinity) {
    const text = value.trim();
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) {
        throw new Error(`Row ${rowNumber}: ${label} must be a non-negative number.`);
    }

    const number = Number(text);
    if (!Number.isFinite(number) || number > maximum) {
        const limit = Number.isFinite(maximum) ? ` between 0 and ${maximum}` : " within the numeric range";
        throw new Error(`Row ${rowNumber}: ${label} must be${limit}.`);
    }
    return number;
}

function renderSummary(courses) {
    const averageGrade = courses.reduce((total, course) => total + course.grade, 0) / courses.length;
    const attendanceRate = courses.reduce((total, course) => total + course.attendance, 0) / courses.length;
    const studyHours = courses.reduce((total, course) => total + course.studyHours, 0);
    const coursesOnTrack = courses.filter((course) => course.grade >= 80).length;

    elements.averageGrade.textContent = `${formatNumber(averageGrade, 1)}%`;
    elements.studyHours.textContent = `${formatNumber(studyHours, 1)} hrs`;
    elements.attendanceRate.textContent = `${formatNumber(attendanceRate, 1)}%`;
    elements.coursesOnTrack.textContent = `${coursesOnTrack} / ${courses.length}`;
}

function renderBarChart(container, courses, valueFor, formatValue, ariaLabel) {
    const maximum = courses.reduce((currentMaximum, course) =>
        Math.max(currentMaximum, valueFor(course)), 0
    );
    const rows = courses.map((course) => {
        const value = valueFor(course);
        const row = document.createElement("div");
        row.className = "course-chart-row";

        const labels = document.createElement("div");
        labels.className = "course-chart-labels";

        const name = document.createElement("span");
        name.textContent = course.name;

        const formattedValue = document.createElement("span");
        formattedValue.textContent = formatValue(value);

        const track = document.createElement("div");
        track.className = "progress-track";
        track.setAttribute("role", "progressbar");
        track.setAttribute("aria-label", `${course.name} ${ariaLabel}`);
        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", ariaLabel === "grade" ? "100" : String(maximum));
        track.setAttribute("aria-valuenow", String(value));

        const bar = document.createElement("div");
        bar.className = "progress-bar";
        bar.style.width = maximum > 0 ? `${(value / maximum) * 100}%` : "0%";

        labels.append(name, formattedValue);
        track.append(bar);
        row.append(labels, track);
        return row;
    });

    container.replaceChildren(...rows);
}

function renderCourseTable(courses) {
    const rows = courses.map((course) => {
        const row = document.createElement("tr");
        const values = [
            course.name,
            `${formatNumber(course.grade, 1)}%`,
            `${formatNumber(course.attendance, 1)}%`,
            `${formatNumber(course.studyHours, 1)} hrs`
        ];

        values.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        });

        const statusCell = document.createElement("td");
        const status = document.createElement("span");
        const onTrack = course.grade >= 80;
        status.className = onTrack ? "course-status" : "course-status needs-focus";
        status.textContent = onTrack ? "On track" : "Needs focus";
        statusCell.append(status);
        row.append(statusCell);
        return row;
    });

    elements.courseRows.replaceChildren(...rows);
    elements.courseCount.textContent = `${courses.length} ${courses.length === 1 ? "course" : "courses"}`;
}

function renderDashboard(courses) {
    currentCourses = courses;
    renderSummary(courses);
    renderBarChart(
        elements.courseChart,
        courses,
        (course) => course.grade,
        (grade) => `${formatNumber(grade, 1)}%`,
        "grade"
    );
    renderBarChart(
        elements.studyHoursChart,
        courses,
        (course) => course.studyHours,
        (hours) => `${formatNumber(hours, 1)} hrs`,
        "study hours"
    );
    renderCourseTable(courses);
}

function setStatus(message, isError = false) {
    elements.status.textContent = message;
    elements.status.dataset.error = String(isError);
}

function showSampleData() {
    renderDashboard(sampleCourses);
    elements.badge.textContent = "FICTIONAL SAMPLE DATA";
    setStatus("Showing fictional sample data.");
}

elements.exportButton.addEventListener("click", () => {
    const filename = "study-performance.csv";

    try {
        const blob = new Blob([serializeCourses(currentCourses)], {
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
        const importedCourses = parseCourses(await file.text());
        renderDashboard(importedCourses);
        elements.badge.textContent = "LOCAL CSV DATA";
        setStatus(`Loaded ${importedCourses.length} courses from ${file.name}.`);
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        elements.file.value = "";
    }
});

elements.sampleButton.addEventListener("click", showSampleData);
showSampleData();
