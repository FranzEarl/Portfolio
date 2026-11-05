const API_BASE = "https://api.openwebninja.com/jsearch/search-v2";
const CACHE_TTL_SECONDS = 60 * 60;
const HISTORY_RETENTION_DAYS = 90;
const MAX_HISTORY_DAYS = 90;
const ALLOWED_ORIGINS = new Set([
    "https://franzearl.github.io",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]);
const SEARCH_QUERIES = [
    "data analyst jobs in the Philippines",
    "business intelligence analyst jobs in the Philippines",
    "data engineer jobs in the Philippines",
    "data scientist and machine learning engineer jobs in the Philippines",
    "analytics engineer jobs in the Philippines"
];

function jsonResponse(payload, status = 200, headers = {}) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": status >= 200 && status < 300
                ? "public, max-age=" + CACHE_TTL_SECONDS
                : "no-store",
            "X-Content-Type-Options": "nosniff",
            ...headers
        }
    });
}

function withCors(response, origin) {
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", origin || "*");
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Accept");
    headers.set("Access-Control-Max-Age", "86400");
    headers.append("Vary", "Origin");
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

function extractListings(payload) {
    const candidates = [payload?.data, payload?.jobs, payload?.results];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
        if (Array.isArray(candidate?.jobs)) return candidate.jobs;
        if (Array.isArray(candidate?.results)) return candidate.results;
    }
    return [];
}

function inferWorkArrangement(title, description) {
    const text = String(title || "") + " " + String(description || "");
    const normalized = text.toLowerCase();

    if (/\bhybrid\b/.test(normalized)) return "Hybrid";

    const remoteDenied = /\b(?:not|no|never)\s+(?:a\s+)?remote\b|\bremote\s+(?:work\s+)?(?:is\s+)?(?:not available|not offered|not permitted|not an option|unavailable)\b/.test(normalized);
    if (!remoteDenied && /\b(?:remote|wfh|telecommut(?:e|ing)|home[- ]based|work[- ]from[- ]home)\b/.test(normalized)) {
        return "Remote";
    }

    if (/\b(?:on[- ]?site|in[- ]office|office[- ]based|work from (?:the )?office|in person)\b/.test(normalized)) {
        return "On-site";
    }
    return "";
}

function withInferredWorkArrangement(listing) {
    const supplied = String(listing.workType || "").trim();
    if (supplied) return { ...listing, workType: supplied, workTypeInferred: false };

    const inferred = inferWorkArrangement(listing.title, listing.description);
    return { ...listing, workType: inferred, workTypeInferred: Boolean(inferred) };
}

function toListing(record) {
    const title = String(record.job_title || "").trim();
    if (!title) return null;

    const hasTimestamp = record.job_posted_at_timestamp !== null
        && record.job_posted_at_timestamp !== undefined
        && Number.isFinite(Number(record.job_posted_at_timestamp));
    const postedAt = record.job_posted_at_datetime_utc
        || (hasTimestamp ? new Date(Number(record.job_posted_at_timestamp) * 1000).toISOString() : "");
    const salaryValues = [record.job_min_salary, record.job_max_salary]
        .filter((value) => value !== null
            && value !== undefined
            && value !== ""
            && Number.isFinite(Number(value)))
        .map((value) => Number(value).toLocaleString("en-PH"));
    const salary = record.job_salary_string
        || (salaryValues.length
            ? (record.job_salary_currency || "") + " " + salaryValues.join("–")
                + (record.job_salary_period ? " / " + record.job_salary_period.toLowerCase() : "")
            : "");
    const education = record.education_required && typeof record.education_required === "object"
        ? [record.education_required.level, record.education_required.field].filter(Boolean).join(" — ")
        : String(record.education_required || "");
    const location = record.job_location
        || [record.job_city, record.job_state, record.job_country].filter(Boolean).join(", ");
    const requiredSkills = Array.isArray(record.required_technologies)
        ? record.required_technologies.map(String).map((skill) => skill.trim()).filter(Boolean)
        : [];
    const preferredSkills = Array.isArray(record.preferred_technologies)
        ? record.preferred_technologies.map(String).map((skill) => skill.trim()).filter(Boolean)
        : [];
    const technologies = [...requiredSkills, ...preferredSkills];

    return {
        id: String(record.job_id || record.job_uid || [
            title, record.employer_name, location, postedAt
        ].join("|")),
        title,
        description: String(record.job_description || ""),
        company: String(record.employer_name || ""),
        location: String(location || ""),
        date: String(postedAt || "").slice(0, 10),
        workType: String(record.work_arrangement || (record.job_is_remote ? "Remote" : "")),
        employmentType: String(record.job_employment_type || ""),
        salary,
        seniority: String(record.seniority_level || ""),
        experienceYears: String(record.required_experience_years ?? ""),
        education,
        industry: String(record.industry || ""),
        requiredSkills,
        preferredSkills,
        sourceUrl: String(record.job_apply_link || record.job_google_link || ""),
        sourceName: String(record.job_publisher || "View posting"),
        skills: [...new Set(technologies)]
    };
}

