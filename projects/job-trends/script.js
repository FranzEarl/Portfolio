const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_LISTINGS = 10000;
const PAGE_SIZE = 12;

const skillGroups = [
    {
        category: "Programming",
        skills: [
            { name: "Python", terms: ["python"] },
            { name: "SQL", terms: ["sql", "structured query language"] },
            { name: "R", terms: ["r programming", "r language", "rstudio"] },
            { name: "Java", terms: ["java"] },
            { name: "Scala", terms: ["scala"] }
        ]
    },
    {
        category: "Analytics & BI",
        skills: [
            { name: "Excel", terms: ["excel", "microsoft excel"] },
            { name: "Power BI", terms: ["power bi", "powerbi"] },
            { name: "Tableau", terms: ["tableau"] },
            { name: "Looker", terms: ["looker", "looker studio"] },
            { name: "Google Analytics", terms: ["google analytics", "ga4"] },
            { name: "A/B Testing", terms: ["a/b testing", "ab testing", "split testing"] }
        ]
    },
    {
        category: "Data Science",
        skills: [
            { name: "Machine Learning", terms: ["machine learning", "ml"] },
            { name: "Deep Learning", terms: ["deep learning"] },
            { name: "NLP", terms: ["natural language processing", "nlp"] },
            { name: "Statistics", terms: ["statistics", "statistical analysis"] },
            { name: "Data Visualization", terms: ["data visualization", "data visualisation"] },
            { name: "Forecasting", terms: ["forecasting", "time series"] }
        ]
    },
    {
        category: "Data Engineering",
        skills: [
            { name: "ETL", terms: ["etl", "extract transform load"] },
            { name: "Apache Spark", terms: ["apache spark", "pyspark", "spark"] },
            { name: "dbt", terms: ["dbt", "data build tool"] },
            { name: "Apache Airflow", terms: ["apache airflow", "airflow"] },
            { name: "Data Engineering", terms: ["data engineering", "data pipeline", "data pipelines"] },
            { name: "BigQuery", terms: ["bigquery", "google bigquery"] }
        ]
    },
    {
        category: "Cloud & Databases",
        skills: [
            { name: "AWS", terms: ["aws", "amazon web services"] },
            { name: "Azure", terms: ["azure", "microsoft azure"] },
            { name: "Google Cloud", terms: ["google cloud", "gcp"] },
            { name: "Snowflake", terms: ["snowflake"] },
            { name: "PostgreSQL", terms: ["postgresql", "postgres"] },
            { name: "MongoDB", terms: ["mongodb", "mongo database"] }
        ]
    }
];

const allSkills = skillGroups.flatMap((group) =>
    group.skills.map((skill) => ({ ...skill, category: group.category }))
);

const elements = {
    file: document.querySelector("#job-csv-file"),\n    sample: document.getElementById?.("load-sample"),
    clear: document.querySelector("#clear-data"),
    status: document.querySelector("#job-data-status"),
    search: document.querySelector("#job-search"),
    location: document.querySelector("#location-filter"),
    listingCount: document.querySelector("#listing-count"),
    skillCount: document.querySelector("#skill-count"),
    topSkill: document.querySelector("#top-skill"),
    topSkillShare: document.querySelector("#top-skill-share"),
    locationCount: document.querySelector("#location-count"),
    skillChart: document.querySelector("#skill-chart"),
    categoryChart: document.querySelector("#category-chart"),
    timelineChart: document.querySelector("#timeline-chart"),
    skillChartNote: document.querySelector("#skill-chart-note"),
    resultCount: document.querySelector("#job-results-count"),
    rows: document.querySelector("#job-listing-rows"),
    showMore: document.querySelector("#show-more-jobs")
};

let jobs = [];
let visibleLimit = PAGE_SIZE;

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9+#]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

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

function findColumn(headers, ...names) {
    return names.map((name) => headers.indexOf(name)).find((index) => index !== -1) ?? -1;
}

function normalizeDate(value) {
    const text = value.trim();
    if (!text) return "";

    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/.exec(text);
    const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
    let year;
    let month;
    let day;
    if (iso) {
        [, year, month, day] = iso;
    } else if (us) {
        [, month, day, year] = us;
    } else {
        return "";
    }

    const parts = [Number(year), Number(month), Number(day)];
    const parsed = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    if (
        parsed.getUTCFullYear() !== parts[0]
        || parsed.getUTCMonth() !== parts[1] - 1
        || parsed.getUTCDate() !== parts[2]
    ) {
        return "";
    }
    return `${String(parts[0]).padStart(4, "0")}-${String(parts[1]).padStart(2, "0")}-${String(parts[2]).padStart(2, "0")}`;
}

