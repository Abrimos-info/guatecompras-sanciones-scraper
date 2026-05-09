const cheerio = require('cheerio');
const { parseGuatemalaDate } = require('./dates');

const DETAIL_BASE = 'https://www.guatecompras.gt/Inhabilitaciones/';

function parseMainPage(html, supplierId) {
  const $ = cheerio.load(html);

  const supplierLink = $('#MasterGC_ContentBlockHolder_lnkNombreProv');
  if (!supplierLink.length || !supplierLink.text().trim()) {
    return null;
  }

  const supplierText = supplierLink.text().trim();
  const nitMatch = supplierText.match(/^\((\d+)\)\s*-\s*(.+)$/);
  const nit = nitMatch ? nitMatch[1] : null;
  const supplierName = nitMatch ? nitMatch[2].trim() : supplierText;

  const currentStatus = $('td.EtiquetaForm2')
    .filter((_, el) => $(el).text().trim() === 'Situación actual:')
    .next('td')
    .text()
    .trim();

  const errorSpan = $('#MasterGC_ContentBlockHolder_lblError');
  if (errorSpan.hasClass('mensajePagina3')) {
    return {
      supplier_id: String(supplierId),
      nit,
      supplier_name: supplierName,
      current_status: currentStatus,
      sanctions: [],
    };
  }

  const sanctions = [];
  $('#MasterGC_ContentBlockHolder_dgResultado tr').not('.HeaderTablaDetalle').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length < 5) return;

    const startDateText = $(tds[0]).text().trim();
    const durationText = $(tds[1]).text().trim();
    const reason = $(tds[2]).text().trim();
    const sanctionLink = $(tds[3]).find('a');
    const sanctionNumber = sanctionLink.text().trim();
    const detailHref = sanctionLink.attr('href') || '';
    const detailUrl = new URL(detailHref.replace(/^\.\//, ''), DETAIL_BASE).href;
    const status = $(tds[4]).text().trim().toUpperCase();

    sanctions.push({
      start_date: parseGuatemalaDate(startDateText),
      duration: parseGuatemalaDate(durationText),
      reason,
      sanction_number: sanctionNumber,
      status,
      detail_url: detailUrl,
    });
  });

  return {
    supplier_id: String(supplierId),
    nit,
    supplier_name: supplierName,
    current_status: currentStatus,
    sanctions,
  };
}

module.exports = { parseMainPage };
