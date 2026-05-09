const axios = require('axios');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-GT,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://www.guatecompras.gt/proveedores/busquedaProvee.aspx',
  'Upgrade-Insecure-Requests': '1',
};

async function fetchPage(url) {
  const response = await axios.get(url, {
    headers: HEADERS,
    timeout: 30000,
  });
  return response.data;
}

function randomDelay() {
  const ms = 1000 + Math.random() * 2000;
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { fetchPage, randomDelay };
