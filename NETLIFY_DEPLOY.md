# Deployment Netlify

## Repository settings
- Build command: kosong
- Publish directory: `.`
- Functions directory: `netlify/functions` (dibaca dari `netlify.toml`)

## Environment variable
Set:
`TMDB_API_KEY=<TMDB API key Anda>`

Jangan menaruh API key di `index.html`.

## Setelah deploy
Tes:
- `/`
- `/movies`
- `/tv`
- `/watchlist`
- `/api/tmdb/movie/popular`
- `/api/moderate`

## Player
Jika provider iframe menolak embedding dari domain Netlify dengan CSP/X-Frame-Options/hotlink protection, itu adalah pembatasan dari provider tersebut dan tidak dapat dihapus oleh `_headers` Netlify.