function normalizeListValue(value) {
    const text = value.trim();
    if (!text) return "";

    let values = [text];
    if (text.startsWith("[")) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                values = parsed.map(String);
            }
        } catch {
            values = [text];
        }
    }

    return values
        .map((item) => item.trim())
        .filter((item) => item && item.toLowerCase() !== "n/a")
        .join(", ");
}

function normalizeSourceUrl(value, jsonLdValue) {
    let rawUrl = value.trim();
    if (!rawUrl && jsonLdValue) {
        try {
            rawUrl = JSON.parse(jsonLdValue).url || "";
        } catch {
            rawUrl = "";
        }
    }
    if (!rawUrl) return "";

    try {
        const url = new URL(rawUrl);
        return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch {
        return "";
    }
}

function parseJobListings(text) {
    const records = parseCsv(text);
    if (records.length < 2) {
        throw new Error("The CSV needs a header row and at least one listing.");
    }
    if (records.length - 1 > MAX_LISTINGS) {
        throw new Error(`The CSV has more than ${MAX_LISTINGS.toLocaleString()} listings. Split it into smaller files.`);
    }

    const headers = records[0].map((header) =>
        header.trim().replace(/^\uFEFF/, "").toLowerCase().replace(/[\s-]+/g, "_")
    );
    const columns = {
        title: findColumn(headers, "title", "job_title"),
        description: findColumn(headers, "description", "job_description"),
        company: findColumn(headers, "company", "company_name", "employer"),
        location: findColumn(headers, "location", "job_location", "city"),
        date: findColumn(headers, "date", "posted_date", "posting_date", "datecreated", "dateposted"),
        workType: findColumn(headers, "work_type", "worktype", "work_arrangement", "workplace", "workplace_type"),
        sourceUrl: findColumn(headers, "source_url", "url", "job_url", "link"),
        jsonLd: findColumn(headers, "jsonld")
    };
    if (columns.title === -1 || columns.description === -1) {
        throw new Error("Required CSV columns: title and description (or job_title and job_description).");
    }

    const parsed = [];
    let skipped = 0;
    records.slice(1).forEach((row) => {
        const title = (row[columns.title] || "").trim();
        const description = (row[columns.description] || "").trim();
        if (!title || !description) {
            skipped += 1;
            return;
        }
        const rawUrl = columns.sourceUrl === -1 ? "" : row[columns.sourceUrl] || "";
        const jsonLdValue = columns.jsonLd === -1 ? "" : row[columns.jsonLd] || "";
        parsed.push({
            title,
            description,
            company: columns.company === -1 ? "" : (row[columns.company] || "").trim(),
            location: columns.location === -1 ? "" : (row[columns.location] || "").trim(),
            date: columns.date === -1 ? "" : normalizeDate(row[columns.date] || ""),
            workType: columns.workType === -1 ? "" : normalizeListValue(row[columns.workType] || ""),
            sourceUrl: normalizeSourceUrl(rawUrl, jsonLdValue)
        });
    });

    if (parsed.length === 0) {
        throw new Error("No usable listings found. Each row needs a title and description.");
    }
    return { jobs: parsed, skipped };
}

function detectSkills(job) {
    const text = ` ${normalizeText(`${job.title} ${job.description}`)} `;
    return allSkills
        .filter((skill) => skill.terms.some((term) => text.includes(` ${normalizeText(term)} `)))
        .map((skill) => skill.name);
}

function setStatus(message, isError = false) {
    elements.status.textContent = message;
    elements.status.dataset.error = String(isError);
}

function clearChart(container, message) {
    container.replaceChildren();
    const empty = document.createElement("p");
    empty.className = "job-empty-state";
    empty.textContent = message;
    container.append(empty);
}

function renderBars(container, entries, total, valueLabel, emptyMessage) {
    container.replaceChildren();
    if (entries.length === 0) {
        clearChart(container, emptyMessage);
        return;
    }

    const maximum = Math.max(...entries.map((entry) => entry.count));
    entries.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "job-bar-row";
        const labels = document.createElement("div");
        labels.className = "job-bar-labels";
        const label = document.createElement("strong");
        label.textContent = entry.label;
        const value = document.createElement("span");
        value.textContent = valueLabel(entry.count, total);
        labels.append(label, value);

        const track = document.createElement("div");
        track.className = "job-bar-track";
        track.setAttribute("aria-hidden", "true");
        const bar = document.createElement("div");
        bar.className = "job-bar-fill";
        bar.style.width = `${Math.max((entry.count / maximum) * 100, 2)}%`;
        track.append(bar);
        row.append(labels, track);
        container.append(row);
    });
}

