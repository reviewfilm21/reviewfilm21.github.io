// update-movies.js - VERSI RINGAN
// Hanya fetch data TMDB dan simpan ke movies.json

const fs = require('fs');
const path = require('path');
const https = require('https');

const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYjFkMmNmMWRmMDU3YzJlNmExMTA4OGY3NTBkMDA1NSIsIm5iZiI6MTc4ODUxOTA2Ni43MDU5OTk5LCJzdWIiOiI2YTlhYTI5YTAyMDFkNjgzYTE2ZTZlZWYiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.3E0nItwjfvG37VvlY_Ga-tarI1vxKVSkxfJLZevdxT8';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function fetchTMDB(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=id-ID`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

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
        genre: 'Bioskop',
        overview: item.overview || '',
        poster_path: item.poster_path || '',
        backdrop_path: item.backdrop_path || '',
        popularity: item.popularity || 0
    };
}

async function updateData() {
    console.log('🔄 Fetching data from TMDB...');
    
    try {
        // Fetch trending
        const trendingData = await fetchTMDB('/trending/all/week');
        const trending = (trendingData.results || []).map(normalizeItem).slice(0, 20);
        
        // Fetch movies
        const moviesData = await fetchTMDB('/discover/movie');
        const movies = (moviesData.results || []).map(normalizeItem).slice(0, 30);
        
        // Fetch TV shows
        const tvData = await fetchTMDB('/discover/tv');
        const tvShows = (tvData.results || []).map(normalizeItem).slice(0, 20);
        
        // Save to movies.json
        const data = {
            lastUpdated: new Date().toISOString(),
            trending: trending,
            movies: movies,
            tvShows: tvShows
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'movies.json'),
            JSON.stringify(data, null, 2),
            'utf8'
        );
        
        console.log(`✅ Data saved: ${trending.length + movies.length + tvShows.length} items`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateData();
