// Sistem internasionalisasi (i18n)
const translations = {
  id: {
    home: 'Beranda',
    movies: 'Film Bioskop',
    tv: 'TV Series',
    watchlist: 'Favorit',
    search_placeholder: 'Cari film...',
    watch_now: 'Tonton Sekarang',
    save: 'Simpan',
    saved: 'Tersimpan',
    trending_weekly: 'Trending Mingguan',
    latest_movies: 'Film Bioskop Terbaru',
    tv_series: 'Series & Acara TV',
    thriller_mystery: 'Thriller & Misteri',
    back: 'Kembali',
    server: 'Server',
    trailer: 'Trailer',
    episode: 'Episode',
    synopsis: 'Sinopsis Ringkas',
    rate_movie: 'Beri rating film ini',
    comments: 'Komentar',
    write_comment: 'Tulis komentar...',
    submit_comment: 'Kirim Komentar',
    no_comments: 'Belum ada komentar. Jadilah yang pertama!',
    added_to_watchlist: 'ditambahkan ke favorit!',
    removed_from_watchlist: 'dihapus dari favorit',
    load_more: 'Muat Lebih Banyak',
    no_results: 'Tidak ada hasil ditemukan',
    loading: 'Memuat konten...'
  },
  en: {
    home: 'Home',
    movies: 'Movies',
    tv: 'TV Series',
    watchlist: 'Favorites',
    search_placeholder: 'Search movies...',
    watch_now: 'Watch Now',
    save: 'Save',
    saved: 'Saved',
    trending_weekly: 'Weekly Trending',
    latest_movies: 'Latest Movies',
    tv_series: 'Series & TV Shows',
    thriller_mystery: 'Thriller & Mystery',
    back: 'Back',
    server: 'Server',
    trailer: 'Trailer',
    episode: 'Episode',
    synopsis: 'Synopsis',
    rate_movie: 'Rate this movie',
    comments: 'Comments',
    write_comment: 'Write a comment...',
    submit_comment: 'Submit Comment',
    no_comments: 'No comments yet. Be the first!',
    added_to_watchlist: 'added to favorites!',
    removed_from_watchlist: 'removed from favorites',
    load_more: 'Load More',
    no_results: 'No results found',
    loading: 'Loading content...'
  }
};

class I18n {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'id';
    this.translations = translations;
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
      this.updatePage();
    }
  }

  getLanguage() {
    return this.currentLanguage;
  }

  t(key) {
    return this.translations[this.currentLanguage][key] || 
           this.translations.id[key] || key;
  }

  updatePage() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });

    document.documentElement.lang = this.currentLanguage;
  }
}

const i18n = new I18n();
