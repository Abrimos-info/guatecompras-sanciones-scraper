'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NIT_RE = /^\((\d+K?|\d{2,3}-[^)]+)\)\s*-\s*(.+)$/;

function localTimestamp(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function fixRecord(record, fileMtime) {
  let changed = false;

  if (record.nit === null && typeof record.supplier_name === 'string') {
    const m = record.supplier_name.match(NIT_RE);
    if (m) {
      record.nit = m[1];
      record.supplier_name = m[2].trim();
      changed = true;
    }
  }

  if (record.scraped_at === undefined) {
    record.scraped_at = fileMtime;
    changed = true;
  }

  return changed;
}

async function processFile(filePath, fileMtime) {
  const tmpPath = filePath + '.tmp';
  const out = fs.createWriteStream(tmpPath);
  const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });

  let fixedSa = 0;
  let fixedNit = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const record = JSON.parse(trimmed);
    const hadSa = record.scraped_at !== undefined;
    const hadNit = record.nit !== null;

    fixRecord(record, fileMtime);

    if (!hadSa && record.scraped_at !== undefined) fixedSa++;
    if (!hadNit && record.nit !== null) fixedNit++;

    out.write(JSON.stringify(record) + '\n');
  }

  out.end();
  await new Promise((resolve, reject) => out.on('finish', resolve).on('error', reject));
  fs.renameSync(tmpPath, filePath);

  return { fixedSa, fixedNit };
}

async function main() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(DATA_DIR, f));

  let totalSa = 0;
  let totalNit = 0;
  let filesPatched = 0;

  for (const filePath of files) {
    const stat = fs.statSync(filePath);
    const fileMtime = localTimestamp(stat.mtime);
    const { fixedSa, fixedNit } = await processFile(filePath, fileMtime);

    if (fixedSa > 0 || fixedNit > 0) {
      filesPatched++;
      console.log(`${path.basename(filePath)}: +${fixedSa} scraped_at, +${fixedNit} nit fixes`);
    }

    totalSa += fixedSa;
    totalNit += fixedNit;
  }

  console.log(`\nDone. ${filesPatched} files patched.`);
  console.log(`  scraped_at added: ${totalSa}`);
  console.log(`  nit/supplier_name fixed (K-suffix + foreign ID): ${totalNit}`);
}

main().catch(err => { console.error(err); process.exit(1); });
