require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.warn('⚠️ TMDB_API_KEY belum dikonfigurasi');
}

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10kb' }));

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin tidak diizinkan'));
    }
  }
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Terlalu banyak request' }
});
app.use('/api/', apiLimiter);

// Cache sederhana
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

function getCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy TMDB
app.get('/api/tmdb/:endpoint', async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'API key tidak dikonfigurasi' });
    }

    const { endpoint } = req.params;
    const cacheKey = `tmdb:${endpoint}:${JSON.stringify(req.query)}`;
    
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      return res.json({ ...cachedData, cached: true });
    }

    const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}`, {
      params: {
        ...req.query,
        api_key: TMDB_API_KEY,
        language: req.query.language || 'id-ID'
      },
      timeout: 10000
    });

    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error('TMDB Error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil data dari TMDB' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});