function getFilteredJobs() {
    const query = normalizeText(elements.search.value);
    const location = elements.location.value;
    return jobs.filter((job) => {
        if (location && job.location !== location) return false;
        if (!query) return true;
        const searchable = normalizeText(
            `${job.title} ${job.company} ${job.location} ${job.description} ${job.skills.join(" ")}`
        );
        return searchable.includes(query);
    });
}

function renderSkillChart(filteredJobs) {
    const counts = new Map();
    filteredJobs.forEach((job) => {
        job.skills.forEach((skill) => counts.set(skill, (counts.get(skill) || 0) + 1));
    });
    const allEntries = [...counts]
        .map(([label, count]) => ({ label, count }))
        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
    const entries = allEntries.slice(0, 10);
    elements.skillChartNote.textContent = "Share of listings";
    renderBars(
        elements.skillChart,
        entries,
        filteredJobs.length,
        (count, total) => `${count} · ${Math.round((count / total) * 100)}%`,
        "No recognized skills in these listings. Try another location or search."
    );
    return { entries, count: allEntries.length };
}

function renderCategoryChart(filteredJobs) {
    const counts = new Map();
    filteredJobs.forEach((job) => {
        const categories = new Set(
            allSkills
                .filter((skill) => job.skills.includes(skill.name))
                .map((skill) => skill.category)
        );
        categories.forEach((category) => counts.set(category, (counts.get(category) || 0) + 1));
    });
    const entries = skillGroups
        .map(({ category }) => ({ label: category, count: counts.get(category) || 0 }))
        .filter((entry) => entry.count > 0);
    renderBars(
        elements.categoryChart,
        entries,
        filteredJobs.length,
        (count, total) => `${count} · ${Math.round((count / total) * 100)}%`,
        "No skill groups found in these listings."
    );
}

function renderTimeline(filteredJobs) {
    const counts = new Map();
    filteredJobs.forEach((job) => {
        if (job.date) {
            const month = job.date.slice(0, 7);
            counts.set(month, (counts.get(month) || 0) + 1);
        }
    });
    const entries = [...counts].sort(([left], [right]) => left.localeCompare(right));
    elements.timelineChart.replaceChildren();
    if (entries.length === 0) {
        clearChart(elements.timelineChart, "Add a date or posted_date column to see posting activity.");
        return;
    }

    const maximum = Math.max(...entries.map(([, count]) => count));
    entries.slice(-12).forEach(([month, count]) => {
        const bar = document.createElement("div");
        bar.className = "job-timeline-bar";
        const value = document.createElement("span");
        value.textContent = String(count);
        const fill = document.createElement("i");
        fill.style.height = `${Math.max((count / maximum) * 100, 2)}%`;
        fill.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.textContent = month;
        bar.setAttribute("aria-label", `${count} listings in ${month}`);
        bar.append(value, fill, label);
        elements.timelineChart.append(bar);
    });
}

function renderListings(filteredJobs) {
    elements.rows.replaceChildren();
    const shown = filteredJobs.slice(0, visibleLimit);
    elements.resultCount.textContent = filteredJobs.length
        ? `Showing ${shown.length.toLocaleString()} of ${filteredJobs.length.toLocaleString()}`
        : "No matching listings";
    elements.showMore.hidden = shown.length >= filteredJobs.length;

    if (shown.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.className = "job-table-empty";
        cell.colSpan = 6;
        cell.textContent = jobs.length ? "No listings match these filters." : "Import a listings CSV to review its postings.";
        row.append(cell);
        elements.rows.append(row);
        return;
    }

    shown.forEach((job) => {
        const row = document.createElement("tr");
        const roleCell = document.createElement("td");
        const title = document.createElement("span");
        title.className = "job-role-title";
        title.textContent = job.title;
        roleCell.append(title);
        if (job.company) {
            const company = document.createElement("span");
            company.className = "job-role-company";
            company.textContent = job.company;
            roleCell.append(company);
        }

        const location = document.createElement("td");
        location.textContent = job.location || "—";
        const workType = document.createElement("td");
        workType.textContent = job.workType || "—";
        const date = document.createElement("td");
        date.textContent = job.date || "—";
        const skillCell = document.createElement("td");
        const skillTags = document.createElement("div");
        skillTags.className = "job-skill-tags";
        job.skills.slice(0, 5).forEach((skill) => {
            const tag = document.createElement("span");
            tag.textContent = skill;
            skillTags.append(tag);
        });
        if (job.skills.length === 0) {
            const none = document.createElement("span");
            none.textContent = "No match";
            skillTags.append(none);
        }
        skillCell.append(skillTags);

        const source = document.createElement("td");
        if (job.sourceUrl) {
            const link = document.createElement("a");
            link.className = "job-source-link";
            link.href = job.sourceUrl;
            link.target = "_blank";
            link.rel = "noreferrer";
            link.textContent = "Open";
            source.append(link);
        } else {
            source.textContent = "—";
        }
        row.append(roleCell, location, workType, date, skillCell, source);
        elements.rows.append(row);
    });
}

