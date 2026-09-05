// ============================================
// REVIEWFILM21 BACKEND SERVER
// Dengan Caching & Rate Limiting
// ============================================

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// KONFIGURASI CACHE
// ============================================

// Cache dengan TTL 30 menit
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 1800,
  checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600,
  useClones: false
});

// ============================================
// MIDDLEWARE DASAR
// ============================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Matikan CSP untuk kompatibilitas
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',');
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400
}));

// Logging
app.use(morgan('combined'));

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// KONFIGURASI TMDB
// ============================================

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

if (!TMDB_API_KEY) {
  console.error('❌ ERROR: TMDB_API_KEY tidak ditemukan di .env file!');
  console.error('💡 Buat file .env dengan isi: TMDB_API_KEY=your_api_key_here');
  process.exit(1);
}

// Axios instance untuk TMDB
const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 15000,
  headers: {
    'Authorization': `Bearer ${TMDB_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// ============================================
// RATE LIMITING
// ============================================

// Rate limiter umum
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { 
    error: 'Terlalu banyak request', 
    message: 'Silakan coba lagi dalam beberapa menit' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Terlalu banyak request. Coba lagi nanti.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// Rate limiter khusus search (lebih ketat)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 10, // Max 10 search per menit
  message: { 
    error: 'Rate limit exceeded', 
    message: 'Pencarian terlalu cepat. Tunggu sebentar.' 
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================
// UTILITAS CACHE
// ============================================

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached) {
    console.log(`✅ Cache HIT: ${key}`);
    return cached;
  }
  console.log(`❌ Cache MISS: ${key}`);
  return null;
}

function setCachedData(key, data) {
  cache.set(key, data);
  console.log(`💾 Cache SET: ${key}`);
}

// ============================================
// ROUTES API TMDB
// ============================================

// ----- ROUTE: TRENDING -----
app.get('/api/tmdb/trending/:mediaType/:timeWindow', generalLimiter, async (req, res) => {
  try {
    const { mediaType, timeWindow } = req.params;
    const { language = 'id-ID', page = 1 } = req.query;
    
    // Validasi parameter
    if (!['all', 'movie', 'tv', 'person'].includes(mediaType)) {
      return res.status(400).json({ error: 'Media type tidak valid' });
    }
    if (!['day', 'week'].includes(timeWindow)) {
      return res.status(400).json({ error: 'Time window tidak valid' });
    }
    
    const cacheKey = `trending_${mediaType}_${timeWindow}_${language}_${page}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return res.json(cachedData);
    
    const response = await tmdbClient.get(`/trending/${mediaType}/${timeWindow}`, {
      params: { language, page }
    });
    
    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// ----- ROUTE: DISCOVER -----
app.get('/api/tmdb/discover/:mediaType', generalLimiter, async (req, res) => {
  try {
    const { mediaType } = req.params;
    const { language = 'id-ID', sort_by = 'popularity.desc', page = 1 } = req.query;
    
    // Validasi
    if (!['movie', 'tv'].includes(mediaType)) {
      return res.status(400).json({ error: 'Media type harus movie atau tv' });
    }
    
    const cacheKey = `discover_${mediaType}_${language}_${sort_by}_${page}_${JSON.stringify(req.query)}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return res.json(cachedData);
    
    const response = await tmdbClient.get(`/discover/${mediaType}`, {
      params: { language, sort_by, ...req.query }
    });
    
    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// ----- ROUTE: SEARCH -----
app.get('/api/tmdb/search/:mediaType', searchLimiter, async (req, res) => {
  try {
    const { mediaType } = req.params;
    const { query, language = 'id-ID', page = 1, include_adult = false } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Parameter query diperlukan' });
    }
    
    if (!['movie', 'tv', 'multi', 'person'].includes(mediaType)) {
      return res.status(400).json({ error: 'Media type tidak valid' });
    }
    
    const cacheKey = `search_${mediaType}_${query}_${language}_${page}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return res.json(cachedData);
    
    const response = await tmdbClient.get(`/search/${mediaType}`, {
      params: { query, language, page, include_adult }
    });
    
    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// ----- ROUTE: DETAIL MOVIE/TV -----
app.get('/api/tmdb/:mediaType/:id', generalLimiter, async (req, res) => {
  try {
    const { mediaType, id } = req.params;
    const { language = 'id-ID' } = req.query;
    
    if (!['movie', 'tv'].includes(mediaType)) {
      return res.status(400).json({ error: 'Media type harus movie atau tv' });
    }
    
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'ID harus berupa angka' });
    }
    
    const cacheKey = `detail_${mediaType}_${id}_${language}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return res.json(cachedData);
    
    const response = await tmdbClient.get(`/${mediaType}/${id}`, {
      params: { language }
    });
    
    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// ----- ROUTE: VIDEOS (TRAILER) -----
app.get('/api/tmdb/:mediaType/:id/videos', generalLimiter, async (req, res) => {
  try {
    const { mediaType, id } = req.params;
    const { language = 'id-ID' } = req.query;
    
    const cacheKey = `videos_${mediaType}_${id}_${language}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return res.json(cachedData);
    
    const response = await tmdbClient.get(`/${mediaType}/${id}/videos`, {
      params: { language }
    });
    
    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// ----- ROUTE: IMAGES -----
app.get('/api/tmdb/:mediaType/:id/images', generalLimiter, async (req, res) => {
  try {
    const { mediaType, id } = req.params;
    const { language = 'id-ID' } = req.query;
    
    const cacheKey = `images_${mediaType}_${id}_${language}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return res.json(cachedData);
    
    const response = await tmdbClient.get(`/${mediaType}/${id}/images`, {
      params: { language }
    });
    
    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// ----- ROUTE: SIMILAR MOVIES -----
app.get('/api/tmdb/:mediaType/:id/similar', generalLimiter, async (req, res) => {
  try {
    const { mediaType, id } = req.params;
    const { language = 'id-ID', page = 1 } = req.query;
    
    const cacheKey = `similar_${mediaType}_${id}_${language}_${page}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return res.json(cachedData);
    
    const response = await tmdbClient.get(`/${mediaType}/${id}/similar`, {
      params: { language, page }
    });
    
    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// ----- ROUTE: CREDITS (CAST) -----
app.get('/api/tmdb/:mediaType/:id/credits', generalLimiter, async (req, res) => {
  try {
    const { mediaType, id } = req.params;
    const { language = 'id-ID' } = req.query;
    
    const cacheKey = `credits_${mediaType}_${id}_${language}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return res.json(cachedData);
    
    const response = await tmdbClient.get(`/${mediaType}/${id}/credits`, {
      params: { language }
    });
    
    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    handleApiError(error, res);
  }
});

// ============================================
// IMAGE PROXY (Opsional - untuk bypass CORS)
// ============================================

app.get('/api/image/:size/:path', generalLimiter, async (req, res) => {
  try {
    const { size, path } = req.params;
    const imageUrl = `${TMDB_IMAGE_BASE_URL}/${size}/${path}`;
    
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 10000
    });
    
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (error) {
    console.error('❌ Image proxy error:', error.message);
    res.status(500).json({ error: 'Gagal memuat gambar' });
  }
});

// ============================================
// ERROR HANDLER
// ============================================

function handleApiError(error, res) {
  console.error('❌ API Error:', error.message);
  
  if (error.response) {
    // TMDB API error
    const status = error.response.status;
    const message = error.response.data?.status_message || 'Terjadi kesalahan pada TMDB API';
    
    return res.status(status).json({
      error: 'TMDB API Error',
      message: message,
      status_code: status
    });
  } else if (error.request) {
    // Network error
    return res.status(503).json({
      error: 'Network Error',
      message: 'Tidak dapat terhubung ke TMDB API. Coba lagi nanti.'
    });
  } else {
    // Other errors
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} tidak ditemukan`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Terjadi kesalahan tak terduga'
  });
});

// ============================================
// SERVE STATIC FILES
// ============================================

// Serve static files dari folder public
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  etag: true,
  index: 'index.html'
}));

// Fallback untuk SPA routing
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('🎬 ReviewFilm21 Backend Server');
  console.log('========================================');
  console.log(`✅ Server berjalan: http://localhost:${PORT}`);
  console.log(`🔑 TMDB API Key: ${maskApiKey(TMDB_API_KEY)}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Cache TTL: ${process.env.CACHE_TTL || 1800} detik`);
  console.log(`🚦 Rate Limit: ${process.env.RATE_LIMIT_MAX || 100} request/15 menit`);
  console.log('========================================');
  console.log('');
});

function maskApiKey(key) {
  if (!key || key.length < 16) return '***';
  return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});
