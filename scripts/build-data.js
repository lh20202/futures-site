#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const OUT_DIR = path.join(__dirname, "..", "data", "prepared");
const now = () => new Date().toISOString();

const countries = [
  { name: "Bangladesh", iso3: "BGD", sdg: "50", lat: 23.685, lon: 90.3563 },
  { name: "Haiti", iso3: "HTI", sdg: "332", lat: 18.9712, lon: -72.2852 },
  { name: "Kenya", iso3: "KEN", sdg: "404", lat: -1.2864, lon: 36.8172 },
  { name: "Nigeria", iso3: "NGA", sdg: "566", lat: 9.082, lon: 8.6753 },
  { name: "Philippines", iso3: "PHL", sdg: "608", lat: 14.5995, lon: 120.9842 },
  { name: "Sudan", iso3: "SDN", sdg: "729", lat: 15.5007, lon: 32.5599 }
];

const sourceInfo = {
  "who-gho": {
    name: "WHO Global Health Observatory",
    site: "https://www.who.int/data/gho",
    contains: "Health indicators across countries, including mortality and public health topics.",
    matters: "Health-system and mortality context can reveal baseline resilience and service pressure.",
    uses: "Prepared WHO life-expectancy records where direct browser fetch is unreliable.",
    description: "WHO Global Health Observatory is WHO's central health statistics repository. It contains health indicators across countries, including mortality, disease, health systems, public health and workforce topics. This site uses prepared WHO records where direct browser fetch is unreliable.",
    limitations: "Prepared from one confirmed WHO GHO indicator in this build; broader GHO themes were attempted through indicator probing but only records with usable numeric values are retained."
  },
  "hdx-hapi": {
    name: "HDX HAPI",
    site: "https://hapi.humdata.org/",
    contains: "Standardised humanitarian indicators from HDX HAPI when anonymous access is accepted.",
    matters: "Common humanitarian rows can add needs, population and operational context.",
    uses: "No working rows are used unless the HAPI endpoint returns actual indicator rows.",
    description: "HDX HAPI provides standardised humanitarian indicators from the Humanitarian Data Exchange. This site uses it only where actual indicator rows are retrieved, not dataset listings.",
    limitations: "Anonymous request was tested; failure means no prepared HAPI rows are exposed as working data."
  },
  owid: {
    name: "Our World in Data",
    site: "https://ourworldindata.org/",
    contains: "Reusable country-level datasets and chart data on health, development, climate and access.",
    matters: "Broad social, health and climate indicators help frame humanitarian futures context.",
    uses: "Prepared country rows from selected OWID Grapher CSV endpoints.",
    description: "Our World in Data publishes reusable country-level datasets and chart data. This site uses selected OWID indicators as prepared public data for social, health, climate, development and resilience context.",
    limitations: "Prepared sample is limited to selected Grapher indicators and starter countries."
  },
  faostat: {
    name: "FAOSTAT",
    site: "https://www.fao.org/faostat/",
    contains: "International food and agriculture statistics.",
    matters: "Food-system and agriculture indicators can reveal production and resource pressures.",
    uses: "No rows are used unless the public endpoint returns actual agriculture rows.",
    description: "FAOSTAT provides international food and agriculture statistics. This site uses selected public rows for food-system, agriculture and resource-risk context.",
    limitations: "Tested endpoint rejected unauthenticated access in this build."
  },
  worldpop: {
    name: "WorldPop",
    site: "https://www.worldpop.org/",
    contains: "Open spatial demographic data and population estimates.",
    matters: "Population exposure and planning questions need demographic context beyond national totals.",
    uses: "Prepared population estimates for small sample areas around starter-country coordinates.",
    description: "WorldPop provides open spatial demographic data. This site uses prepared WorldPop data where useful population values can be retrieved for exposure, planning and preparedness context.",
    limitations: "Values are sample-area estimates, not national totals."
  },
  reliefweb: {
    name: "ReliefWeb",
    site: "https://reliefweb.int/",
    contains: "Humanitarian reports, disaster records and crisis information.",
    matters: "Recent reporting can add situational awareness to numeric indicators.",
    uses: "No records are used unless the API accepts a no-secret request and returns reports.",
    description: "ReliefWeb provides humanitarian reports, disaster records and crisis information. This site uses selected records to add recent humanitarian situation context.",
    limitations: "ReliefWeb requires an approved app name parameter; this static prototype does not place app identifiers in source code."
  },
  "un-sdg": {
    name: "UN SDG API",
    site: "https://unstats.un.org/sdgs/dataportal",
    contains: "Official Sustainable Development Goal indicator data.",
    matters: "SDG indicators describe poverty, health, water, energy, climate and institutional resilience.",
    uses: "Prepared SDG poverty indicator rows for starter countries where values are returned.",
    description: "The UN SDG API provides official Sustainable Development Goal data reported through the global SDG indicator framework. This site uses selected SDG records for development, resilience and preparedness context.",
    limitations: "Prepared sample uses selected indicators and starter countries with returned values."
  },
  sdg6: {
    name: "SDG6 Data",
    site: "https://www.sdg6data.org/",
    contains: "Water, sanitation and hygiene indicators.",
    matters: "WASH indicators are central to public health and resilience context.",
    uses: "No records are used unless a no-secret API route returns WASH data rows.",
    description: "SDG6 Data provides water, sanitation and hygiene indicators. This site uses selected records to support WASH, public health and resilience context.",
    limitations: "Tested route returned a 4xx HTML page rather than usable JSON rows."
  },
  "open-meteo": {
    name: "Open-Meteo",
    site: "https://open-meteo.com/",
    contains: "No-key weather and historical weather values.",
    matters: "Recent weather and precipitation context can help frame environmental stress and preparedness.",
    uses: "Prepared current and daily weather values for starter-country coordinates.",
    description: "Open-Meteo provides no-key weather and historical weather data. This site uses selected climate and weather values for environmental stress and preparedness context.",
    limitations: "Prepared sample uses capital-area coordinates, not national gridded coverage."
  },
  "usgs-earthquakes": {
    name: "USGS Earthquake API",
    site: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php",
    contains: "Recent earthquake event records as GeoJSON.",
    matters: "Seismic event records add current hazard monitoring context.",
    uses: "Prepared recent magnitude 4.5+ earthquake events.",
    description: "USGS Earthquake API provides recent and historical earthquake event records. This site uses selected events for seismic hazard and disaster context.",
    limitations: "Prepared sample is a recent global feed and is not country-filtered."
  },
  emdat: {
    name: "EM-DAT",
    site: "https://www.emdat.be/",
    contains: "International disaster database records where public aggregated rows are accessible.",
    matters: "Disaster history can inform context if actual rows can be retrieved.",
    uses: "No rows are used unless actual public aggregated data rows are fetched and parsed.",
    description: "EM-DAT is an international disaster database. This site uses publicly accessible aggregated rows where they can be retrieved and parsed.",
    limitations: "No no-secret row endpoint was confirmed in this build; metadata searches are not treated as data."
  },
  inform: {
    name: "INFORM Risk Index",
    site: "https://drmkc.jrc.ec.europa.eu/inform-index",
    contains: "Comparative crisis and disaster risk indicators where public machine-readable values are available.",
    matters: "Risk values can help compare vulnerability and coping-capacity context.",
    uses: "No values are used unless a public machine-readable route returns actual INFORM values.",
    description: "INFORM Risk Index provides comparative crisis and disaster risk indicators. This site uses INFORM values where a public machine-readable route returns actual risk data.",
    limitations: "No stable no-secret JSON value endpoint was confirmed in this build."
  }
};

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 12000);
  try {
    const response = await fetch(url, {
      headers: { Accept: options.accept || "application/json,text/csv,*/*" },
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 180) || response.statusText}`);
    return { response, text };
  } catch (error) {
    error.endpoint = url;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, options = {}) {
  const { text } = await fetchWithTimeout(url, { ...options, accept: "application/json" });
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Parsing failed: expected JSON but received ${text.slice(0, 120)}`);
  }
}

