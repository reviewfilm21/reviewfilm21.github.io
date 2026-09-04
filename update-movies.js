// update-movies.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// API Key dari GitHub Secrets
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'YOUR_API_KEY_HERE';

// URL API TMDB
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

async function fetchTMDBData() {
    console.log('🔄 Fetching data from TMDB...');
    
    try {
        // Fetch trending movies
        const trendingRes = await axios.get(`${TMDB_BASE_URL}/trending/all/week`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'id-ID',
                page: 1
            }
        });
        
        // Fetch popular movies
        const moviesRes = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'id-ID',
                sort_by: 'popularity.desc',
                page: 1
            }
        });
        
        // Fetch popular TV shows
        const tvRes = await axios.get(`${TMDB_BASE_URL}/discover/tv`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'id-ID',
                sort_by: 'popularity.desc',
                page: 1
            }
        });
        
        const data = {
            lastUpdated: new Date().toISOString(),
            trending: normalizeData(trendingRes.data.results || []),
            movies: normalizeData(moviesRes.data.results || []),
            tvShows: normalizeData(tvRes.data.results || []),
            all: []
        };
        
        // Gabungkan semua data
        data.all = [...data.trending, ...data.movies, ...data.tvShows];
        
        // Simpan ke movies.json
        fs.writeFileSync(
            path.join(__dirname, 'movies.json'),
            JSON.stringify(data, null, 2),
            'utf8'
        );
        
        console.log(`✅ Data saved: ${data.all.length} items`);
        console.log(`   - Trending: ${data.trending.length}`);
        console.log(`   - Movies: ${data.movies.length}`);
        console.log(`   - TV Shows: ${data.tvShows.length}`);
        
        return data;
    } catch (error) {
        console.error('❌ Error fetching TMDB data:', error.message);
        throw error;
    }
}

function normalizeData(items) {
    return items.map(item => {
        const title = item.title || item.name || 'Unknown';
        const releaseDate = item.release_date || item.first_air_date || '';
        const year = releaseDate ? releaseDate.split('-')[0] : '2026';
        
        return {
            id: item.id,
            title: title,
            type: item.media_type || (item.title ? 'movie' : 'tv'),
            rating: item.vote_average ? item.vote_average.toFixed(1) : '8.0',
            year: year,
            genre: item.genre_ids ? item.genre_ids.join(',') : '',
            overview: item.overview || '',
            poster_path: item.poster_path || '',
            backdrop_path: item.backdrop_path || '',
            popularity: item.popularity || 0,
            vote_count: item.vote_count || 0
        };
    }).filter(Boolean);
}

// Jalankan fetch
fetchTMDBData().catch(error => {
    console.error('Failed to update data:', error);
    process.exit(1);
});
