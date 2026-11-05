CREATE TABLE IF NOT EXISTS snapshot_runs (
    snapshot_id TEXT PRIMARY KEY,
    snapshot_date TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    query_count INTEGER NOT NULL,
    successful_queries INTEGER NOT NULL,
    listing_count INTEGER NOT NULL,
    warning TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS snapshot_days (
    snapshot_date TEXT PRIMARY KEY,
    snapshot_id TEXT NOT NULL REFERENCES snapshot_runs(snapshot_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_observations (
    snapshot_id TEXT NOT NULL REFERENCES snapshot_runs(snapshot_id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    posted_date TEXT NOT NULL DEFAULT '',
    work_type TEXT NOT NULL DEFAULT '',
    employment_type TEXT NOT NULL DEFAULT '',
    salary TEXT NOT NULL DEFAULT '',
    seniority TEXT NOT NULL DEFAULT '',
    experience_years TEXT NOT NULL DEFAULT '',
    education TEXT NOT NULL DEFAULT '',
    industry TEXT NOT NULL DEFAULT '',
    required_skills TEXT NOT NULL DEFAULT '[]',
    preferred_skills TEXT NOT NULL DEFAULT '[]',
    source_url TEXT NOT NULL DEFAULT '',
    source_name TEXT NOT NULL DEFAULT '',
    skills TEXT NOT NULL DEFAULT '[]',
    PRIMARY KEY (snapshot_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_runs_date ON snapshot_runs(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_job_observations_snapshot ON job_observations(snapshot_id);
