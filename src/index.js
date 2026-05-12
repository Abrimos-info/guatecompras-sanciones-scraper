#!/usr/bin/env node
const { scrapeSupplier, scrapeRange, scrapeRangeToDir } = require('./orchestrator');

const args = process.argv.slice(2);

function isValidId(n) {
  return Number.isInteger(n) && n >= 1 && n <= 99999999;
}

if (args.length === 1) {
  const id = parseInt(args[0], 10);
  if (!isValidId(id)) {
    process.stderr.write('Error: ID must be an integer between 1 and 99999999\n');
    process.exit(1);
  }
  scrapeSupplier(id)
    .then(result => {
      if (result) process.stdout.write(JSON.stringify(result) + '\n');
    })
    .catch(err => {
      process.stderr.write(`Error: ${err.message}\n`);
      process.exit(1);
    });

} else if (args.length === 2) {
  const start = parseInt(args[0], 10);
  const end = parseInt(args[1], 10);
  if (!isValidId(start) || !isValidId(end) || start > end) {
    process.stderr.write('Error: provide two valid IDs where start <= end\n');
    process.exit(1);
  }
  scrapeRange(start, end).catch(err => {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  });

} else if (args.length === 3) {
  const start = parseInt(args[0], 10);
  const end = parseInt(args[1], 10);
  const dir = args[2];
  if (!isValidId(start) || !isValidId(end) || start > end) {
    process.stderr.write('Error: provide two valid IDs where start <= end\n');
    process.exit(1);
  }
  scrapeRangeToDir(start, end, dir).catch(err => {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  });

} else {
  process.stderr.write(
    'Usage:\n' +
    '  node src/index.js <id>\n' +
    '  node src/index.js <start> <end>\n' +
    '  node src/index.js <start> <end> <output-dir>\n'
  );
  process.exit(1);
}
