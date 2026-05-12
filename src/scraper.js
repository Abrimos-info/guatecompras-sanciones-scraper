const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

function buildProxy() {
  const raw = process.env.PROXY_URL;
  if (!raw) return undefined;
  const { protocol, hostname, port, username, password } = new URL(raw);
  const cfg = { protocol: protocol.replace(':', ''), host: hostname, port: parseInt(port, 10) };
  if (username) cfg.auth = { username: decodeURIComponent(username), password: decodeURIComponent(password) };
  return cfg;
}

const PROXY = buildProxy();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-GT,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://www.guatecompras.gt/proveedores/busquedaProvee.aspx',
  'Upgrade-Insecure-Requests': '1',
  'Cache-Control': 'max-age=0',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Sec-CH-UA': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-CH-UA-Mobile': '?0',
  'Sec-CH-UA-Platform': '"Windows"',
};

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const WARMUP_URL = 'https://www.guatecompras.gt/proveedores/busquedaProvee.aspx';
let warmedUp = false;

async function warmUp() {
  if (warmedUp) return;
  process.stderr.write(`[warmup] GET ${WARMUP_URL} via ${PROXY ? PROXY.host : 'direct'}...\n`);
  try {
    const res = await client.get(WARMUP_URL, { headers: HEADERS, timeout: 30000, ...(PROXY && { proxy: PROXY }) });
    process.stderr.write(`[warmup] ${res.status} — cookies: ${jar.toJSON().cookies.length}\n`);
    warmedUp = true;
  } catch (err) {
    process.stderr.write(`[warmup] FAILED ${err.response?.status ?? err.message}\n`);
    throw err;
  }
}

async function fetchPage(url) {
  const response = await client.get(url, {
    headers: HEADERS,
    timeout: 30000,
    ...(PROXY && { proxy: PROXY }),
  });
  return response.data;
}

function randomDelay() {
  const ms = 1000 + Math.random() * 1000;
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { fetchPage, randomDelay };
