const fs = require('fs');
const os = require('os');
const path = require('path');
const { bucketPath, appendRecord, scanScrapedIds } = require('../src/file-output');

describe('bucketPath', () => {
  test('places IDs in 10000-wide buckets', () => {
    expect(bucketPath(0, '/out')).toBe('/out/0-9999.json');
    expect(bucketPath(9999, '/out')).toBe('/out/0-9999.json');
    expect(bucketPath(10000, '/out')).toBe('/out/10000-19999.json');
    expect(bucketPath(7200000, '/out')).toBe('/out/7200000-7209999.json');
    expect(bucketPath(7209999, '/out')).toBe('/out/7200000-7209999.json');
    expect(bucketPath(7210000, '/out')).toBe('/out/7210000-7219999.json');
  });
});

describe('appendRecord + scanScrapedIds', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guatecompras-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('appends and reads back supplier records', async () => {
    const record = { supplier_id: 7200001, nit: '123', supplier_name: 'TEST', current_status: 'ACTIVE', sanctions: [] };
    appendRecord(bucketPath(7200001, tmpDir), record);

    const scraped = await scanScrapedIds(tmpDir, 7200000, 7209999);
    expect(scraped.has(7200001)).toBe(true);
    expect(scraped.has(7200002)).toBe(false);
  });

  test('tracks non-existent supplier sentinels', async () => {
    appendRecord(bucketPath(7200005, tmpDir), { supplier_id: 7200005, exists: false });

    const scraped = await scanScrapedIds(tmpDir, 7200000, 7209999);
    expect(scraped.has(7200005)).toBe(true);
  });

  test('returns empty set when no bucket files exist', async () => {
    const scraped = await scanScrapedIds(tmpDir, 5000000, 5009999);
    expect(scraped.size).toBe(0);
  });

  test('scans across multiple bucket files', async () => {
    appendRecord(bucketPath(9999, tmpDir), { supplier_id: 9999, exists: false });
    appendRecord(bucketPath(10000, tmpDir), { supplier_id: 10000, exists: false });

    const scraped = await scanScrapedIds(tmpDir, 9999, 10000);
    expect(scraped.has(9999)).toBe(true);
    expect(scraped.has(10000)).toBe(true);
  });

  test('skips malformed lines without throwing', async () => {
    const filePath = bucketPath(7200001, tmpDir);
    fs.writeFileSync(filePath, '{"supplier_id": 7200001, "exists": false}\nnot-valid-json\n{"supplier_id": 7200002, "exists": false}\n');

    const scraped = await scanScrapedIds(tmpDir, 7200000, 7209999);
    expect(scraped.has(7200001)).toBe(true);
    expect(scraped.has(7200002)).toBe(true);
  });

  test('appendRecord creates file if it does not exist', () => {
    const filePath = path.join(tmpDir, 'new-file.json');
    expect(fs.existsSync(filePath)).toBe(false);
    appendRecord(filePath, { supplier_id: 1, exists: false });
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('appendRecord appends to existing file', async () => {
    const filePath = bucketPath(1, tmpDir);
    appendRecord(filePath, { supplier_id: 1, exists: false });
    appendRecord(filePath, { supplier_id: 2, exists: false });

    const scraped = await scanScrapedIds(tmpDir, 0, 9999);
    expect(scraped.has(1)).toBe(true);
    expect(scraped.has(2)).toBe(true);
  });
});
