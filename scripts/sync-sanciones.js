'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SANCIONES_FILE = 'sanciones.json';
const NIT_FIELD = 'Número de Identificación Tributaria (NIT)';

async function readNdjson(filePath) {
  const records = [];
  const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) records.push(JSON.parse(trimmed));
  }
  return records;
}

async function main() {
  const destDir = process.argv[2];
  if (!destDir) {
    process.stderr.write('Usage: node scripts/sync-sanciones.js <dest-dir>\n');
    process.exit(1);
  }
  if (!fs.existsSync(destDir) || !fs.statSync(destDir).isDirectory()) {
    process.stderr.write(`[sync] error: "${destDir}" is not a directory\n`);
    process.exit(1);
  }

  // Build NIT → [record, ...] map from all source data files
  const sourceFiles = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(DATA_DIR, f));

  const nitMap = new Map();
  let skippedNull = 0;

  for (const filePath of sourceFiles) {
    for (const rec of await readNdjson(filePath)) {
      if (rec.nit === null || rec.nit === undefined) { skippedNull++; continue; }
      if (!nitMap.has(rec.nit)) nitMap.set(rec.nit, []);
      nitMap.get(rec.nit).push(rec);
    }
  }

  // Flag duplicate NITs — these indicate a data error
  let duplicateCount = 0;
  for (const [nit, records] of nitMap.entries()) {
    if (records.length > 1) {
      duplicateCount++;
      process.stderr.write(
        `[sync] WARNING: duplicate NIT ${nit} — supplier_ids: ${records.map(r => r.supplier_id).join(', ')}\n`,
      );
    }
  }

  // Collect NITs already present in destination files
  const sancionesPath = path.join(destDir, SANCIONES_FILE);
  const destFiles = fs.readdirSync(destDir)
    .filter(f => f.endsWith('.json') && f !== SANCIONES_FILE)
    .map(f => path.join(destDir, f));

  const destNits = new Set();
  for (const filePath of destFiles) {
    for (const rec of await readNdjson(filePath)) {
      const nit = rec[NIT_FIELD];
      if (nit) destNits.add(String(nit));
    }
  }

  // Collect NITs already written to sanciones.json
  const sancionesNits = new Set();
  if (fs.existsSync(sancionesPath)) {
    for (const rec of await readNdjson(sancionesPath)) {
      const nit = rec[NIT_FIELD];
      if (nit) sancionesNits.add(String(nit));
    }
  }

  // Append new records to sanciones.json
  const out = fs.createWriteStream(sancionesPath, { flags: 'a' });
  let alreadyInDest = 0;
  let alreadyInSanciones = 0;
  let newCount = 0;

  for (const [nit, records] of nitMap.entries()) {
    if (destNits.has(nit)) { alreadyInDest++; continue; }
    if (sancionesNits.has(nit)) { alreadyInSanciones++; continue; }
    const rec = records[0];
    out.write(JSON.stringify({
      gcid: Number(rec.supplier_id),
      'Nombre o razón social': rec.supplier_name,
      [NIT_FIELD]: rec.nit,
    }) + '\n');
    newCount++;
  }

  out.end();
  await new Promise((resolve, reject) => out.on('finish', resolve).on('error', reject));

  process.stdout.write(`[sync] source NITs: ${nitMap.size} (${skippedNull} skipped — null NIT)\n`);
  process.stdout.write(`[sync] already in destination: ${alreadyInDest}\n`);
  process.stdout.write(`[sync] already in sanciones.json: ${alreadyInSanciones}\n`);
  process.stdout.write(`[sync] newly written: ${newCount}\n`);
  if (duplicateCount > 0) {
    process.stdout.write(`[sync] duplicate NITs flagged: ${duplicateCount} (details in stderr)\n`);
  }
}

main().catch(err => {
  process.stderr.write(`[sync] fatal: ${err.message}\n`);
  process.exit(1);
});
