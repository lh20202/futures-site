# Humanitarian Futures Simulator

Static humanitarian futures data prototype. The site stays plain HTML, CSS and JavaScript, with a local Node data-preparation step for public sources that are unreliable or unsuitable for direct browser fetch.

## Run locally

Use any static file server from the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

## Refresh prepared public data

Requires Node 18+ because the script uses built-in `fetch`.

```bash
node scripts/build-data.js
```

The script writes source files to `data/prepared/` and writes `data/prepared/manifest.json`. It continues through source failures and records exact failure reasons.

## Live browser data

These sources are fetched directly by `index.html`:

- World Bank Indicators
- UNHCR Refugee Data Finder
- GDACS

Use `Source data` -> `Test live browser sources` to verify them in the browser.

## Prepared public data generated successfully

Current successful prepared sources:

- WHO Global Health Observatory
- Our World in Data
- WorldPop
- UN SDG API
- Open-Meteo
- USGS Earthquake API

Use `Source data` -> `Load prepared public data` to load the generated JSON files into the page.

## Attempted and excluded sources

Current failed prepared attempts:

- HDX HAPI: HTTP 403 invalid app identifier.
- FAOSTAT: HTTP 401 missing authorization header.
- ReliefWeb: HTTP 400 missing approved appname parameter.
- SDG6 Data: returned HTML instead of usable JSON rows.
- EM-DAT: returned HDX package metadata only, not public aggregated data rows.
- INFORM Risk Index: returned location rows but no risk score or component values.

Other excluded sources:

- ACLED: authenticated access/token required.
- IOM DTM: subscription/authentication required for checked routes.
- IDMC: documented direct access uses a client identifier/API key.
- NASA SEDAC / Earthdata: catalogue discovery is not actual numeric data ingestion.
- World Bank CCKP: no no-secret climate-value route implemented in this build.

## Browser data caveat

Public APIs can fail in the browser because of CORS, even when the same endpoint works from Node. The prepared-data script is used for public no-key data that can be fetched locally and stored as static JSON.

Never put secrets, API keys, tokens, cookies or passwords into frontend JavaScript.

## Commit and deploy after refreshing data

After running the data refresh command:

```bash
git status
git add index.html README.md scripts/build-data.js data/prepared
git commit -m "Refresh prepared public data"
git push origin main
```
