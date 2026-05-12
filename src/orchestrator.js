const fs = require('fs');
const path = require('path');
const { fetchPage, randomDelay } = require('./scraper');
const { parseMainPage } = require('./parse-main');
const { parseDetailPage } = require('./parse-detail');
const { bucketPath, appendRecord, scanScrapedIds } = require('./file-output');

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  process.stdout.write(`[${ts}] ${msg}\n`);
}

function logStart(msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  process.stdout.write(`[${ts}] ${msg}`);
}

const MAIN_URL = 'https://www.guatecompras.gt/Inhabilitaciones/consultaDetProveeInhab.aspx?inhab=1&iTipo=16&rqp=10&lprv=';

async function scrapeSupplier(id, { delay = false } = {}) {
  if (delay) await randomDelay();
  const html = await fetchPage(`${MAIN_URL}${id}`);
  const data = parseMainPage(html, id);
  if (!data) return null;

  const enrichedSanctions = [];
  for (const sanction of data.sanctions) {
    const { detail_url, ...base } = sanction;
    let detail = { detail_available: false };
    try {
      await randomDelay();
      const detailHtml = await fetchPage(detail_url);
      detail = parseDetailPage(detailHtml);
    } catch {
      // network error fetching detail: mark as unavailable
    }
    enrichedSanctions.push({ ...base, ...detail });
  }

  return {
    supplier_id: data.supplier_id,
    nit: data.nit,
    supplier_name: data.supplier_name,
    current_status: data.current_status,
    sanctions: enrichedSanctions,
  };
}

async function scrapeRange(start, end) {
  for (let id = start; id <= end; id++) {
    try {
      const result = await scrapeSupplier(id, { delay: true });
      if (result) process.stdout.write(JSON.stringify(result) + '\n');
    } catch (err) {
      process.stderr.write(`Warning: ID ${id} failed: ${err.message}\n`);
    }
  }
}

async function scrapeRangeToDir(start, end, dir) {
  fs.mkdirSync(dir, { recursive: true });

  log(`Scanning ${dir} for already-scraped IDs in range ${start}–${end}...`);
  const scraped = await scanScrapedIds(dir, start, end);
  const skipCount = [...scraped].filter(id => id >= start && id <= end).length;
  log(`Found ${skipCount} already-scraped ID(s) in range — will skip them`);

  const total = end - start + 1;
  let done = 0;

  for (let id = start; id <= end; id++) {
    done++;
    const progress = `[${done}/${total}] ID ${id}`;

    if (scraped.has(id)) {
      log(`${progress}: already scraped, skipping`);
      continue;
    }

    logStart(`${progress}: `);
    try {
      const result = await scrapeSupplier(id, { delay: true });
      const file = bucketPath(id, dir);

      if (result) {
        appendRecord(file, result);
        process.stdout.write(`"${result.supplier_name}" (${result.sanctions.length} sanctions) → ${path.basename(file)}\n`);
      } else {
        appendRecord(file, { supplier_id: id, exists: false });
        process.stdout.write(`no supplier → tracked in ${path.basename(file)}\n`);
      }
    } catch (err) {
      const status = err.response?.status;
      const blockHint = (status === 429 || status === 503) ? ' — possible block' : '';
      process.stdout.write(`ERROR${status ? ` HTTP ${status}` : ''}: ${err.message}${blockHint}\n`);
    }
  }

  log(`Done. Scraped ${done - skipCount} new IDs out of ${total} requested.`);
}

module.exports = { scrapeSupplier, scrapeRange, scrapeRangeToDir };
