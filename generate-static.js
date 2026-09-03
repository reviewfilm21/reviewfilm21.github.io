const fs = require('fs');
const path = require('path');

// Baca data film dari movies.json
const movies = JSON.parse(fs.readFileSync(path.join(__dirname, 'movies.json'), 'utf8'));

const outputDir = path.join(__dirname, 'public');

// Buat folder public jika belum ada
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function generateMovieHTML(movie) {
  const slug = slugify(movie.title);
  const type = movie.type || 'movie';
  const title = movie.title;
  const overview = movie.overview || 'Tonton ' + title + ' subtitle Indonesia gratis.';
  const poster = movie.poster || 'https://placehold.co/400x600/18181b/ff5c00?text=' + encodeURIComponent(title);
  const backdrop = movie.backdrop || poster;
  const rating = movie.rating || '8.0';
  const year = movie.year || '2026';
  const genres = movie.genres || 'Bioskop';
  const duration = movie.duration || '1h 55m';
  const country = movie.country || 'United States';
  const users = movie.users || '820.816 pengguna';

  const canonical = `https://reviewfilm21.github.io/${type}/${movie.id}/${slug}`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nonton ${title} (${year}) Sub Indo - ReviewFilm21</title>
  <meta name="description" content="Nonton ${title} subtitle Indonesia gratis. ${overview}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title} (${year})">
  <meta property="og:description" content="${overview}">
  <meta property="og:image" content="${poster}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} (${year})">
  <meta name="twitter:description" content="${overview}">
  <meta name="twitter:image" content="${poster}">
  <style>
    body { background: #09090b; color: #f4f4f5; font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; padding: 2rem; }
    .container { max-width: 800px; margin: auto; }
    .poster { max-width: 200px; border-radius: 1rem; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .meta { color: #a1a1aa; margin-bottom: 1rem; }
    .overview { line-height: 1.6; color: #d4d4d8; }
    .play-btn { display: inline-block; background: #ff5c00; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    .play-btn:hover { background: #ea4c00; }
    a { color: #ff5c00; }
  </style>
</head>
<body>
  <div class="container">
    <img class="poster" src="${poster}" alt="${title}">
    <h1>${title} (${year})</h1>
    <div class="meta">⭐ ${rating} | ${genres} | ${duration} | ${country} | ${users}</div>
    <p class="overview">${overview}</p>
    <a class="play-btn" href="/?play=${type}-${movie.id}">▶ Tonton Sekarang</a>
    <p><a href="/">← Kembali ke Beranda</a></p>
  </div>
</body>
</html>`;
}

movies.forEach(movie => {
  const typeDir = path.join(outputDir, movie.type || 'movie');
  if (!fs.existsSync(typeDir)) fs.mkdirSync(typeDir, { recursive: true });
  const idDir = path.join(typeDir, String(movie.id));
  if (!fs.existsSync(idDir)) fs.mkdirSync(idDir, { recursive: true });
  const html = generateMovieHTML(movie);
  fs.writeFileSync(path.join(idDir, 'index.html'), html);
  console.log('Generated: ' + movie.title);
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
console.log('sitemap.xml generated');

// Generate robots.txt
const robots = `User-agent: *\nAllow: /\nSitemap: https://reviewfilm21.github.io/sitemap.xml`;
fs.writeFileSync(path.join(outputDir, 'robots.txt'), robots);
console.log('robots.txt generated');
