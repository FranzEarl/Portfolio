# Personal Portfolio

A personal portfolio showcasing my projects, technical skills, and work in programming and web development.

## Built With

- HTML
- CSS
- JavaScript
- Python

## Features

- Responsive layout
- About Me section
- Projects showcase
- Skills overview
- Contact links

## Personal Expense Insights

The browser-based expense dashboard is in `projects/expense-insights/`. Open
`index.html` directly or serve the repository with `python -m http.server` and
visit `/projects/expense-insights/`. It starts with fictional sample data; CSV
imports are processed locally in your browser and are not uploaded.
Its page includes a short case study.
CSV imports show a review preview and warn about repeated rows before replacing
the current dashboard; cancel to keep the current data. Export the current
transactions as a CSV in the same format for a local copy.
Filter the summary cards and charts by month and category; filters only affect
the current browser view and do not modify the underlying transactions.
Set a monthly budget to see spending progress for the selected month; it compares
all categories. Budget targets stay in the current page session by default.
Opt in with "Remember data on this device" to save the current dashboard data
and monthly budget targets in this browser profile; they are restored on return.
Turning remembering off or using "Clear saved data" removes the saved copies,
but targets already set remain available in the current page session. Run
dashboard tests with
`node --test projects/tests/expense-insights.test.js`.

CSV files need a header row with `date`, `category`, and `amount` columns.
Dates use `YYYY-MM-DD`; an optional `description` column appears in the
transaction list and is included in exports, but not in summary charts.
The transaction list follows the month and category filters.
Search its visible rows by date, category, or description, and sort them by date
or amount. Search and sorting only change the transaction list, not the summary
totals.
Add expenses directly in the dashboard or edit and delete individual entries
from the transaction list. Manual changes follow the same opt-in device-saving
setting as imported data.

## Study Performance Dashboard

The study dashboard is in `projects/study-performance/`. Open `index.html`
directly or serve the repository with `python -m http.server` and visit
`/projects/study-performance/`. Its page includes a short case study. It
presents fictional grades, attendance, and
study hours for demonstration; it does not connect to a school system. Download
`sample-study-performance.csv` from the dashboard
to see the data format: one course per row, with `course`, `grade`,
`attendance`, and `study_hours` columns. Grade and attendance are percentages;
study hours are totals over four weeks. Import a CSV to update the dashboard
with any number of courses; the file is read in the browser and not uploaded.
Export the currently displayed courses as a CSV to save a local copy. Data is
not stored automatically unless you opt in with "Remember data on this device";
it is then restored on return. Use "Clear saved data" to remove the saved copy
and turn remembering off. The current view stays in place until you leave or
reload. Run its import, export, storage, and rendering regression tests with
`node --test projects/tests/study-performance.test.js`.

## Job Skills & Hiring Trends Explorer

The job-postings analyzer is in `projects/job-trends/`. It loads current Philippine listings from a Cloudflare Worker when configured; visitors can also use fictional sample listings or import a CSV. CSV files are analyzed locally in the browser and are not uploaded or saved. The dashboard compares requested skills, categories, roles, work arrangements, locations, and posting dates. If work arrangement is missing, it identifies only explicit remote, hybrid, or on-site wording in live listing text and marks that value as inferred; uncertain listings remain unclassified. Optional source fields can be blank when the provider does not supply them.

Download `job-postings-template.csv` for the supported CSV columns. `title` (or `job_title`) and `description` (or `job_description`) are required; `company`, `location`/`city`, `date`/`posted_date`/`dateCreated`, `work_type`/`workType`, and `source_url` are optional. Techmap CSV exports are supported directly, including ISO timestamp dates, JSON-array work types, and source URLs nested in `jsonLD`. Visitors can export either the currently filtered listings or the daily snapshot history as CSV; inferred work arrangement values are identified in the exports.

The Cloudflare Worker can save daily snapshots to D1, retain 90 days, and expose the latest month of history as a CSV download. Collection starts after D1 setup and deployment; it does not backfill earlier listings. See [the API setup guide](api/job-trends/README.md) for provider, database, schedule, and deployment instructions. Run its CSV parsing, analysis, filtering, and safety tests with `node --test projects/tests/job-trends.test.js`.

## Philippines Labor Market Explorer

The public-statistics dashboard is in `projects/ph-labor-market/`. It fetches
annual Philippines indicators from the free World Bank API without an account,
subscription, or API key. It visualizes modeled unemployment and labor-force
estimates alongside employment shares by sector, calculates a data-driven
summary of long-run sector changes and the recent youth unemployment series,
and can export the annual observations to CSV. These are broad annual labor
statistics, not current job listings or a measure of skills demand. Run its
analysis, export, and response-validation tests with
`node --test projects/tests/ph-labor-market.test.js`.

## C Programs

The C source files are in `projects/c-programs/`, with a browsable listing at
`projects/c-programs.html`. To refresh that listing after adding or removing a
program, run `python projects/generate.py`. To regenerate it automatically
while editing the C files, run `python projects/watch.py`.

The input-handling regression tests require Node.js and GCC. Run them with
`node --test projects/tests/c-programs.test.js`.

## About

This portfolio serves as a collection of my projects and a place to showcase what I've learned while exploring programming and web development.
