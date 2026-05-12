const fs = require('fs');
const path = require('path');
const { parseMainPage } = require('../src/parse-main');

function fixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
}

describe('parseMainPage — with sanctions', () => {
  let result;
  beforeAll(() => {
    result = parseMainPage(fixture('main-with-sanctions.html'), 491);
  });

  test('extracts supplier_id as string', () => {
    expect(result.supplier_id).toBe('491');
  });

  test('extracts nit', () => {
    expect(result.nit).toBe('359815');
  });

  test('extracts supplier_name without NIT', () => {
    expect(result.supplier_name).toBe('DROGUERIA COLON SOCIEDAD ANONIMA');
  });

  test('extracts current_status', () => {
    expect(result.current_status).toBe('Habilitado');
  });

  test('returns 2 sanctions', () => {
    expect(result.sanctions).toHaveLength(2);
  });

  test('parses start_date as ISO date', () => {
    expect(result.sanctions[0].start_date).toBe('2020-11-05');
  });

  test('parses duration as ISO date when it is a date', () => {
    expect(result.sanctions[0].duration).toBe('2022-11-05');
  });

  test('returns duration as plain text when it is not a date', () => {
    expect(result.sanctions[1].duration).toBe('Hasta cancelación de deuda');
  });

  test('extracts reason', () => {
    expect(result.sanctions[0].reason).toBe('Incumplimiento de Contrato');
  });

  test('extracts sanction_number', () => {
    expect(result.sanctions[0].sanction_number).toBe('C3788180');
  });

  test('extracts status in uppercase', () => {
    expect(result.sanctions[0].status).toBe('NO VIGENTE');
  });

  test('normalizes mixed-case status to uppercase', () => {
    expect(result.sanctions[1].status).toBe('VIGENTE');
  });

  test('includes detail_url as absolute URL', () => {
    expect(result.sanctions[0].detail_url).toBe(
      'https://www.guatecompras.gt/Inhabilitaciones/DetalleInhabilitacion.aspx?oRlt=20&linb=3788180&inhab=0&inhab=1&iTipo=16&rqp=10&lprv=491'
    );
  });
});

describe('parseMainPage — no sanctions', () => {
  let result;
  beforeAll(() => {
    result = parseMainPage(fixture('main-no-sanctions.html'), 8021534);
  });

  test('returns supplier data', () => {
    expect(result).not.toBeNull();
  });

  test('returns empty sanctions array', () => {
    expect(result.sanctions).toEqual([]);
  });

  test('extracts nit', () => {
    expect(result.nit).toBe('96301147');
  });
});

describe('parseMainPage — non-existent supplier', () => {
  test('returns null', () => {
    expect(parseMainPage(fixture('main-no-supplier.html'), 9999999)).toBeNull();
  });
});

describe('parseMainPage — NIT ending in K', () => {
  const html = `<html><body>
    <a id="MasterGC_ContentBlockHolder_lnkNombreProv">(10296209K) - RAMIREZ,GUTIERREZ,,NANCY,MARIA JOSE</a>
    <table><tr><td class="EtiquetaForm2">Situación actual:</td><td>Habilitado</td></tr></table>
    <span id="MasterGC_ContentBlockHolder_lblError" class="mensajePagina3"></span>
  </body></html>`;

  let result;
  beforeAll(() => { result = parseMainPage(html, 10296209); });

  test('extracts NIT including trailing K', () => {
    expect(result.nit).toBe('10296209K');
  });

  test('extracts supplier name without NIT prefix', () => {
    expect(result.supplier_name).toBe('RAMIREZ,GUTIERREZ,,NANCY,MARIA JOSE');
  });
});
