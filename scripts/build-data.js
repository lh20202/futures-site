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
    category: "Health and population",
    sourceType: "Prepared data",
    site: "https://www.who.int/data/gho",
    contains: "Health indicators across countries, including mortality and public health topics.",
    matters: "Health-system and mortality context can reveal baseline resilience and service pressure.",
    uses: "Prepared WHO life-expectancy records where direct browser fetch is unreliable.",
    description: "WHO Global Health Observatory is WHO's central health statistics repository. It contains health indicators across countries, including mortality, disease, health systems, public health and workforce topics. This site uses prepared WHO records where direct browser fetch is unreliable.",
    limitations: "Prepared from one confirmed WHO GHO indicator in this build; broader GHO themes were attempted through indicator probing but only records with usable numeric values are retained."
  },
  "hdx-hapi": {
    name: "HDX HAPI",
    category: "Displacement and humanitarian context",
    sourceType: "Prepared data",
    site: "https://hapi.humdata.org/",
    contains: "Standardised humanitarian indicators from HDX HAPI when anonymous access is accepted.",
    matters: "Common humanitarian rows can add needs, population and operational context.",
    uses: "No working rows are used unless the HAPI endpoint returns actual indicator rows.",
    description: "HDX HAPI provides standardised humanitarian indicators from the Humanitarian Data Exchange. This site uses it only where actual indicator rows are retrieved, not dataset listings.",
    limitations: "Anonymous request was tested; failure means no prepared HAPI rows are exposed as working data."
  },
  owid: {
    name: "Our World in Data",
    category: "Development and vulnerability",
    sourceType: "Prepared data",
    site: "https://ourworldindata.org/",
    contains: "Reusable country-level datasets and chart data on health, development, climate and access.",
    matters: "Broad social, health and climate indicators help frame humanitarian futures context.",
    uses: "Prepared country rows from selected OWID Grapher CSV endpoints.",
    description: "Our World in Data publishes reusable country-level datasets and chart data. This site uses selected OWID indicators as prepared data for social, health, climate, development and resilience context.",
    limitations: "Prepared sample is limited to selected Grapher indicators and starter countries."
  },
  faostat: {
    name: "FAOSTAT",
    category: "Development and vulnerability",
    sourceType: "Prepared data",
    site: "https://www.fao.org/faostat/",
    contains: "International food and agriculture statistics.",
    matters: "Food-system and agriculture indicators can reveal production and resource pressures.",
    uses: "No rows are used unless the public endpoint returns actual agriculture rows.",
    description: "FAOSTAT provides international food and agriculture statistics. This site uses selected public rows for food-system, agriculture and resource-risk context.",
    limitations: "Tested endpoint rejected unauthenticated access in this build."
  },
  worldpop: {
    name: "WorldPop",
    category: "Health and population",
    sourceType: "Prepared data",
    site: "https://www.worldpop.org/",
    contains: "Open spatial demographic data and population estimates.",
    matters: "Population exposure and planning questions need demographic context beyond national totals.",
    uses: "Prepared population estimates for small sample areas around starter-country coordinates.",
    description: "WorldPop provides open spatial demographic data. This site uses prepared WorldPop data where useful population values can be retrieved for exposure, planning and preparedness context.",
    limitations: "Values are sample-area estimates, not national totals."
  },
  reliefweb: {
    name: "ReliefWeb",
    category: "Displacement and humanitarian context",
    sourceType: "Prepared data",
    site: "https://reliefweb.int/",
    contains: "Humanitarian reports, disaster records and crisis information.",
    matters: "Recent reporting can add situational awareness to numeric indicators.",
    uses: "No records are used unless the API accepts a no-secret request and returns reports.",
    description: "ReliefWeb provides humanitarian reports, disaster records and crisis information. This site uses selected records to add recent humanitarian situation context.",
    limitations: "ReliefWeb requires an approved app name parameter; this static prototype does not place app identifiers in source code."
  },
  "un-sdg": {
    name: "UN SDG API",
    category: "Development and vulnerability",
    sourceType: "Prepared data",
    site: "https://unstats.un.org/sdgs/dataportal",
    contains: "Official Sustainable Development Goal indicator data.",
    matters: "SDG indicators describe poverty, health, water, energy, climate and institutional resilience.",
    uses: "Prepared SDG poverty indicator rows for starter countries where values are returned.",
    description: "The UN SDG API provides official Sustainable Development Goal data reported through the global SDG indicator framework. This site uses selected SDG records for development, resilience and preparedness context.",
    limitations: "Prepared sample uses selected indicators and starter countries with returned values."
  },
  sdg6: {
    name: "SDG6 Data",
    category: "Development and vulnerability",
    sourceType: "Prepared data",
    site: "https://www.sdg6data.org/",
    contains: "Water, sanitation and hygiene indicators.",
    matters: "WASH indicators are central to public health and resilience context.",
    uses: "No records are used unless a no-secret API route returns WASH data rows.",
    description: "SDG6 Data provides water, sanitation and hygiene indicators. This site uses selected records to support WASH, public health and resilience context.",
    limitations: "Tested route returned a 4xx HTML page rather than usable JSON rows."
  },
  "open-meteo": {
    name: "Open-Meteo",
    category: "Climate and environmental stress",
    sourceType: "Prepared data",
    site: "https://open-meteo.com/",
    contains: "No-key weather and historical weather values.",
    matters: "Recent weather and precipitation context can help frame environmental stress and preparedness.",
    uses: "Prepared current and daily weather values for starter-country coordinates.",
    description: "Open-Meteo provides no-key weather and historical weather data. This site uses selected climate and weather values for environmental stress and preparedness context.",
    limitations: "Prepared sample uses capital-area coordinates, not national gridded coverage."
  },
  "usgs-earthquakes": {
    name: "USGS Earthquake API",
    category: "Disaster and hazard history",
    sourceType: "Prepared data",
    site: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php",
    contains: "Recent earthquake event records as GeoJSON.",
    matters: "Seismic event records add current hazard monitoring context.",
    uses: "Prepared recent magnitude 4.5+ earthquake events.",
    description: "USGS Earthquake API provides recent and historical earthquake event records. This site uses selected events for seismic hazard and disaster context.",
    limitations: "Prepared sample is a recent global feed and is not country-filtered."
  },
  emdat: {
    name: "EM-DAT International Disaster Database",
    category: "Disaster and hazard history",
    sourceType: "Local prepared data",
    site: "https://www.emdat.be/",
    contains: "Major disaster events and impacts by country, year and hazard type.",
    matters: "Historical disaster patterns help users understand exposure, repeated shocks and previously recorded impacts.",
    uses: "Aggregated disaster-history summaries prepared from a local EM-DAT download.",
    description: "EM-DAT is an international disaster database maintained by CRED/UCLouvain. This site uses locally prepared summaries to add disaster-history context.",
    limitations: "The raw EM-DAT download is not committed. The public site uses aggregated summaries only."
  },
  inform: {
    name: "INFORM Risk Index",
    category: "Development and vulnerability",
    sourceType: "Prepared data",
    site: "https://drmkc.jrc.ec.europa.eu/inform-index",
    contains: "Comparative crisis and disaster risk indicators where public machine-readable values are available.",
    matters: "Risk values can help compare vulnerability and coping-capacity context.",
    uses: "No values are used unless a public machine-readable route returns actual INFORM values.",
    description: "INFORM Risk Index provides comparative crisis and disaster risk indicators. This site uses INFORM values where a public machine-readable route returns actual risk data.",
    limitations: "No stable no-secret JSON value endpoint was confirmed in this build."
  },
  "nasa-power": {
    name: "NASA POWER",
    category: "Climate and environmental stress",
    sourceType: "Prepared data",
    site: "https://power.larc.nasa.gov/",
    contains: "NASA meteorological and solar data for coordinates.",
    matters: "Temperature and precipitation records add environmental stress context.",
    uses: "Prepared short daily temperature and precipitation samples for starter-country coordinates.",
    description: "NASA POWER provides browser-independent no-key meteorological values. This site uses short coordinate samples as climate and environmental context.",
    limitations: "Prepared samples use capital-area coordinates and a short date window."
  },
  "ifrc-go": {
    name: "IFRC GO",
    category: "Displacement and humanitarian context",
    sourceType: "Prepared data",
    site: "https://go.ifrc.org/",
    contains: "IFRC event records and emergency-response information.",
    matters: "Recent event records add operational and humanitarian context.",
    uses: "Prepared event identifiers, names, dates and public URLs only.",
    description: "IFRC GO provides event and emergency-response records. This site stores concise public event fields and excludes contact details from prepared output.",
    limitations: "Prepared rows are recent global event samples and are not country-filtered in this build."
  },
  geoboundaries: {
    name: "geoBoundaries",
    category: "Development and vulnerability",
    sourceType: "Prepared data",
    site: "https://www.geoboundaries.org/",
    contains: "Open administrative-boundary metadata and downloads.",
    matters: "Administrative boundary coverage helps locate and compare subnational data when paired with other indicators.",
    uses: "Prepared boundary metadata and official download links for starter countries.",
    description: "geoBoundaries publishes open administrative boundaries. This site uses metadata and download links to document useful geographic context.",
    limitations: "Boundary metadata is not a humanitarian indicator and is not projected."
  },
  "imf-datamapper": {
    name: "IMF DataMapper",
    category: "Conflict, economic and operational context",
    sourceType: "Prepared data",
    site: "https://www.imf.org/external/datamapper/",
    contains: "IMF country-level macroeconomic indicators.",
    matters: "Economic growth context can affect fiscal space, vulnerability and operational conditions.",
    uses: "Prepared real GDP growth values for starter countries where returned by the public endpoint.",
    description: "IMF DataMapper provides public macroeconomic indicator values. This site uses selected GDP-growth values as economic context.",
    limitations: "Prepared sample uses one IMF indicator and starter-country rows."
  },
  gdelt: {
    name: "GDELT",
    category: "Conflict, economic and operational context",
    sourceType: "Prepared data",
    site: "https://www.gdeltproject.org/",
    contains: "Global news and event-monitoring records.",
    matters: "Returned public articles can add broad situational context.",
    uses: "Prepared article titles, domains, dates and URLs when the no-key endpoint responds.",
    description: "GDELT monitors global media and event signals. This site uses concise public article metadata only where the endpoint returns records.",
    limitations: "Media records are context signals, not verified incident counts."
  },
  ucdp: {
    name: "UCDP",
    category: "Conflict, economic and operational context",
    sourceType: "Prepared data",
    site: "https://ucdp.uu.se/",
    contains: "Conflict event and conflict data resources.",
    matters: "Conflict-event data can add violence and insecurity context when available without credentials.",
    uses: "No rows are used unless a no-secret endpoint returns actual conflict rows.",
    description: "UCDP provides conflict event and conflict data. This build tests only no-secret access routes.",
    limitations: "The tested API route requires an access token, so no rows are exposed as working data."
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
  const file = path.join(OUT_DIR, "emdat.json");
  const text = await fs.readFile(file, "utf8");
  const data = JSON.parse(text);
  const byCountry = data.aggregates && Array.isArray(data.aggregates.byCountry) ? data.aggregates.byCountry : [];
  if (data.status !== "success" || !byCountry.length) {
    const error = new Error("local EM-DAT aggregate file exists but does not contain usable country aggregates");
    error.endpoint = "data/prepared/emdat.json";
    throw error;
  }
  return {
    slug: "emdat",
    ...sourceInfo.emdat,
    status: "success",
    retrievalTimestamp: data.generatedAt || now(),
    endpoint: "data/prepared/emdat.json",
    rowCount: data.rowsProcessed || byCountry.length,
    sampleRows: byCountry.slice(0, 5),
    fieldNotes: data.citationNote,
    localPreparedFile: "emdat.json"
  };
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

async function buildNasaPower() {
  const rows = [];
  const endpoints = [];
  for (const country of countries.slice(0, 4)) {
    const endpoint = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR&community=RE&longitude=${country.lon}&latitude=${country.lat}&start=20260101&end=20260107&format=JSON`;
    endpoints.push(endpoint);
    const json = await fetchJson(endpoint);
    const parameters = json && json.properties && json.properties.parameter ? json.properties.parameter : {};
    const t2m = parameters.T2M || {};
    const precip = parameters.PRECTOTCORR || {};
    const dates = Object.keys(t2m).slice(0, 7);
    dates.forEach(date => {
      rows.push({
        country: country.name,
        iso3: country.iso3,
        date,
        temperatureC: Number(t2m[date]),
        precipitationMm: Number(precip[date]),
        latitude: country.lat,
        longitude: country.lon
      });
    });
  }
  return success("nasa-power", endpoints.join(" | "), rows, "Daily T2M and PRECTOTCORR values from NASA POWER for starter-country coordinates.");
}

async function buildIfrcGo() {
  const endpoint = "https://goadmin.ifrc.org/api/v2/event/?limit=20";
  const json = await fetchJson(endpoint);
  const records = Array.isArray(json.results) ? json.results : Array.isArray(json.data) ? json.data : [];
  const rows = records.slice(0, 20).map(item => ({
    id: item.id,
    name: item.name,
    eventType: item.dtype && item.dtype.name ? item.dtype.name : item.dtype_name,
    disasterType: item.disaster_type && item.disaster_type.name ? item.disaster_type.name : item.disaster_type_name,
    startDate: item.start_date,
    endDate: item.end_date,
    countries: Array.isArray(item.countries) ? item.countries.map(country => country.name || country.iso3 || country.iso).filter(Boolean).slice(0, 8) : [],
    publicUrl: item.ifrc_severity_level_display ? `https://go.ifrc.org/emergencies/${item.id}` : `https://go.ifrc.org/emergencies/${item.id}`
  }));
  return success("ifrc-go", endpoint, rows, "Prepared output keeps event identifiers, names, dates, countries and public URLs only.");
}

