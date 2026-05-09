const MONTHS = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
};

function parseGuatemalaDate(str) {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^(\d{1,2})\.(\w{3})\.\.(\d{4})$/);
  if (!m) return trimmed;
  const [, day, monthAbbr, year] = m;
  const month = MONTHS[monthAbbr.toLowerCase()];
  if (!month) return trimmed;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

module.exports = { parseGuatemalaDate };
