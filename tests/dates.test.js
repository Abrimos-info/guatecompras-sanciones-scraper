const { parseGuatemalaDate } = require('../src/dates');

describe('parseGuatemalaDate', () => {
  test('parses a standard date', () => {
    expect(parseGuatemalaDate('05.nov..2020')).toBe('2020-11-05');
  });

  test('parses single-digit day with zero-padding', () => {
    expect(parseGuatemalaDate('01.ene..2024')).toBe('2024-01-01');
  });

  test('parses all 12 month abbreviations', () => {
    const cases = [
      ['01.ene..2000', '2000-01-01'],
      ['01.feb..2000', '2000-02-01'],
      ['01.mar..2000', '2000-03-01'],
      ['01.abr..2000', '2000-04-01'],
      ['01.may..2000', '2000-05-01'],
      ['01.jun..2000', '2000-06-01'],
      ['01.jul..2000', '2000-07-01'],
      ['01.ago..2000', '2000-08-01'],
      ['01.sep..2000', '2000-09-01'],
      ['01.oct..2000', '2000-10-01'],
      ['01.nov..2000', '2000-11-01'],
      ['01.dic..2000', '2000-12-01'],
    ];
    cases.forEach(([input, expected]) => {
      expect(parseGuatemalaDate(input)).toBe(expected);
    });
  });

  test('returns text as-is when not a date', () => {
    const text = 'Hasta que se cancele la deuda';
    expect(parseGuatemalaDate(text)).toBe(text);
  });

  test('returns null for null input', () => {
    expect(parseGuatemalaDate(null)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(parseGuatemalaDate('')).toBeNull();
  });

  test('parses end-of-year date correctly', () => {
    expect(parseGuatemalaDate('31.dic..2023')).toBe('2023-12-31');
  });
});
