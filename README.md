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
Export the current transactions as a CSV in the same format for a local copy.
Opt in with "Remember data on this device" to save the current dashboard data
in this browser profile; it is restored on return. Use "Clear saved data" to
remove the saved copy and turn remembering off. The current view stays in place
until you leave or reload. Run dashboard tests with
`node --test projects/tests/expense-insights.test.js`.

CSV files need a header row with `date`, `category`, and `amount` columns.
Dates use `YYYY-MM-DD`; an optional `description` column is ignored by the
summary charts.

## Study Performance Dashboard

The study dashboard is in `projects/study-performance/`. Open `index.html`
directly or serve the repository with `python -m http.server` and visit
`/projects/study-performance/`. It presents fictional grades, attendance, and
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

## C Programs

The C source files are in `projects/c-programs/`, with a browsable listing at
`projects/c-programs.html`. To refresh that listing after adding or removing a
program, run `python projects/generate.py`. To regenerate it automatically
while editing the C files, run `python projects/watch.py`.

The input-handling regression tests require Node.js and GCC. Run them with
`node --test projects/tests/c-programs.test.js`.

## About

This portfolio serves as a collection of my projects and a place to showcase what I've learned while exploring programming and web development.
