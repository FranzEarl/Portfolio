# Job Trends API setup

The portfolio is hosted as a static GitHub Pages site. The JSearch API key stays in a Cloudflare Worker secret; the dashboard calls the Worker instead of calling the provider directly.

## Feed and snapshot behavior

The Worker searches five data-role groups in the Philippines with OpenWeb Ninja JSearch, requests postings from the past month, and removes duplicates. It preserves provider fields when present, including work arrangement, employment type, salary, seniority, experience, education, industry, and required/preferred technologies. The dashboard combines structured skills with keyword matches from listing text. When the provider omits work arrangement, the Worker classifies only clear “remote,” “hybrid,” or “on-site” wording in the title or description. Those values are marked as inferred; ambiguous wording stays blank.

A daily Cloudflare Cron Trigger collects a snapshot at 00:00 UTC (08:00 in the Philippines). Five search requests per day use about 150 JSearch requests per 30-day month, within the provider's 200-request monthly plan if usage remains near that level. The daily snapshot is served to dashboard visitors; if a scheduled collection is missed or the database has no snapshot yet, the first dashboard request can collect one.

Snapshots begin only after D1 is configured and deployed; earlier listings cannot be backfilled. The Worker keeps 90 days of daily history. The dashboard shows the latest 30 days and offers a CSV download of snapshot listing records for up to 30 days. Its separate “Download filtered CSV” action still exports the current filtered view. API fields can be blank when the provider does not supply them. Work arrangement is inferred only from explicit listing text and is marked in the dashboard and CSV. Listings are search matches, not a complete census of the Philippine job market.

## Connect the API and snapshot storage

Run these commands from `api/job-trends/`:

1. Authenticate Wrangler to Cloudflare if needed:
   ```sh
   npx wrangler login
   ```
2. Create the D1 database and add its binding to `wrangler.toml`:
   ```sh
   npx wrangler d1 create portfolio-job-trends --binding JOB_TRENDS_DB --update-config
   ```
3. Apply the snapshot tables to the remote database:
   ```sh
   npx wrangler d1 migrations apply portfolio-job-trends --remote
   ```
4. Store the provider key as a Worker secret (skip if it is already set):
   ```sh
   npx wrangler secret put OPENWEB_NINJA_API_KEY
   ```
5. Deploy the Worker:
   ```sh
   npx wrangler deploy
   ```
6. Confirm the deployed Worker has a working `/jobs` response and that `/history` returns JSON. If the database is empty, the first request to `/jobs` will create the initial snapshot. History fills from that point forward.
7. Set `projects/job-trends/api-config.js` to the deployed Worker URL ending in `/jobs`, then publish the portfolio site.

If the database already exists, do not create it again. Check its name and binding in `wrangler.toml`, then apply migrations and deploy. Cloudflare's “Create a Worker” form is not needed for this setup because Wrangler deploys the Worker in this folder.

Keep the JSearch key only in Cloudflare's Worker secret store. Do not put it in portfolio JavaScript, HTML, or GitHub.

## Visitor data choices

When the Worker URL is configured, the dashboard loads API listings by default. Visitors can still import their own CSV at any time; CSV processing stays in their browser. The fictional sample remains available for previewing the interface if the API is not configured or temporarily unavailable.
