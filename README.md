# Humanitarian Futures Simulator

Static humanitarian futures data prototype. The site stays plain HTML, CSS and JavaScript, with local Node data-preparation scripts for public sources that are unreliable or unsuitable for direct browser fetch.

## Run locally

Use any static file server from the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

## Refresh prepared data

Requires Node 18+ because `scripts/build-data.js` uses built-in `fetch`.

```bash
npm install
node scripts/build-emdat.js
node scripts/build-data.js
```

The scripts write source files to `data/prepared/` and write `data/prepared/manifest.json`. Source failures are recorded with exact reasons and remain visible only inside the collapsed source-details section on the Source data page.

## EM-DAT Local Prepared Data

Raw EM-DAT input:

```text
data/private/public_emdat_2026-05-28.xlsx
```

The raw spreadsheet is not committed because it is a private local input and EM-DAT use is subject to EM-DAT terms and citation requirements. The public static site uses the generated aggregate file:

```text
data/prepared/emdat.json
```

`scripts/build-emdat.js` reads the `EM-DAT Data` sheet, aggregates disaster history by country, country-year, disaster type and recent events, then writes the prepared JSON. Commit the generated aggregate JSON when it changes. Do not commit `data/private/` or raw `.xlsx` files.

## Live data

These sources are fetched directly by `index.html`:

- World Bank Indicators
- UNHCR Refugee Data Finder
- GDACS

Use `Source data` -> `Check data sources` to verify them in the browser.

## Prepared data

The prepared-data script currently attempts health, population, humanitarian, climate, hazard, development, economic and operational sources. Sources that return usable rows are listed as working sources on the Source data page. Sources that fail are kept in the collapsed source-details section with the returned error reason.

Current prepared outputs include files such as:

- `data/prepared/manifest.json`
- `data/prepared/emdat.json`
- `data/prepared/who-gho.json`
- `data/prepared/owid.json`
- `data/prepared/worldpop.json`
- `data/prepared/open-meteo.json`
- `data/prepared/usgs-earthquakes.json`

## Browser data caveat

Public APIs can fail in the browser because of CORS, even when the same endpoint works from Node. The prepared-data script is used for public no-key data that can be fetched locally and stored as static JSON.

Never put secrets, API keys, tokens, cookies, passwords, private credentials or app identifiers into frontend JavaScript.

## Commit and deploy after refreshing data

After running the data refresh commands:

```bash
git status
git add index.html README.md .gitignore package.json package-lock.json scripts/build-data.js scripts/build-emdat.js data/prepared
git commit -m "Refresh prepared data"
git push origin main
```
