const fs = require('fs');
const path = require('path');
const { parseDetailPage } = require('../src/parse-detail');

function fixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
}

describe('parseDetailPage — available', () => {
  let result;
  beforeAll(() => {
    result = parseDetailPage(fixture('detail-available.html'));
  });

  test('sets detail_available to true', () => {
    expect(result.detail_available).toBe(true);
  });

  test('extracts applying_entity', () => {
    expect(result.applying_entity).toBe('MINISTERIO DE SALUD PUBLICA Y ASISTENCIA SOCIAL');
  });

  test('maps [--No Especificado--] to null', () => {
    expect(result.procedure_number).toBeNull();
    expect(result.nog).toBeNull();
  });

  test('extracts legal_basis', () => {
    expect(result.legal_basis).toBe('Artículo 80 del Decreto 57-92');
  });

  test('extracts reason', () => {
    expect(result.reason).toBe('Incumplimiento de Contrato');
  });

  test('extracts triggering_action', () => {
    expect(result.triggering_action).toBe('No entregó los bienes contratados');
  });

  test('parses duration as ISO date', () => {
    expect(result.duration).toBe('2022-11-05');
  });

  test('parses start_date as ISO date', () => {
    expect(result.start_date).toBe('2020-11-05');
  });

  test('parses end_date as ISO date', () => {
    expect(result.end_date).toBe('2022-11-04');
  });

  test('extracts status', () => {
    expect(result.status).toBe('NO VIGENTE');
  });

  test('does not include supplier name or nit (they are skipped)', () => {
    expect(result).not.toHaveProperty('supplier_name');
    expect(result).not.toHaveProperty('nit');
    expect(result).not.toHaveProperty('sanction_id');
  });
});

describe('parseDetailPage — unavailable', () => {
  let result;
  beforeAll(() => {
    result = parseDetailPage(fixture('detail-unavailable.html'));
  });

  test('sets detail_available to false', () => {
    expect(result.detail_available).toBe(false);
  });

  test('returns only the detail_available flag', () => {
    expect(Object.keys(result)).toEqual(['detail_available']);
  });
});
