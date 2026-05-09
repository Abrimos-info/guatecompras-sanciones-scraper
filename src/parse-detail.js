const cheerio = require('cheerio');
const { parseGuatemalaDate } = require('./dates');

const FIELD_MAP = {
  'NÚMERO de la inhabilitación': null,
  'ENTIDAD que aplicó la inhabilitación': 'applying_entity',
  'Número de EXPEDIENTE en la entidad que aplicó la inhabilitación': 'procedure_number',
  'BASE LEGAL de la inhabilitación': 'legal_basis',
  'Nombre o razón social del PROVEEDOR inhabilitado': null,
  'NIT del PROVEEDOR': null,
  'MOTIVO de la inhabilitación': 'reason',
  'HECHO que provocó la inhabilitación': 'triggering_action',
  'NOG relacionado con la inhabilitación': 'nog',
  'DURACIÓN de la inhabilitación': 'duration',
  'INICIO de la inhabilitación': 'start_date',
  'FINALIZACIÓN de la inhabilitación (último día de vigencia)': 'end_date',
  'ESTATUS de la inhabilitación': 'status',
};

const DATE_FIELDS = new Set(['duration', 'start_date', 'end_date']);

function parseDetailPage(html) {
  const $ = cheerio.load(html);

  const errorEl = $('#MasterGC_ContentBlockHolder_lblError');
  if (errorEl.length && errorEl.text().includes('Fuente de datos no disponible')) {
    return { detail_available: false };
  }

  const result = { detail_available: true };

  $('table.TablaForm3vTop tr').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length < 2) return;
    const label = $(tds[0]).text().trim();
    const fieldName = FIELD_MAP[label];
    if (fieldName === undefined || fieldName === null) return;
    const rawValue = $(tds[1]).text().trim();
    const value = rawValue === '[--No Especificado--]' ? null : rawValue;
    const finalValue = fieldName === 'status' && value !== null ? value.toUpperCase() : value;
    result[fieldName] = finalValue !== null && DATE_FIELDS.has(fieldName)
      ? parseGuatemalaDate(finalValue)
      : finalValue;
  });

  return result;
}

module.exports = { parseDetailPage };
