// IndexedDB wrapper untuk ReviewFilm21
class Database {
  constructor() { this.dbName='reviewfilm21-db'; this.version=1; this.db=null; }
  async open() {
    if (this.db) return this.db;
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(this.dbName,this.version);
      request.onupgradeneeded=(event)=>{
        const db=event.target.result;
        if(!db.objectStoreNames.contains('watchlist')){
          const s=db.createObjectStore('watchlist',{keyPath:'id'});
          s.createIndex('title','title',{unique:false}); s.createIndex('addedAt','addedAt',{unique:false});
        }
        if(!db.objectStoreNames.contains('ratings')) db.createObjectStore('ratings',{keyPath:'mediaId'});
        if(!db.objectStoreNames.contains('comments')){
          const s=db.createObjectStore('comments',{keyPath:'id',autoIncrement:true});
          s.createIndex('mediaId','mediaId',{unique:false}); s.createIndex('timestamp','timestamp',{unique:false});
        }
        if(!db.objectStoreNames.contains('apiCache')){
          const s=db.createObjectStore('apiCache',{keyPath:'url'}); s.createIndex('timestamp','timestamp',{unique:false});
        }
        if(!db.objectStoreNames.contains('pendingChanges')) db.createObjectStore('pendingChanges',{keyPath:'id',autoIncrement:true});
      };
      request.onsuccess=e=>{this.db=e.target.result;resolve(this.db)};
      request.onerror=e=>reject(e.target.error);
    });
  }
  async add(storeName,data){const db=await this.open();return new Promise((r,j)=>{const q=db.transaction(storeName,'readwrite').objectStore(storeName).add(data);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)})}
  async put(storeName,data){const db=await this.open();return new Promise((r,j)=>{const q=db.transaction(storeName,'readwrite').objectStore(storeName).put(data);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)})}
  async get(storeName,key){const db=await this.open();return new Promise((r,j)=>{const q=db.transaction(storeName,'readonly').objectStore(storeName).get(key);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)})}
  async getAll(storeName){const db=await this.open();return new Promise((r,j)=>{const q=db.transaction(storeName,'readonly').objectStore(storeName).getAll();q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)})}
  async delete(storeName,key){const db=await this.open();return new Promise((r,j)=>{const q=db.transaction(storeName,'readwrite').objectStore(storeName).delete(key);q.onsuccess=()=>r();q.onerror=()=>j(q.error)})}
  async addToWatchlist(item){item.addedAt=new Date().toISOString();await this.put('watchlist',item)}
  async removeFromWatchlist(id){await this.delete('watchlist',id)}
  async getWatchlist(){const items=await this.getAll('watchlist');return items.sort((a,b)=>new Date(b.addedAt)-new Date(a.addedAt))}
  async isInWatchlist(id){return !!(await this.get('watchlist',id))}
  async saveRating(mediaId,rating){await this.put('ratings',{mediaId,rating,timestamp:new Date().toISOString()})}
  async getRating(mediaId){const d=await this.get('ratings',mediaId);return d?.rating||null}
  async addComment(mediaId,name,text){return await this.add('comments',{mediaId,name:name||'Anonim',text,timestamp:new Date().toISOString(),moderated:false})}
  async getComments(mediaId){const all=await this.getAll('comments');return all.filter(c=>c.mediaId===mediaId).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp))}
  async cacheApiResponse(url,data){await this.put('apiCache',{url,data,timestamp:new Date().toISOString()})}
  async getCachedApiResponse(url,maxAge=3600000){const c=await this.get('apiCache',url);return c&&Date.now()-new Date(c.timestamp).getTime()<maxAge?c.data:null}
}
const db=new Database();
async function migrateFromLocalStorage(){
  try{
    const oldWatchlist=localStorage.getItem('lt21_watchlist');
    if(oldWatchlist){for(const item of JSON.parse(oldWatchlist)) await db.addToWatchlist(item);localStorage.removeItem('lt21_watchlist');console.log('✅ Migrasi watchlist selesai')}
  }catch(error){console.warn('⚠️ Gagal migrasi:',error)}
}
window.db=db;