async function searchJobs(query, apiKey) {
    const url = new URL(API_BASE);
    url.searchParams.set("query", query);
    url.searchParams.set("country", "ph");
    url.searchParams.set("language", "en");
    url.searchParams.set("date_posted", "month");

    const response = await fetch(url, {
        headers: {
            Accept: "application/json",
            "x-api-key": apiKey
        }
    });
    if (!response.ok) {
        throw new Error("Upstream request returned " + response.status);
    }
    return extractListings(await response.json());
}

async function collectListings(apiKey) {
    const results = await Promise.allSettled(
        SEARCH_QUERIES.map((query) => searchJobs(query, apiKey))
    );
    const allRecords = [];
    const failedQueries = [];
    results.forEach((result, index) => {
        if (result.status === "fulfilled") {
            allRecords.push(...result.value);
        } else {
            failedQueries.push(SEARCH_QUERIES[index]);
        }
    });

    const uniqueListings = new Map();
    allRecords.forEach((record) => {
        const listing = toListing(record);
        if (listing) uniqueListings.set(listing.id, listing);
    });

    return {
        jobs: [...uniqueListings.values()],
        failedQueries,
        successfulQueries: SEARCH_QUERIES.length - failedQueries.length
    };
}

function getSnapshotDate(isoDate) {
    return isoDate.slice(0, 10);
}