async function fetchText(url, options = {}) {
  const { text } = await fetchWithTimeout(url, options);
  return text;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines.shift() || "");
  return lines.map(line => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
  });
}

function splitCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function normalizeRows(rows, max = 24) {
  return rows.slice(0, max);
}

function success(slug, endpoint, rows, fieldNotes = "") {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("returned no usable records");
  return {
    slug,
    ...sourceInfo[slug],
    status: "success",
    retrievalTimestamp: now(),
    endpoint,
    rowCount: rows.length,
    sampleRows: normalizeRows(rows),
    fieldNotes
  };
}

function failure(slug, endpoint, reason) {
  return {
    slug,
    ...sourceInfo[slug],
    status: "failure",
    retrievalTimestamp: now(),
    endpoint,
    rowCount: 0,
    sampleRows: [],
    failureReason: reason
  };
}

async function buildWhoGho() {
  const rows = [];
  const endpoints = [];
  for (const country of countries.slice(0, 4)) {
    const endpoint = `https://ghoapi.azureedge.net/api/WHOSIS_000001?$filter=SpatialDim%20eq%20%27${country.iso3}%27%20and%20Dim1%20eq%20%27SEX_BTSX%27&$top=8`;
    endpoints.push(endpoint);
    const json = await fetchJson(endpoint);
    const values = Array.isArray(json.value) ? json.value : [];
    values.filter(row => row.NumericValue !== null && row.NumericValue !== undefined).slice(0, 5).forEach(row => {
      rows.push({
        country: country.name,
        iso3: country.iso3,
        indicator: "Life expectancy at birth",
        year: row.TimeDim,
        value: row.NumericValue,
        displayValue: row.Value
      });
    });
  }
  return success("who-gho", endpoints.join(" | "), rows, "NumericValue is WHO's numeric life-expectancy value; Value preserves WHO display text and uncertainty interval.");
}

