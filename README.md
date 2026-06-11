# nbs-case-studies-site

Public landing page for the NbS case studies project. Three buttons:
two to Google Forms (submit case / suggest source), one to the team
Google Sheet (review pending items).

## How to deploy

1. Create a new **public** GitHub repo named `nbs-case-studies-site`.
2. Push the contents of this folder.
3. In Settings → Pages, set Source to `main` / root.
4. The site goes live at `https://klarakaleb.github.io/nbs-case-studies-site/`
   within a minute.

## Before pushing — replace placeholders

In `index.html`, replace:

- `https://forms.gle/REPLACE_WITH_FORM_LINK` (twice) with your Google
  Form's short link
- `https://docs.google.com/spreadsheets/d/REPLACE_WITH_SHEET_ID/edit`
  with your Google Sheet's URL
- `YOUR-GH-USERNAME` (in the footer) with your actual GitHub username

That's it. No backend, no auth — privacy is enforced at the Google layer
(only Sheet collaborators can see the Sheet content).

## Coverage map (`map.html`)

A D3 choropleth showing the world's countries shaded by the number of
documented case studies. Click a country for its count. Inspired by
Legal Data Hunter's state-shaded coverage map.

Data source: `cases.json` in this folder. Format is country → count —
**counts only, by design**: this file is public, and individual study
titles/locations must never be published here.

```json
{
  "United Kingdom": 3,
  "Kenya": 1
}
```

Two ways to keep it updated:

1. **Automatic (recommended):** the private repo has an `update-map.yml`
   workflow that runs `tools/generate_map_data.py` on every DB change and
   pushes the regenerated `cases.json` to this repo. You need to add two
   secrets to the private repo:
   - `SITE_DEPLOY_TOKEN` — a personal access token with `repo` scope
   - `SITE_REPO` — `YOUR-USERNAME/nbs-case-studies-site`

2. **Manual:** when the DB changes, run
   `python tools/generate_map_data.py --output ../nbs-case-studies-site/cases.json`
   locally and push the result. Fine for low-frequency updates.

If `cases.json` is missing or empty, the map renders with grey countries
and a message — fails gracefully.

## Country-name reconciliation

The world-atlas TopoJSON uses one set of country names; case CSVs use
another. `map.js` has a `COUNTRY_ALIASES` table at the top — extend it
when you spot a country that's not lighting up correctly.
