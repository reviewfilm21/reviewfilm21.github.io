@echo off
echo ========================================
echo ReviewFilm21 - Instalasi Backend
echo ========================================

echo Menginstall dependencies...
call npm install

if not exist "public" (
    echo Membuat folder public...
    mkdir public
)

if not exist ".env" (
    echo Membuat .env dengan API key...
    echo TMDB_API_KEY=a45cdae790f09cee394b716b3115b84f> .env
    echo TMDB_BASE_URL=https://api.themoviedb.org/3>> .env
    echo PORT=3000>> .env
)

echo Instalasi selesai!
echo Jalankan dengan: npm start
echo ========================================
pause
