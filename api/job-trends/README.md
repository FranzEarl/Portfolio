# Job Trends API setup

The portfolio is hosted as a static GitHub Pages site. The JSearch API key must stay on a server, so the page calls the small Cloudflare Worker in this folder instead of calling the provider directly.

## Provider and coverage

The Worker searches five data-role groups in the Philippines using OpenWeb Ninja JSearch, requests postings from the past month, and removes duplicate results. It keeps title, full description, employer, location, date, work arrangement, employment type, salary, seniority, experience, education, industry, publisher, apply link, and required/preferred technologies when those fields are present. The dashboard combines structured skills with keyword matches from the description.

Some postings omit optional fields such as salary or seniority. These are current search matches, not a complete census of the Philippine job market. This feed does not provide stored historical snapshots, so year-over-year trends would need a separate collection step. JSearch's free plan currently has a hard limit of 200 requests per month. The Worker caches its combined response for 24 hours at each Cloudflare edge location; cold locations can make additional provider calls.

## Connect the API

1. Create an OpenWeb Ninja account and copy a JSearch API key. The provider currently offers a free plan without a credit card.
2. Install Wrangler or run it through `npx`, then authenticate with your Cloudflare account using `npx wrangler login`.
3. From this folder, add the provider key as a Worker secret and deploy:

   ```sh
   npx wrangler secret put OPENWEB_NINJA_API_KEY
   npx wrangler deploy
   ```

4. Copy the deployed Worker URL. It will end in `/jobs`.
5. Put that URL in `projects/job-trends/api-config.js` as `globalThis.JOB_TRENDS_API_URL`, then commit and push the change.

The key belongs only in the Cloudflare Worker secret store. Do not put it in the portfolio JavaScript, HTML, or GitHub.

## Data choices

When the Worker URL is configured, the dashboard loads API listings by default. Visitors can still import their own CSV at any time; CSV processing stays in their browser. The fictional sample remains available for previewing the interface if the API is not configured or temporarily unavailable.