async function buildHdxHapi() {
  const endpoint = "https://hapi.humdata.org/api/v1/metadata/location?limit=3";
  const json = await fetchJson(endpoint);
  if (json && json.error) {
    const error = new Error(json.error);
    error.endpoint = endpoint;
    throw error;
  }
  const rows = Array.isArray(json.data) ? json.data : [];
  return success("hdx-hapi", endpoint, rows, "Expected standardised HAPI rows. This endpoint must return row data without an app identifier to count.");
}

async function buildOwid() {
  const indicators = [
    ["population", "Population", "https://ourworldindata.org/grapher/population.csv"],
    ["life-expectancy", "Life expectancy", "https://ourworldindata.org/grapher/life-expectancy.csv"],
    ["co2", "CO2 emissions", "https://ourworldindata.org/grapher/co2.csv"],
    ["share-of-population-in-extreme-poverty", "Extreme poverty", "https://ourworldindata.org/grapher/share-of-population-in-extreme-poverty.csv"]
  ];
  const rows = [];
  const endpoints = [];
  const skipped = [];
  for (const [slug, label, endpoint] of indicators) {
    endpoints.push(endpoint);
    try {
      const csv = await fetchText(endpoint, { accept: "text/csv" });
      const parsed = parseCsv(csv);
      countries.forEach(country => {
        const countryRows = parsed.filter(row => row.Code === country.iso3 && Number(row.Year) >= 2000);
        const latest = countryRows[countryRows.length - 1];
        if (latest) {
          const valueKey = Object.keys(latest).find(key => !["Entity", "Code", "Year"].includes(key));
          rows.push({
            country: country.name,
            iso3: country.iso3,
            indicator: label,
            year: Number(latest.Year),
            value: Number(latest[valueKey]),
            sourceColumn: valueKey
          });
        }
      });
    } catch (error) {
      skipped.push({
        indicator: label,
        slug,
        endpoint,
        reason: error.message || String(error)
      });
    }
  }
  const result = success("owid", endpoints.join(" | "), rows, "Prepared from selected OWID Grapher CSV files; latest starter-country rows are retained. Skipped endpoints are listed in skippedIndicators.");
  result.skippedIndicators = skipped;
  return result;
}