function parseJsonArray(value) {
    try {
        const parsed = JSON.parse(value || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function fromDatabase(row) {
    const suppliedWorkType = row.work_type || "";
    const inferredWorkType = suppliedWorkType
        ? ""
        : inferWorkArrangement(row.title, row.description);

    return {
        id: row.job_id,
        title: row.title,
        description: row.description || "",
        company: row.company || "",
        location: row.location || "",
        date: row.posted_date || "",
        workType: suppliedWorkType || inferredWorkType,
        workTypeInferred: Boolean(inferredWorkType),
        employmentType: row.employment_type || "",
        salary: row.salary || "",
        seniority: row.seniority || "",
        experienceYears: row.experience_years || "",
        education: row.education || "",
        industry: row.industry || "",
        requiredSkills: parseJsonArray(row.required_skills),
        preferredSkills: parseJsonArray(row.preferred_skills),
        sourceUrl: row.source_url || "",
        sourceName: row.source_name || "",
        skills: parseJsonArray(row.skills)
    };
}

async function saveSnapshot(database, collected, fetchedAt) {
    const snapshotDate = getSnapshotDate(fetchedAt);
    const snapshotId = snapshotDate + "-" + Date.now().toString(36) + "-" + crypto.randomUUID();
    const warning = collected.failedQueries.length
        ? collected.failedQueries.length + " search group(s) could not be refreshed."
        : "";

    await database.prepare(
        "INSERT INTO snapshot_runs " +
        "(snapshot_id, snapshot_date, fetched_at, query_count, successful_queries, listing_count, warning) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
        snapshotId, snapshotDate, fetchedAt, SEARCH_QUERIES.length,
        collected.successfulQueries, collected.jobs.length, warning
    ).run();

    const insertStatement =
        "INSERT INTO job_observations (" +
        "snapshot_id, job_id, title, description, company, location, posted_date, " +
        "work_type, employment_type, salary, seniority, experience_years, " +
        "education, industry, required_skills, preferred_skills, source_url, source_name, skills" +
        ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
        "ON CONFLICT(snapshot_id, job_id) DO UPDATE SET " +
        "title = excluded.title, description = excluded.description, company = excluded.company, " +
        "location = excluded.location, posted_date = excluded.posted_date, work_type = excluded.work_type, " +
        "employment_type = excluded.employment_type, salary = excluded.salary, seniority = excluded.seniority, " +
        "experience_years = excluded.experience_years, education = excluded.education, industry = excluded.industry, " +
        "required_skills = excluded.required_skills, preferred_skills = excluded.preferred_skills, " +
        "source_url = excluded.source_url, source_name = excluded.source_name, skills = excluded.skills";

    const statements = collected.jobs.map((job) => database.prepare(insertStatement).bind(
        snapshotId, job.id, job.title, job.description, job.company, job.location, job.date,
        job.workType, job.employmentType, job.salary, job.seniority, job.experienceYears,
        job.education, job.industry, JSON.stringify(job.requiredSkills),
        JSON.stringify(job.preferredSkills), job.sourceUrl, job.sourceName, JSON.stringify(job.skills)
    ));

    for (let index = 0; index < statements.length; index += 50) {
        await database.batch(statements.slice(index, index + 50));
    }

    await database.prepare(
        "INSERT INTO snapshot_days (snapshot_date, snapshot_id) VALUES (?, ?) " +
        "ON CONFLICT(snapshot_date) DO UPDATE SET snapshot_id = excluded.snapshot_id"
    ).bind(snapshotDate, snapshotId).run();

    const retentionCutoff = getSnapshotDate(
        new Date(Date.now() - HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    );
    await database.prepare("DELETE FROM snapshot_days WHERE snapshot_date < ?")
        .bind(retentionCutoff).run();
    await database.prepare(
        "DELETE FROM snapshot_runs WHERE snapshot_id NOT IN (SELECT snapshot_id FROM snapshot_days)"
    ).run();

    return {
        snapshotId,
        snapshotDate,
        fetchedAt,
        listingCount: collected.jobs.length,
        queries: SEARCH_QUERIES.length,
        successfulQueries: collected.successfulQueries,
        warning
    };
}

async function readSnapshot(database, snapshotId) {
    const result = await database.prepare(
        "SELECT job_id, title, description, company, location, posted_date, " +
        "work_type, employment_type, salary, seniority, experience_years, education, industry, " +
        "required_skills, preferred_skills, source_url, source_name, skills " +
        "FROM job_observations WHERE snapshot_id = ? ORDER BY title COLLATE NOCASE"
    ).bind(snapshotId).all();
    return (result.results || []).map(fromDatabase);
}

async function readLatestSnapshot(database) {
    const run = await database.prepare(
        "SELECT runs.snapshot_id AS snapshotId, runs.snapshot_date AS snapshotDate, " +
        "runs.fetched_at AS fetchedAt, runs.query_count AS queries, " +
        "runs.successful_queries AS successfulQueries, runs.listing_count AS listingCount, " +
        "runs.warning AS warning FROM snapshot_days AS days " +
        "JOIN snapshot_runs AS runs ON runs.snapshot_id = days.snapshot_id " +
        "ORDER BY days.snapshot_date DESC LIMIT 1"
    ).first();
    if (!run) return null;
    return { ...run, jobs: await readSnapshot(database, run.snapshotId) };
}

function isFreshSnapshot(snapshot, now = Date.now()) {
    const fetchedAt = Date.parse(snapshot.fetchedAt);
    return Number.isFinite(fetchedAt) && now - fetchedAt <= 36 * 60 * 60 * 1000;
}

async function readSnapshotHistory(database, days) {
    const cutoff = getSnapshotDate(
        new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString()
    );
    const result = await database.prepare(
        "SELECT runs.snapshot_date AS snapshotDate, runs.fetched_at AS fetchedAt, " +
        "runs.listing_count AS listingCount, runs.query_count AS queries, " +
        "runs.successful_queries AS successfulQueries, runs.warning AS warning " +
        "FROM snapshot_days AS days JOIN snapshot_runs AS runs ON runs.snapshot_id = days.snapshot_id " +
        "WHERE days.snapshot_date >= ? ORDER BY days.snapshot_date"
    ).bind(cutoff).all();
    return result.results || [];
}

function csvCell(value) {
    const raw = String(value ?? "");
    const formulaPrefix = ["=", "+", "-", "@"].includes(raw.trimStart()[0]);
    const safe = formulaPrefix ? "'" + raw : raw;
    return '"' + safe.replace(/"/g, '""') + '"';
}

async function readSnapshotCsv(database, days) {
    const cutoff = getSnapshotDate(
        new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString()
    );
    const result = await database.prepare(
        "SELECT runs.snapshot_date AS snapshot_date, jobs.job_id AS job_id, " +
        "jobs.title AS title, jobs.description AS description, jobs.company AS company, " +
        "jobs.location AS location, jobs.posted_date AS date, jobs.work_type AS work_type, " +
        "jobs.employment_type AS employment_type, jobs.salary AS salary, jobs.seniority AS seniority, " +
        "jobs.experience_years AS experience_years, jobs.education AS education, jobs.industry AS industry, " +
        "jobs.required_skills AS required_skills, jobs.preferred_skills AS preferred_skills, " +
        "jobs.source_url AS source_url, jobs.source_name AS source_publisher, jobs.skills AS detected_skills " +
        "FROM snapshot_days AS days JOIN snapshot_runs AS runs ON runs.snapshot_id = days.snapshot_id " +
        "JOIN job_observations AS jobs ON jobs.snapshot_id = runs.snapshot_id " +
        "WHERE days.snapshot_date >= ? ORDER BY runs.snapshot_date, jobs.title COLLATE NOCASE"
    ).bind(cutoff).all();

    const headers = [
        "snapshot_date", "job_id", "title", "description", "company", "location",
        "date", "work_type", "work_type_inferred", "employment_type", "salary", "seniority",
        "experience_years", "education", "industry", "required_skills",
        "preferred_skills", "source_url", "source_publisher", "detected_skills"
    ];
    const rows = (result.results || []).map((row) => {
        const inferredWorkType = row.work_type
            ? ""
            : inferWorkArrangement(row.title, row.description);
        return [
            row.snapshot_date, row.job_id, row.title, row.description, row.company, row.location,
            row.date, row.work_type || inferredWorkType, Boolean(inferredWorkType),
            row.employment_type, row.salary, row.seniority,
            row.experience_years, row.education, row.industry,
            parseJsonArray(row.required_skills).join("; "),
            parseJsonArray(row.preferred_skills).join("; "),
            row.source_url, row.source_publisher, parseJsonArray(row.detected_skills).join("; ")
        ];
    });
    return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export default {
    async fetch(request, env, context) {
        const url = new URL(request.url);
        const origin = request.headers.get("Origin");
        const route = url.pathname;

        if (origin && !ALLOWED_ORIGINS.has(origin)) {
            return jsonResponse({ error: "Origin not allowed." }, 403);
        }
        if (request.method === "OPTIONS") {
            return withCors(new Response(null, { status: 204 }), origin);
        }
        if (request.method !== "GET" || !["/jobs", "/history", "/history.csv"].includes(route)) {
            return withCors(jsonResponse({ error: "Not found." }, 404), origin);
        }

        if (route === "/history" || route === "/history.csv") {
            if (!env.JOB_TRENDS_DB) {
                return withCors(jsonResponse({
                    error: "Snapshot storage is not configured yet.",
                    code: "history_storage_not_configured"
                }, 503), origin);
            }
            const daysParam = Number.parseInt(url.searchParams.get("days") || "30", 10);
            const days = Number.isFinite(daysParam)
                ? Math.min(MAX_HISTORY_DAYS, Math.max(1, daysParam))
                : 30;
            try {
                if (route === "/history.csv") {
                    const csv = await readSnapshotCsv(env.JOB_TRENDS_DB, Math.min(days, 30));
                    return withCors(new Response(csv, {
                        status: 200,
                        headers: {
                            "Content-Type": "text/csv; charset=utf-8",
                            "Content-Disposition": 'attachment; filename="job-trends-snapshot-history.csv"',
                            "Cache-Control": "no-store",
                            "X-Content-Type-Options": "nosniff"
                        }
                    }), origin);
                }
                const snapshots = await readSnapshotHistory(env.JOB_TRENDS_DB, days);
                return withCors(jsonResponse({
                    provider: "OpenWeb Ninja JSearch",
                    days,
                    retentionDays: HISTORY_RETENTION_DAYS,
                    snapshots
                }, 200, { "Cache-Control": "public, max-age=900" }), origin);
            } catch (error) {
                console.error("Could not read snapshot history.", error);
                return withCors(jsonResponse({
                    error: "Snapshot storage is not ready. Apply the D1 migration and deploy the Worker again.",
                    code: "history_storage_not_ready"
                }, 503), origin);
            }
        }

        const cacheKey = new Request(new URL("/jobs?cache=history-v2", url.origin), { method: "GET" });
        const cached = await caches.default.match(cacheKey);
        if (cached) {
            const hitHeaders = new Headers(cached.headers);
            hitHeaders.set("X-Job-Feed-Cache", "HIT");
            return withCors(new Response(cached.body, {
                status: cached.status,
                headers: hitHeaders
            }), origin);
        }

        if (!env.OPENWEB_NINJA_API_KEY) {
            return withCors(jsonResponse({ error: "Job feed API key is not configured." }, 503), origin);
        }

        if (env.JOB_TRENDS_DB) {
            let latest;
            try {
                latest = await readLatestSnapshot(env.JOB_TRENDS_DB);
            } catch (error) {
                console.error("Snapshot storage is not ready.", error);
                return withCors(jsonResponse({
                    error: "Snapshot storage is not ready. Apply the D1 migration and deploy the Worker again.",
                    code: "history_storage_not_ready"
                }, 503), origin);
            }
            if (latest && isFreshSnapshot(latest)) {
                const payload = {
                    provider: "OpenWeb Ninja JSearch",
                    fetchedAt: latest.fetchedAt,
                    snapshotDate: latest.snapshotDate,
                    queries: latest.queries,
                    jobs: latest.jobs,
                    warning: latest.warning || ""
                };
                const response = jsonResponse(payload, 200, { "X-Job-Feed-Cache": "D1" });
                context.waitUntil(caches.default.put(cacheKey, response.clone()));
                return withCors(response, origin);
            }
        }

        let collected;
        let snapshot = null;
        let fetchedAt;
        let extraWarning = "";
        try {
            collected = await collectListings(env.OPENWEB_NINJA_API_KEY);
            fetchedAt = new Date().toISOString();
            if (collected.jobs.length === 0) {
                return withCors(jsonResponse({
                    error: "No current listings were returned. Please try again later."
                }, 502), origin);
            }
            if (env.JOB_TRENDS_DB) {
                try {
                    snapshot = await saveSnapshot(env.JOB_TRENDS_DB, collected, fetchedAt);
                } catch (error) {
                    console.error("Could not save the initial job snapshot.", error);
                    extraWarning = "Daily history could not be saved; check the D1 setup.";
                }
            }
        } catch (error) {
            console.error("Could not fetch job listings.", error);
            return withCors(jsonResponse({
                error: "The job provider could not return listings. Please try again later."
            }, 502), origin);
        }

        const warningParts = [];
        if (collected.failedQueries.length) {
            warningParts.push(collected.failedQueries.length + " search group(s) could not be refreshed.");
        }
        if (extraWarning) warningParts.push(extraWarning);
        const payload = {
            provider: "OpenWeb Ninja JSearch",
            fetchedAt,
            snapshotDate: snapshot?.snapshotDate || "",
            queries: SEARCH_QUERIES.length,
            jobs: collected.jobs.map(withInferredWorkArrangement),
            warning: warningParts.join(" ")
        };
        const response = jsonResponse(payload, 200, { "X-Job-Feed-Cache": "MISS" });
        context.waitUntil(caches.default.put(cacheKey, response.clone()));
        return withCors(response, origin);
    },

    async scheduled(controller, env) {
        if (!env.JOB_TRENDS_DB || !env.OPENWEB_NINJA_API_KEY) {
            console.log("Skipping scheduled job snapshot: D1 or JSearch secret is not configured.");
            return;
        }
        try {
            const collected = await collectListings(env.OPENWEB_NINJA_API_KEY);
            if (collected.jobs.length === 0) {
                throw new Error("No current listings were returned.");
            }
            await saveSnapshot(env.JOB_TRENDS_DB, collected, new Date().toISOString());
            console.log("Daily job snapshot saved.");
        } catch (error) {
            console.error("Daily job snapshot failed.", error);
        }
    }
};