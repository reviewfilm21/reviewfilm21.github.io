# ReviewFilm21

Repository ini disiapkan untuk deployment static frontend + Netlify Functions.

## Deploy ke Netlify
1. Push seluruh isi repository ke GitHub.
2. Hubungkan repository ke Netlify.
3. Build command: kosong.
4. Publish directory: `.`
5. Set environment variable `TMDB_API_KEY` di Netlify.
6. Deploy.

API frontend:
- `/api/tmdb/*` -> Netlify Function `tmdb`
- `/api/moderate` -> Netlify Function `moderate`

`backend/` tetap tersedia untuk development atau deployment backend terpisah.

## Catatan player
Header situs hanya mengatur response dari situs ReviewFilm21. Header tersebut tidak dapat menimpa X-Frame-Options/CSP yang dikirim server pihak ketiga yang menjadi sumber iframe.