async function buildFaostat() {
  const endpoint = "https://faostatservices.fao.org/api/v1/Definitions/Domains";
  const json = await fetchJson(endpoint);
  const rows = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
  return success("faostat", endpoint, rows, "Expected FAOSTAT public API rows.");
}

async function buildWorldPop() {
  const rows = [];
  const endpoints = [];
  for (const country of countries.slice(0, 4)) {
    const bbox = [country.lon - 0.15, country.lat - 0.15, country.lon + 0.15, country.lat + 0.15];
    const geojson = encodeURIComponent(JSON.stringify({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [[[bbox[0], bbox[1]], [bbox[2], bbox[1]], [bbox[2], bbox[3]], [bbox[0], bbox[3]], [bbox[0], bbox[1]]]]
        }
      }]
    }));
    const endpoint = `https://api.worldpop.org/v1/services/stats?dataset=wpgppop&year=2020&geojson=${geojson}&runasync=false`;
    endpoints.push(endpoint);
    const json = await fetchJson(endpoint);
    if (json && json.data && Number.isFinite(Number(json.data.total_population))) {
      rows.push({
        country: country.name,
        iso3: country.iso3,
        year: 2020,
        value: Number(json.data.total_population),
        metric: "sample area total population",
        latitude: country.lat,
        longitude: country.lon
      });
    }
  }
  return success("worldpop", endpoints.join(" | "), rows, "Values are WorldPop total_population for small sample polygons around starter-country coordinates.");
}

async function buildReliefWeb() {
  const endpoint = "https://api.reliefweb.int/v2/reports?limit=3&profile=list&preset=latest";
  const json = await fetchJson(endpoint);
  const rows = Array.isArray(json.data) ? json.data.map(item => ({
    id: item.id,
    title: item.fields && item.fields.title,
    date: item.fields && item.fields.date && item.fields.date.created,
    url: item.href
  })) : [];
  return success("reliefweb", endpoint, rows, "Expected ReliefWeb report records from the v2 API.");
}

async function buildUnSdg() {
  const rows = [];
  const endpoints = [];
  for (const country of countries.slice(0, 4)) {
    const endpoint = `https://unstats.un.org/SDGAPI/v1/sdg/Indicator/Data?indicator=1.1.1&areaCode=${country.sdg}&page=1&pageSize=8`;
    endpoints.push(endpoint);
    const json = await fetchJson(endpoint);
    const values = Array.isArray(json.data) ? json.data : [];
    values.filter(row => row.value !== undefined && row.value !== null).slice(0, 5).forEach(row => {
      rows.push({
        country: row.geoAreaName || country.name,
        iso3: country.iso3,
        indicator: row.seriesDescription || "SDG indicator 1.1.1",
        year: row.timePeriodStart,
        value: Number(row.value),
        unit: row.attributes && row.attributes.Units
      });
    });
  }
  return success("un-sdg", endpoints.join(" | "), rows, "Prepared from UN SDG indicator 1.1.1 rows where numeric values are returned.");
}

async function buildSdg6() {
  const endpoint = "https://www.sdg6data.org/api/Indicator/GetWorldMapData?indicator=6.1.1";
  const json = await fetchJson(endpoint);
  const rows = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
  return success("sdg6", endpoint, rows, "Expected WASH indicator rows from SDG6 Data.");
}

