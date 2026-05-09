const { fetchPage, randomDelay } = require('./scraper');
const { parseMainPage } = require('./parse-main');
const { parseDetailPage } = require('./parse-detail');

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

module.exports = { scrapeSupplier, scrapeRange };