function renderDashboard() {
    const filteredJobs = getFilteredJobs();
    const skillSummary = renderSkillChart(filteredJobs);
    const skills = skillSummary.entries;
    renderCategoryChart(filteredJobs);
    renderTimeline(filteredJobs);
    elements.listingCount.textContent = filteredJobs.length.toLocaleString();
    elements.skillCount.textContent = String(skillSummary.count);
    elements.locationCount.textContent = new Set(
        filteredJobs.map((job) => job.location).filter(Boolean)
    ).size.toLocaleString();

    const topSkill = skills[0];
    if (topSkill) {
        elements.topSkill.textContent = topSkill.label;
        elements.topSkillShare.textContent =
            `${topSkill.count.toLocaleString()} of ${filteredJobs.length.toLocaleString()} listings (${Math.round((topSkill.count / filteredJobs.length) * 100)}%)`;
    } else {
        elements.topSkill.textContent = "—";
        elements.topSkillShare.textContent = filteredJobs.length ? "No recognized skills" : "Import listings to compare";
    }
    renderListings(filteredJobs);
}

function displayParsedListings(result) {
    jobs = result.jobs.map((job) => ({ ...job, skills: detectSkills(job) }));
    visibleLimit = PAGE_SIZE;
    elements.search.value = "";
    elements.location.value = "";
    elements.search.disabled = false;
    elements.location.disabled = false;
    elements.clear.disabled = false;
    populateLocations();
    renderDashboard();
}

function populateLocations() {
    elements.location.replaceChildren();
    const allLocations = document.createElement("option");
    allLocations.value = "";
    allLocations.textContent = "All locations";
    elements.location.append(allLocations);
    [...new Set(jobs.map((job) => job.location).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right))
        .forEach((location) => {
            const option = document.createElement("option");
            option.value = location;
            option.textContent = location;
            elements.location.append(option);
        });
}

function clearData() {
    jobs = [];
    visibleLimit = PAGE_SIZE;
    elements.file.value = "";
    elements.search.value = "";
    elements.location.value = "";
    elements.search.disabled = true;
    elements.location.disabled = true;
    elements.clear.disabled = true;
    populateLocations();
    renderDashboard();
    setStatus("Data cleared from this page. Your CSV was never saved.");
}

elements.file.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
        setStatus("The CSV is larger than 5 MB. Split it into smaller files and try again.", true);
        elements.file.value = "";
        return;
    }

    try {
        const result = parseJobListings(await file.text());
        displayParsedListings(result);
        const skippedNote = result.skipped
            ? ` ${result.skipped} row${result.skipped === 1 ? " was" : "s were"} skipped because title or description was missing.`
            : "";
        setStatus(`${jobs.length.toLocaleString()} listings analyzed from ${file.name}. Data stays in this browser.${skippedNote}`);
    } catch (error) {
        setStatus(error.message, true);
    }
});

if (elements.sample) {
    elements.sample.addEventListener("click", async () => {
        elements.sample.disabled = true;
        setStatus("Loading fictional sample listings…");
        try {
            const response = await fetch("sample-job-postings.csv");
            if (!response.ok) {
                throw new Error("The sample file could not be loaded. You can still import your own CSV.");
            }
            const result = parseJobListings(await response.text());
            displayParsedListings(result);
            setStatus(`Loaded ${jobs.length.toLocaleString()} fictional sample listings. They are illustrative, not current vacancies.`);
        } catch (error) {
            setStatus(error.message, true);
        } finally {
            elements.sample.disabled = false;
        }
    });
}

elements.search.addEventListener("input", () => {
    visibleLimit = PAGE_SIZE;
    renderDashboard();
});

elements.location.addEventListener("change", () => {
    visibleLimit = PAGE_SIZE;
    renderDashboard();
});

elements.clear.addEventListener("click", clearData);
elements.showMore.addEventListener("click", () => {
    visibleLimit += PAGE_SIZE;
    renderDashboard();
});
