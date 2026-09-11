# ReviewFilm21

Website static ReviewFilm21 untuk GitHub Pages.

## Live site

https://reviewfilm21.github.io/

## Deployment

Repository ini menggunakan GitHub Pages dari branch `main`.

Tidak membutuhkan build command atau server backend untuk frontend static.

## Struktur utama

- `index.html` — aplikasi utama
- `404.html` — fallback halaman tidak ditemukan
- `sw.js` — service worker/cache
- `manifest.json` — metadata PWA
- `robots.txt` — aturan crawler
- `sitemap.xml` — sitemap
- `.nojekyll` — menonaktifkan pemrosesan Jekyll
- `yandex_01f0fcd6fbc6e79a.html` — verifikasi Yandex

## Catatan

Data pustaka film dimuat dari Google Sheets dan provider video eksternal digunakan oleh aplikasi sesuai konfigurasi di `index.html`.

Untuk GitHub Pages, file/server khusus Netlify atau backend server-side tidak diperlukan.
