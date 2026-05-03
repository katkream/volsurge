
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Bybit API base
const BYBIT_BASE = 'https://api.bybit.com';

// Proxy helper
async function proxyBybit(path, res) {
  try {
    const response = await fetch(`${BYBIT_BASE}${path}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// --- Public endpoints ---

// Klines (candlestick data) — REQUIRED for charts
app.get('/klines', async (req, res) => {
  const { symbol, interval, limit = 100 } = req.query;
  if (!symbol || !interval) {
    return res.status(400).json({ error: 'symbol and interval required' });
  }
  // Map exchange symbol to Bybit format: "BTCUSDT" -> "BTCUSDT"
  await proxyBybit(`/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`, res);
});

// Ticker price — REQUIRED for live price display
app.get('/ticker/price', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  await proxyBybit(`/v5/market/tickers?category=linear&symbol=${symbol}`, res);
});

// 24hr volume — REQUIRED for screener volume column
app.get('/ticker/24hr', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  await proxyBybit(`/v5/market/tickers?category=linear&symbol=${symbol}`, res);
});

// All tickers (for screener bulk fetch)
app.get('/tickers', async (req, res) => {
  await proxyBybit(`/v5/market/tickers?category=linear`, res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', proxy: 'volsurge-bybit', timestamp: Date.now() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VolSurge Bybit Proxy running on port ${PORT}`);
});
