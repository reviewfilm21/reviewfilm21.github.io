// update-movies.js
const fs = require('fs');
const path = require('path');
const https = require('https');

// API Key langsung (bukan dari secret)
const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYjFkMmNmMWRmMDU3YzJlNmExMTA4OGY3NTBkMDA1NSIsIm5iZiI6MTc4ODUxOTA2Ni43MDU5OTk5LCJzdWIiOiI2YTlhYTI5YTAyMDFkNjgzYTE2ZTZlZWYiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.3E0nItwjfvG37VvlY_Ga-tarI1vxKVSkxfJLZevdxT8';

function fetchTMDB(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('🔄 Memulai update data...');
    
    try {
        // 1. Fetch Trending
        console.log('📥 Fetch trending...');
        const trendingUrl = `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}&language=id-ID`;
        const trendingData = await fetchTMDB(trendingUrl);
        
        // 2. Fetch Movies
        console.log('📥 Fetch movies...');
        const moviesUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=id-ID&page=1`;
        const moviesData = await fetchTMDB(moviesUrl);
        
        // 3. Fetch TV Shows
        console.log('📥 Fetch TV shows...');
        const tvUrl = `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=id-ID&page=1`;
        const tvData = await fetchTMDB(tvUrl);
        
        // Normalize data
        const trending = (trendingData.results || []).slice(0, 20).map(item => ({
            id: item.id,
            title: item.title || item.name || 'Unknown',
            type: item.media_type || 'movie',
            rating: (item.vote_average || 8.0).toFixed(1),
            year: (item.release_date || item.first_air_date || '2026').split('-')[0],
            genre: 'Bioskop',
            overview: item.overview || '',
            poster_path: item.poster_path || '',
            backdrop_path: item.backdrop_path || '',
            popularity: item.popularity || 0
        }));
        
        const movies = (moviesData.results || []).slice(0, 30).map(item => ({
            id: item.id,
            title: item.title || 'Unknown',
            type: 'movie',
            rating: (item.vote_average || 8.0).toFixed(1),
            year: (item.release_date || '2026').split('-')[0],
            genre: 'Bioskop',
            overview: item.overview || '',
            poster_path: item.poster_path || '',
            backdrop_path: item.backdrop_path || '',
            popularity: item.popularity || 0
        }));
        
        const tvShows = (tvData.results || []).slice(0, 20).map(item => ({
            id: item.id,
            title: item.name || 'Unknown',
            type: 'tv',
            rating: (item.vote_average || 8.0).toFixed(1),
            year: (item.first_air_date || '2026').split('-')[0],
            genre: 'TV Series',
            overview: item.overview || '',
            poster_path: item.poster_path || '',
            backdrop_path: item.backdrop_path || '',
            popularity: item.popularity || 0
        }));
        
        // Buat data object
        const data = {
            lastUpdated: new Date().toISOString(),
            timestamp: Date.now(),
            totalItems: trending.length + movies.length + tvShows.length,
            trending: trending,
            movies: movies,
            tvShows: tvShows,
            all: [...trending, ...movies, ...tvShows]
        };
        
        // Tulis ke movies.json
        const filePath = path.join(__dirname, 'movies.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        console.log('✅ SUCCESS!');
        console.log(`   - Trending: ${trending.length} items`);
        console.log(`   - Movies: ${movies.length} items`);
        console.log(`   - TV Shows: ${tvShows.length} items`);
        console.log(`   - Total: ${data.totalItems} items`);
        console.log(`   - Saved to: ${filePath}`);
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        process.exit(1);
    }
}

main();
