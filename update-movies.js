// update-movies.js
const fs = require('fs');
const path = require('path');
const https = require('https');

// API Key TMDB (hardcode untuk GitHub Actions)
const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYjFkMmNmMWRmMDU3YzJlNmExMTA4OGY3NTBkMDA1NSIsIm5iZiI6MTc4ODUxOTA2Ni43MDU5OTk5LCJzdWIiOiI2YTlhYTI5YTAyMDFkNjgzYTE2ZTZlZWYiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.3E0nItwjfvG37VvlY_Ga-tarI1vxKVSkxfJLZevdxT8';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Fungsi untuk fetch data dari TMDB
function fetchTMDB(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=id-ID`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Normalisasi data
function normalizeItem(item) {
    const title = item.title || item.name || 'Unknown';
    const releaseDate = item.release_date || item.first_air_date || '';
    const year = releaseDate ? releaseDate.split('-')[0] : '2026';
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    
    return {
        id: item.id,
        title: title,
        type: type,
        rating: item.vote_average ? item.vote_average.toFixed(1) : '8.0',
        year: year,
        genre: item.genre_ids ? getGenreNames(item.genre_ids) : (type === 'movie' ? 'Bioskop' : 'TV Series'),
        overview: item.overview || 'Tidak ada deskripsi tersedia.',
        poster_path: item.poster_path || '',
        backdrop_path: item.backdrop_path || '',
        popularity: item.popularity || 0,
        vote_count: item.vote_count || 0
    };
}

// Map genre IDs ke nama
function getGenreNames(genreIds) {
    const genreMap = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
        80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
        14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
        9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
        53: 'Thriller', 10752: 'War', 37: 'Western'
    };
    
    if (!genreIds || genreIds.length === 0) return 'Bioskop';
    return genreIds.slice(0, 3).map(id => genreMap[id] || 'Bioskop').join(', ');
}

// Main function
async function updateMoviesData() {
    console.log('🔄 Mulai update data film dari TMDB...');
    console.log(`📅 Waktu: ${new Date().toISOString()}`);
    
    try {
        // Fetch trending
        console.log('📥 Fetch trending...');
        const trendingData = await fetchTMDB('/trending/all/week');
        const trending = (trendingData.results || []).map(normalizeItem).slice(0, 20);
        
        // Fetch popular movies
        console.log('📥 Fetch popular movies...');
        const moviesData = await fetchTMDB('/discover/movie');
        const movies = (moviesData.results || []).map(normalizeItem).slice(0, 40);
        
        // Fetch popular TV shows
        console.log('📥 Fetch popular TV shows...');
        const tvData = await fetchTMDB('/discover/tv');
        const tvShows = (tvData.results || []).map(normalizeItem).slice(0, 20);
        
        // Gabungkan semua data
        const all = [...trending, ...movies, ...tvShows];
        
        // Buat objek data
        const data = {
            lastUpdated: new Date().toISOString(),
            totalItems: all.length,
            trending: trending,
            movies: movies,
            tvShows: tvShows,
            all: all
        };
        
        // Simpan ke movies.json
        const filePath = path.join(__dirname, 'movies.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        console.log(`✅ Data berhasil disimpan ke movies.json`);
        console.log(`   - Total: ${all.length} items`);
        console.log(`   - Trending: ${trending.length} items`);
        console.log(`   - Movies: ${movies.length} items`);
        console.log(`   - TV Shows: ${tvShows.length} items`);
        
        return data;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

// Jalankan
updateMoviesData()
    .then(() => {
        console.log('✅ Update selesai!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Update gagal:', error);
        process.exit(1);
    });
