// IndexedDB wrapper untuk ReviewFilm21
class Database {
  constructor() {
    this.dbName = 'reviewfilm21-db';
    this.version = 1;
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store untuk watchlist
        if (!db.objectStoreNames.contains('watchlist')) {
          const watchlistStore = db.createObjectStore('watchlist', { keyPath: 'id' });
          watchlistStore.createIndex('title', 'title', { unique: false });
          watchlistStore.createIndex('addedAt', 'addedAt', { unique: false });
        }

        // Store untuk ratings
        if (!db.objectStoreNames.contains('ratings')) {
          db.createObjectStore('ratings', { keyPath: 'mediaId' });
        }

        // Store untuk comments
        if (!db.objectStoreNames.contains('comments')) {
          const commentsStore = db.createObjectStore('comments', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          commentsStore.createIndex('mediaId', 'mediaId', { unique: false });
          commentsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store untuk cache API
        if (!db.objectStoreNames.contains('apiCache')) {
          const cacheStore = db.createObjectStore('apiCache', { keyPath: 'url' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store untuk pending changes
        if (!db.objectStoreNames.contains('pendingChanges')) {
          db.createObjectStore('pendingChanges', { 
            keyPath: 'id',
            autoIncrement: true 
          });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  async add(storeName, data) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addToWatchlist(item) {
    item.addedAt = new Date().toISOString();
    await this.put('watchlist', item);
  }

  async removeFromWatchlist(id) {
    await this.delete('watchlist', id);
  }

  async getWatchlist() {
    const items = await this.getAll('watchlist');
    return items.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }

  async isInWatchlist(id) {
    const item = await this.get('watchlist', id);
    return !!item;
  }

  async saveRating(mediaId, rating) {
    await this.put('ratings', { 
      mediaId, 
      rating, 
      timestamp: new Date().toISOString() 
    });
  }

  async getRating(mediaId) {
    const data = await this.get('ratings', mediaId);
    return data?.rating || null;
  }

  async addComment(mediaId, name, text) {
    const comment = {
      mediaId,
      name: name || 'Anonim',
      text,
      timestamp: new Date().toISOString(),
      moderated: false
    };
    return await this.add('comments', comment);
  }

  async getComments(mediaId) {
    const all = await this.getAll('comments');
    return all
      .filter(c => c.mediaId === mediaId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  async cacheApiResponse(url, data) {
    await this.put('apiCache', {
      url,
      data,
      timestamp: new Date().toISOString()
    });
  }

  async getCachedApiResponse(url, maxAge = 3600000) {
    const cached = await this.get('apiCache', url);
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < maxAge) {
      return cached.data;
    }
    return null;
  }
}

const db = new Database();

async function migrateFromLocalStorage() {
  try {
    const oldWatchlist = localStorage.getItem('lt21_watchlist');
    if (oldWatchlist) {
      const items = JSON.parse(oldWatchlist);
      for (const item of items) {
        await db.addToWatchlist(item);
      }
      localStorage.removeItem('lt21_watchlist');
      console.log('✅ Migrasi watchlist selesai');
    }
  } catch (error) {
    console.warn('⚠️ Gagal migrasi:', error);
  }
}
