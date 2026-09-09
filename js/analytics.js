// Sistem analytics untuk tracking user behavior
class Analytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.events = [];
    this.batchSize = 10;
    this.flushInterval = 30000;
    this.init();
  }
  init() {
    setInterval(() => this.flushEvents(), this.flushInterval);
    window.addEventListener('beforeunload', () => this.flushEvents(true));
    this.trackPageView();
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button');
      if (target) {
        this.trackEvent('click', {
          element: target.tagName,
          text: target.textContent?.trim().slice(0, 50)
        });
      }
    });
  }
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  getUserId() {
    let userId = localStorage.getItem('analytics_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('analytics_user_id', userId);
    }
    return userId;
  }
  trackPageView() {
    this.trackEvent('page_view', {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer
    });
  }
  trackSearch(query, resultsCount) { this.trackEvent('search', { query, resultsCount }); }
  trackPlay(mediaId, title, type) { this.trackEvent('play', { mediaId, title, type }); }
  trackWatchlistAdd(mediaId, title) { this.trackEvent('watchlist_add', { mediaId, title }); }
  trackRating(mediaId, rating) { this.trackEvent('rating', { mediaId, rating }); }
  trackComment(mediaId, commentLength) { this.trackEvent('comment', { mediaId, commentLength }); }
  trackEvent(event, data) {
    const eventData = {
      event,
      data: { ...data, sessionId: this.sessionId, userId: this.userId, timestamp: new Date().toISOString() }
    };
    this.events.push(eventData);
    if (window.location.hostname === 'localhost') console.log('[Analytics]', event, data);
    if (this.events.length >= this.batchSize) this.flushEvents();
  }
  async flushEvents() {
    if (this.events.length === 0) return;
    const eventsToSend = [...this.events];
    this.events = [];
    try {
      if (window.db) {
        for (const event of eventsToSend) {
          await window.db.add('pendingChanges', {
            type: 'analytics', data: event, timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Gagal simpan analytics:', error);
    }
  }
}
const analytics = new Analytics();
