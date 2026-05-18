const axios = require('axios');

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

async function fetchPage(url) {
  try {
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 30000,
      ...(PROXY && { proxy: PROXY }),
    });
    return response.data;
  } catch (err) {
    // Surface body of error responses (BrightData explains 407 in the body,
    // e.g. "Auth Failed (code: ip_forbidden)" or "no_balance"). Without this
    // the caller only sees axios's generic "Request failed with status code X".
    const status = err.response && err.response.status;
    const body = err.response && err.response.data;
    const bodyText = body == null
      ? ""
      : (typeof body === "string" ? body : JSON.stringify(body)).slice(0, 500);
    const proxyTag = PROXY ? `${PROXY.host}:${PROXY.port}` : "(direct)";
    process.stderr.write(
      `[scraper] fetch failed: url=${url} status=${status || "(none)"} proxy=${proxyTag}${bodyText ? ` body=${bodyText.replace(/\s+/g, " ")}` : ""}\n`,
    );
    throw err;
  }
}

function randomDelay() {
  const ms = 1000 + Math.random() * 1000;
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { fetchPage, randomDelay };