async function buildGeoBoundaries() {
  const rows = [];
  const endpoints = [];
  for (const country of countries.slice(0, 4)) {
    const endpoint = `https://www.geoboundaries.org/api/current/gbOpen/${country.iso3}/ADM1/`;
    endpoints.push(endpoint);
    const json = await fetchJson(endpoint);
    rows.push({
      country: country.name,
      iso3: country.iso3,
      boundaryType: json.boundaryType,
      boundaryName: json.boundaryName,
      boundaryYearRepresented: json.boundaryYearRepresented,
      admUnitCount: json.admUnitCount,
      license: json.licenseDetail,
      downloadUrl: json.gjDownloadURL,
      sourceDataUpdateDate: json.sourceDataUpdateDate
    });
  }
  return success("geoboundaries", endpoints.join(" | "), rows, "ADM1 metadata and official GeoJSON download links from geoBoundaries.");
}

async function buildImfDataMapper() {
  const endpoint = "https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH?periods=2024,2025,2026";
  const json = await fetchJson(endpoint);
  const values = json && json.values && json.values.NGDP_RPCH ? json.values.NGDP_RPCH : {};
  const rows = [];
  countries.forEach(country => {
    const series = values[country.iso3] || {};
    Object.keys(series).sort().forEach(year => {
      const value = Number(series[year]);
      if (Number.isFinite(value)) {
        rows.push({
          country: country.name,
          iso3: country.iso3,
          indicator: "Real GDP growth",
          year: Number(year),
          value,
          unit: "annual percent change"
        });
      }
    });
  });
  return success("imf-datamapper", endpoint, rows, "NGDP_RPCH values returned by IMF DataMapper for starter countries.");
}

