// generate-static.js
const fs = require('fs');
const path = require('path');

// Baca movies.json
const moviesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'movies.json'), 'utf8'));

function generateMoviePages() {
    console.log('🔄 Generating static pages...');
    
    const allMovies = moviesData.all || [];
    let sitemapUrls = [];
    let generatedCount = 0;
    
    // Buat folder movie dan tv jika belum ada
    const movieDir = path.join(__dirname, 'movie');
    const tvDir = path.join(__dirname, 'tv');
    
    if (!fs.existsSync(movieDir)) fs.mkdirSync(movieDir, { recursive: true });
    if (!fs.existsSync(tvDir)) fs.mkdirSync(tvDir, { recursive: true });
    
    allMovies.forEach(movie => {
        const type = movie.type === 'tv' ? 'tv' : 'movie';
        const dir = type === 'tv' ? tvDir : movieDir;
        const filename = `${movie.id}-${slugify(movie.title)}.html`;
        const filePath = path.join(dir, filename);
        
        const htmlContent = generateMovieHTML(movie);
        
        fs.writeFileSync(filePath, htmlContent, 'utf8');
        sitemapUrls.push(`https://reviewfilm21.github.io/${type}/${filename}`);
        generatedCount++;
    });
    
    // Update sitemap.xml
    generateSitemap(sitemapUrls);
    
    console.log(`✅ Generated ${generatedCount} static pages`);
    return generatedCount;
}

function generateMovieHTML(movie) {
    const title = movie.title || 'Unknown';
    const year = movie.year || '2026';
    const rating = movie.rating || '8.0';
    const overview = movie.overview || 'No description available';
    const posterPath = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
        : 'https://placehold.co/400x600/18181b/ff5c00?text=No+Poster';
    
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nonton ${title} (${year}) Sub Indo - ReviewFilm21</title>
    <meta name="description" content="Nonton ${title} (${year}) subtitle Indonesia gratis di ReviewFilm21. Streaming film bioskop terbaru dengan kualitas HD.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://reviewfilm21.github.io/${movie.type}/${movie.id}-${slugify(title)}.html">
    
    <!-- Open Graph -->
    <meta property="og:title" content="Nonton ${title} (${year}) Sub Indo">
    <meta property="og:description" content="${overview.substring(0, 150)}...">
    <meta property="og:image" content="${posterPath}">
    <meta property="og:type" content="video.movie">
    
    <style>
        body { 
            font-family: sans-serif; 
            background: #09090b; 
            color: #fff; 
            margin: 0; 
            padding: 20px; 
        }
        .container { max-width: 800px; margin: 0 auto; }
        a { color: #ff5c00; text-decoration: none; }
        .poster { max-width: 300px; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <a href="/">← Kembali ke Beranda</a>
        <h1>${title} (${year})</h1>
        <p>Rating: ⭐ ${rating}</p>
        <img src="${posterPath}" alt="${title}" class="poster">
        <p>${overview}</p>
        <a href="/">Tonton Sekarang</a>
    </div>
</body>
</html>`;
}

function generateSitemap(urls) {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://reviewfilm21.github.io/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    ${urls.map(url => `
    <url>
        <loc>${url}</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`).join('')}
</urlset>`;
    
    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap, 'utf8');
    console.log(`✅ Sitemap updated with ${urls.length} URLs`);
}

function slugify(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Jalankan
const count = generateMoviePages();
console.log(`✅ Static pages generated: ${count}`);
