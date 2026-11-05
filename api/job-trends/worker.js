const API_BASE = "https://api.openwebninja.com/jsearch/search-v2";
const CACHE_TTL_SECONDS = 24 * 60 * 60;
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
            "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
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

function toListing(record) {
    const title = String(record.job_title || "").trim();
    if (!title) return null;

    const hasTimestamp = record.job_posted_at_timestamp !== null
        && record.job_posted_at_timestamp !== undefined
        && Number.isFinite(Number(record.job_posted_at_timestamp));
    const postedAt = record.job_posted_at_datetime_utc
        || (hasTimestamp ? new Date(Number(record.job_posted_at_timestamp) * 1000).toISOString() : "");
    const salaryValues = [record.job_min_salary, record.job_max_salary]
        .filter((value) => value !== null && value !== undefined && Number.isFinite(Number(value)))
        .map((value) => Number(value).toLocaleString("en-PH"));
    const salary = record.job_salary_string
        || (salaryValues.length ? `${record.job_salary_currency || ""} ${salaryValues.join("–")}${record.job_salary_period ? ` / ${record.job_salary_period.toLowerCase()}` : ""}`.trim() : "");
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
        throw new Error(`Upstream request returned ${response.status}`);
    }

    return extractListings(await response.json());
}

export default {
    async fetch(request, env, context) {
        const url = new URL(request.url);
        const origin = request.headers.get("Origin");
        if (origin && !ALLOWED_ORIGINS.has(origin)) {
            return jsonResponse({ error: "Origin not allowed." }, 403);
        }
        if (request.method === "OPTIONS") {
            return withCors(new Response(null, { status: 204 }), origin);
        }
        if (request.method !== "GET" || url.pathname !== "/jobs") {
            return withCors(jsonResponse({ error: "Not found." }, 404), origin);
        }

        const cacheKey = new Request(new URL("/jobs", url.origin), { method: "GET" });
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

        const results = await Promise.allSettled(
            SEARCH_QUERIES.map((query) => searchJobs(query, env.OPENWEB_NINJA_API_KEY))
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
        const jobs = [...uniqueListings.values()];
        if (jobs.length === 0) {
            return withCors(jsonResponse({
                error: "No current listings were returned. Please try again later."
            }, 502), origin);
        }

        const payload = {
            provider: "OpenWeb Ninja JSearch",
            fetchedAt: new Date().toISOString(),
            queries: SEARCH_QUERIES.length,
            jobs,
            warning: failedQueries.length
                ? `${failedQueries.length} search group(s) could not be refreshed.`
                : ""
        };
        const response = jsonResponse(payload, 200, { "X-Job-Feed-Cache": "MISS" });
        context.waitUntil(caches.default.put(cacheKey, response.clone()));
        return withCors(response, origin);
    }
};