async function buildGdelt() {
  const endpoint = "https://api.gdeltproject.org/api/v2/doc/doc?query=humanitarian&mode=artlist&format=json&maxrecords=10";
  const json = await fetchJson(endpoint, { timeoutMs: 18000 });
  const articles = Array.isArray(json.articles) ? json.articles : [];
  const rows = articles.slice(0, 10).map(article => ({
    title: article.title,
    url: article.url,
    domain: article.domain,
    sourceCountry: article.sourcecountry,
    seenDate: article.seendate,
    language: article.language
  }));
  return success("gdelt", endpoint, rows, "Prepared article metadata returned by GDELT.");
}

async function buildUcdp() {
  const endpoint = "https://ucdpapi.pcr.uu.se/api/gedevents/23.1?pagesize=5";
  const json = await fetchJson(endpoint);
  const rows = Array.isArray(json.Result) ? json.Result : Array.isArray(json.result) ? json.result : Array.isArray(json) ? json : [];
  return success("ucdp", endpoint, rows, "Expected conflict event rows from UCDP.");
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
  ["inform", buildInform],
  ["nasa-power", buildNasaPower],
  ["ifrc-go", buildIfrcGo],
  ["geoboundaries", buildGeoBoundaries],
  ["imf-datamapper", buildImfDataMapper],
  ["gdelt", buildGdelt],
  ["ucdp", buildUcdp]
];

async function writeSourceFile(result) {
  if (result.localPreparedFile) return result.localPreparedFile;
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
        category: result.category,
        sourceType: result.sourceType,
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
        category: result.category,
        sourceType: result.sourceType,
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