async function buildOpenMeteo() {
  const rows = [];
  const endpoints = [];
  for (const country of countries.slice(0, 4)) {
    const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${country.lat}&longitude=${country.lon}&current=temperature_2m,precipitation&daily=precipitation_sum,temperature_2m_max&timezone=UTC`;
    endpoints.push(endpoint);
    const json = await fetchJson(endpoint);
    if (json.current) {
      rows.push({
        country: country.name,
        iso3: country.iso3,
        time: json.current.time,
        temperatureC: json.current.temperature_2m,
        precipitationMm: json.current.precipitation,
        dailyPrecipitationSample: json.daily && json.daily.precipitation_sum ? json.daily.precipitation_sum.slice(0, 3) : []
      });
    }
  }
  return success("open-meteo", endpoints.join(" | "), rows, "Current values and short daily samples are prepared for starter-country coordinates.");
}

async function buildUsgsEarthquakes() {
  const endpoint = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson";
  const json = await fetchJson(endpoint);
  const features = Array.isArray(json.features) ? json.features : [];
  const rows = features.slice(0, 24).map(feature => ({
    id: feature.id,
    title: feature.properties && feature.properties.title,
    magnitude: feature.properties && feature.properties.mag,
    place: feature.properties && feature.properties.place,
    time: feature.properties && feature.properties.time ? new Date(feature.properties.time).toISOString() : null,
    url: feature.properties && feature.properties.url,
    coordinates: feature.geometry && feature.geometry.coordinates
  }));
  return success("usgs-earthquakes", endpoint, rows, "Recent magnitude 4.5+ earthquake features from the USGS GeoJSON feed.");
}

async function buildEmdat() {
  const endpoint = "https://data.humdata.org/api/3/action/package_search?q=EM-DAT&rows=1";
  const json = await fetchJson(endpoint);
  const results = json && json.result && Array.isArray(json.result.results) ? json.result.results : [];
  if (results.length) {
    const error = new Error("returned HDX package metadata only, not public aggregated EM-DAT data rows");
    error.endpoint = endpoint;
    throw error;
  }
  return success("emdat", endpoint, [], "Expected aggregated EM-DAT data rows.");
}

async function buildInform() {
  const endpoint = "https://drmkc.jrc.ec.europa.eu/inform-index/API/InformAPI/Countries";
  const json = await fetchJson(endpoint);
  const rows = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
  const valueRows = rows.filter(row => Object.keys(row).some(key => /risk|hazard|vulnerability|coping|score|index/i.test(key) && Number.isFinite(Number(row[key]))));
  if (!valueRows.length) {
    const error = new Error("returned location rows but no risk score or component values");
    error.endpoint = endpoint;
    throw error;
  }
  return success("inform", endpoint, valueRows, "Machine-readable INFORM rows with numeric risk or component values.");
}

const builders = [
  ["who-gho", buildWhoGho],
  ["hdx-hapi", buildHdxHapi],
  ["owid", buildOwid],
  ["faostat", buildFaostat],
  ["worldpop", buildWorldPop],
  ["reliefweb", buildReliefWeb],
  ["un-sdg", buildUnSdg],
  ["sdg6", buildSdg6],
  ["open-meteo", buildOpenMeteo],
  ["usgs-earthquakes", buildUsgsEarthquakes],
  ["emdat", buildEmdat],
  ["inform", buildInform]
];

async function writeSourceFile(result) {
  const file = `${result.slug}.json`;
  await fs.writeFile(path.join(OUT_DIR, file), JSON.stringify(result, null, 2));
  return file;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const successes = [];
  const failures = [];
  const attempted = [];

  for (const [slug, builder] of builders) {
    process.stdout.write(`Preparing ${slug}... `);
    let result;
    try {
      result = await builder();
      result.file = await writeSourceFile(result);
      successes.push({
        slug,
        name: result.name,
        file: result.file,
        status: result.status,
        rowCount: result.rowCount,
        retrievalTimestamp: result.retrievalTimestamp,
        endpoint: result.endpoint,
        site: result.site
      });
      console.log(`success (${result.rowCount} rows)`);
    } catch (error) {
      result = failure(slug, error.endpoint || "endpoint not reached before failure", error.message || String(error));
      result.file = await writeSourceFile(result);
      failures.push({
        slug,
        name: result.name,
        file: result.file,
        status: result.status,
        reason: result.failureReason,
        retrievalTimestamp: result.retrievalTimestamp,
        site: result.site
      });
      console.log(`failed: ${result.failureReason}`);
    }
    attempted.push({ slug, file: result.file, status: result.status });
  }

  const manifest = {
    generatedAt: now(),
    nodeRequirement: "Node 18+ with built-in fetch",
    summary: {
      attempted: attempted.length,
      successful: successes.length,
      failed: failures.length
    },
    successfulSources: successes,
    failedSources: failures,
    attemptedSources: attempted
  };
  await fs.writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Manifest written: ${successes.length} successful, ${failures.length} failed.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
