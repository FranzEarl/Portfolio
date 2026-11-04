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

The job-postings analyzer is in `projects/job-trends/`. It analyzes listings
from a CSV you provide and extracts normalized data skills from each title and
description. The file is processed in your browser and is not uploaded or saved.
Download `job-postings-template.csv` from the dashboard for the supported
columns. `title` (or `job_title`) and `description` (or `job_description`) are
required; `company`, `location`/`city`, `date`/`posted_date`/`dateCreated`,
`work_type`/`workType`, and `source_url` are optional. Techmap CSV exports are
supported directly, including ISO timestamp dates, JSON-array work types, and
source URLs nested in `jsonLD`. The skill taxonomy and CSV fields are
independent of any job board or country so an approved feed can be added later
without changing the analysis model. Run its CSV parsing, analysis, filtering,
and safety tests with `node --test projects/tests/job-trends.test.js`.

## C Programs

The C source files are in `projects/c-programs/`, with a browsable listing at
`projects/c-programs.html`. To refresh that listing after adding or removing a
program, run `python projects/generate.py`. To regenerate it automatically
while editing the C files, run `python projects/watch.py`.

The input-handling regression tests require Node.js and GCC. Run them with
`node --test projects/tests/c-programs.test.js`.

## About

This portfolio serves as a collection of my projects and a place to showcase what I've learned while exploring programming and web development.
