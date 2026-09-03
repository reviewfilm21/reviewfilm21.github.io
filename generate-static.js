// generate-static.js
const fs = require('fs');
const path = require('path');

// Baca data film dari movies.json
const movies = JSON.parse(fs.readFileSync(path.join(__dirname, 'movies.json'), 'utf8'));

// Direktori output: folder 'public' di root, nanti isinya di-upload ke GitHub Pages
const outputDir = path.join(__dirname, 'public');

// Buat folder output jika belum ada
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Fungsi slugify untuk membuat URL yang ramah
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Fungsi untuk menghasilkan HTML statis per film
function generateMovieHTML(movie) {
  const slug = slugify(movie.title);
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nonton ${movie.title} (${movie.year}) Sub Indo - ReviewFilm21</title>
  <meta name="description" content="${movie.overview}">
  <link rel="canonical" href="https://reviewfilm21.github.io/${movie.type}/${movie.id}/${slug}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${movie.title} (${movie.year})">
  <meta property="og:description" content="${movie.overview}">
  <meta property="og:image" content="${movie.poster}">
  <meta property="og:url" content="https://reviewfilm21.github.io/${movie.type}/${movie.id}/${slug}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${movie.title} (${movie.year})">
  <meta name="twitter:description" content="${movie.overview}">
  <meta name="twitter:image" content="${movie.poster}">
  <style>
    body { background: #09090b; color: #f4f4f5; font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: auto; }
    .poster { max-width: 200px; border-radius: 8px; margin-bottom: 20px; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .meta { color: #a1a1aa; margin-bottom: 1rem; }
    .overview { line-height: 1.6; color: #d4d4d8; }
    .play-btn { display: inline-block; background: #ff5c00; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    .play-btn:hover { background: #ea4c00; }
  </style>
</head>
<body>
  <div class="container">
    <img class="poster" src="${movie.poster}" alt="${movie.title}">
    <h1>${movie.title} (${movie.year})</h1>
    <div class="meta">⭐ ${movie.rating} | ${movie.genres}</div>
    <p class="overview">${movie.overview}</p>
    <!-- Tombol untuk menonton, arahkan ke halaman utama dengan parameter id -->
    <a class="play-btn" href="https://reviewfilm21.github.io/?play=${movie.type}-${movie.id}" onclick="event.preventDefault(); window.location.href='/' + '?play=${movie.type}-${movie.id}'">▶ Tonton Sekarang</a>
    <p><a href="/">← Kembali ke Beranda</a></p>
  </div>
</body>
</html>`;
}

// Generate folder untuk setiap film
movies.forEach(movie => {
  const movieDir = path.join(outputDir, movie.type, String(movie.id));
  if (!fs.existsSync(movieDir)) {
    fs.mkdirSync(movieDir, { recursive: true });
  }
  const html = generateMovieHTML(movie);
  fs.writeFileSync(path.join(movieDir, 'index.html'), html);
  console.log(`✅ ${movie.title} -> ${movie.type}/${movie.id}/index.html`);
});

// Generate sitemap.xml
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
sitemap += `  <url><loc>https://reviewfilm21.github.io/</loc><priority>1.0</priority></url>\n`;
movies.forEach(movie => {
  const slug = slugify(movie.title);
  sitemap += `  <url><loc>https://reviewfilm21.github.io/${movie.type}/${movie.id}/${slug}</loc></url>\n`;
});
sitemap += `</urlset>`;
fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemap);
console.log('✅ sitemap.xml generated');

// Generate robots.txt
const robots = `User-agent: *\nAllow: /\nSitemap: https://reviewfilm21.github.io/sitemap.xml`;
fs.writeFileSync(path.join(outputDir, 'robots.txt'), robots);
console.log('✅ robots.txt generated');
