#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const xlsx = require("xlsx");

const SOURCE_FILE = path.join(__dirname, "..", "data", "private", "public_emdat_2026-05-28.xlsx");
const OUT_FILE = path.join(__dirname, "..", "data", "prepared", "emdat.json");
const SHEET_NAME = "EM-DAT Data";

function numberValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function textValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function yearValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function addTotals(target, row) {
  target.eventCount += 1;
  target.totalDeaths += numberValue(row["Total Deaths"]);
  target.totalInjured += numberValue(row["No. Injured"]);
  target.totalAffected += numberValue(row["Total Affected"]);
  target.totalHomeless += numberValue(row["No. Homeless"]);
  target.totalDamageUsd000 += numberValue(row["Total Damage ('000 US$)"]);
}

function topTypes(typeCounts, limit = 5) {
  return [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([type, count]) => ({ disasterType: type || "Not recorded", count }));
}

function roundTotals(row) {
  ["totalDeaths", "totalInjured", "totalAffected", "totalHomeless", "totalDamageUsd000"].forEach(key => {
    if (row[key] !== undefined) row[key] = Math.round(row[key]);
  });
  return row;
}

async function main() {
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });

  let workbook;
  try {
    workbook = xlsx.readFile(SOURCE_FILE, { cellDates: false });
  } catch (error) {
    throw new Error(`Could not read ${SOURCE_FILE}: ${error.message}`);
  }

  const worksheet = workbook.Sheets[SHEET_NAME];
  if (!worksheet) throw new Error(`Sheet not found: ${SHEET_NAME}`);

  const rows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  const byCountry = new Map();
  const byCountryYear = new Map();
  const byDisasterType = new Map();

  rows.forEach(row => {
    const country = textValue(row.Country) || "Not recorded";
    const iso = textValue(row.ISO);
    const region = textValue(row.Region);
    const subregion = textValue(row.Subregion);
    const year = yearValue(row["Start Year"]);
    const disasterGroup = textValue(row["Disaster Group"]);
    const disasterSubgroup = textValue(row["Disaster Subgroup"]);
    const disasterType = textValue(row["Disaster Type"]);

    if (!byCountry.has(country)) {
      byCountry.set(country, {
        country,
        iso,
        region,
        subregion,
        eventCount: 0,
        totalDeaths: 0,
        totalInjured: 0,
        totalAffected: 0,
        totalHomeless: 0,
        totalDamageUsd000: 0,
        firstYear: year,
        lastYear: year,
        typeCounts: new Map()
      });
    }
    const countryRow = byCountry.get(country);
    addTotals(countryRow, row);
    if (year !== null) {
      countryRow.firstYear = countryRow.firstYear === null || countryRow.firstYear === undefined ? year : Math.min(countryRow.firstYear, year);
      countryRow.lastYear = countryRow.lastYear === null || countryRow.lastYear === undefined ? year : Math.max(countryRow.lastYear, year);
    }
    countryRow.typeCounts.set(disasterType, (countryRow.typeCounts.get(disasterType) || 0) + 1);

    if (year !== null) {
      const cyKey = `${country}|${iso}|${year}`;
      if (!byCountryYear.has(cyKey)) {
        byCountryYear.set(cyKey, {
          country,
          iso,
          year,
          eventCount: 0,
          totalDeaths: 0,
          totalInjured: 0,
          totalAffected: 0,
          totalHomeless: 0,
          totalDamageUsd000: 0,
          typeCounts: new Map()
        });
      }
      const cyRow = byCountryYear.get(cyKey);
      addTotals(cyRow, row);
      cyRow.typeCounts.set(disasterType, (cyRow.typeCounts.get(disasterType) || 0) + 1);
    }

    const typeKey = `${disasterGroup}|${disasterSubgroup}|${disasterType}`;
    if (!byDisasterType.has(typeKey)) {
      byDisasterType.set(typeKey, {
        disasterGroup,
        disasterSubgroup,
        disasterType,
        eventCount: 0,
        totalDeaths: 0,
        totalAffected: 0,
        totalDamageUsd000: 0
      });
    }
    const typeRow = byDisasterType.get(typeKey);
    typeRow.eventCount += 1;
    typeRow.totalDeaths += numberValue(row["Total Deaths"]);
    typeRow.totalAffected += numberValue(row["Total Affected"]);
    typeRow.totalDamageUsd000 += numberValue(row["Total Damage ('000 US$)"]);
  });

  const output = {
    id: "emdat",
    name: "EM-DAT International Disaster Database",
    status: "success",
    sourceType: "Local prepared data",
    sourceFile: "data/private/public_emdat_2026-05-28.xlsx",
    generatedAt: new Date().toISOString(),
    rowsProcessed: rows.length,
    description: "EM-DAT is an international disaster database maintained by CRED/UCLouvain. It records major disaster events and their impacts, including deaths, people affected and economic damage. This simulator uses locally prepared summaries to add disaster-history context.",
    whatItContains: "Disaster events by country, year and hazard type, including impact measures such as deaths, affected people and economic damage where reported.",
    whyItMatters: "Historical disaster patterns help users understand exposure, repeated shocks and the kinds of hazards that have previously caused major impacts.",
    whatThisSiteUses: "Aggregated disaster counts and impacts by country, year and disaster type. The raw EM-DAT download stays outside the public site.",
    citationNote: "Use of EM-DAT data is subject to EM-DAT terms and citation requirements. The site uses aggregated summaries and does not publish the raw downloaded table.",
    aggregates: {
      byCountry: [...byCountry.values()]
        .map(row => roundTotals({
          country: row.country,
          iso: row.iso,
          region: row.region,
          subregion: row.subregion,
          eventCount: row.eventCount,
          totalDeaths: row.totalDeaths,
          totalInjured: row.totalInjured,
          totalAffected: row.totalAffected,
          totalHomeless: row.totalHomeless,
          totalDamageUsd000: row.totalDamageUsd000,
          firstYear: row.firstYear,
          lastYear: row.lastYear,
          topDisasterTypes: topTypes(row.typeCounts)
        }))
        .sort((a, b) => b.eventCount - a.eventCount),
      byCountryYear: [...byCountryYear.values()]
        .map(row => roundTotals({
          country: row.country,
          iso: row.iso,
          year: row.year,
          eventCount: row.eventCount,
          totalDeaths: row.totalDeaths,
          totalAffected: row.totalAffected,
          totalDamageUsd000: row.totalDamageUsd000,
          topDisasterType: topTypes(row.typeCounts, 1)[0]?.disasterType || "Not recorded"
        }))
        .sort((a, b) => b.year - a.year || a.country.localeCompare(b.country)),
      byDisasterType: [...byDisasterType.values()]
        .map(row => roundTotals(row))
        .sort((a, b) => b.eventCount - a.eventCount),
      recentEvents: rows
        .slice()
        .sort((a, b) => (yearValue(b["Start Year"]) || 0) - (yearValue(a["Start Year"]) || 0))
        .slice(0, 500)
        .map(row => ({
          disNo: textValue(row["DisNo."]),
          country: textValue(row.Country),
          iso: textValue(row.ISO),
          region: textValue(row.Region),
          year: yearValue(row["Start Year"]),
          disasterGroup: textValue(row["Disaster Group"]),
          disasterType: textValue(row["Disaster Type"]),
          disasterSubtype: textValue(row["Disaster Subtype"]),
          eventName: textValue(row["Event Name"]),
          location: textValue(row.Location),
          totalDeaths: numberValue(row["Total Deaths"]),
          totalAffected: numberValue(row["Total Affected"]),
          totalDamageUsd000: numberValue(row["Total Damage ('000 US$)"])
        }))
    },
    sample: {}
  };

  output.sample = {
    byCountry: output.aggregates.byCountry.slice(0, 5),
    byCountryYear: output.aggregates.byCountryYear.slice(0, 5),
    byDisasterType: output.aggregates.byDisasterType.slice(0, 5),
    recentEvents: output.aggregates.recentEvents.slice(0, 5)
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUT_FILE}`);
  console.log(`Rows processed: ${rows.length}`);
  console.log(`Countries: ${output.aggregates.byCountry.length}`);
  console.log(`Country-year rows: ${output.aggregates.byCountryYear.length}`);
  console.log(`Disaster types: ${output.aggregates.byDisasterType.length}`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
