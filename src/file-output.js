const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BUCKET_SIZE = 10000;

function bucketStart(id) {
  return Math.floor(id / BUCKET_SIZE) * BUCKET_SIZE;
}

function bucketPath(id, dir) {
  const start = bucketStart(id);
  const end = start + BUCKET_SIZE - 1;
  return path.join(dir, `${start}-${end}.json`);
}

function appendRecord(filePath, record) {
  fs.appendFileSync(filePath, JSON.stringify(record) + '\n');
}

async function scanScrapedIds(dir, start, end) {
  const scraped = new Set();
  const firstBucket = bucketStart(start);
  const lastBucket = bucketStart(end);

  for (let b = firstBucket; b <= lastBucket; b += BUCKET_SIZE) {
    const filePath = path.join(dir, `${b}-${b + BUCKET_SIZE - 1}.json`);
    if (!fs.existsSync(filePath)) continue;

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const obj = JSON.parse(trimmed);
        if (obj.supplier_id != null) scraped.add(Number(obj.supplier_id));
      } catch {
        // skip malformed lines
      }
    }
  }

  return scraped;
}

module.exports = { bucketPath, appendRecord, scanScrapedIds };
