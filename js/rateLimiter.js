// Rate limiter client-side
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.maxRequests = 15;
    this.windowMs = 10000;
  }

  async throttle(key, requestFn) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (this.requests.has(key)) {
      const requests = this.requests.get(key).filter(t => t > windowStart);
      if (requests.length >= this.maxRequests) {
        const oldestRequest = requests[0];
        const waitTime = this.windowMs - (now - oldestRequest);
        console.warn(`⏳ Rate limit untuk ${key}, tunggu ${Math.ceil(waitTime/1000)} detik`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.throttle(key, requestFn);
      }
      this.requests.set(key, requests);
    }
    
    const requests = this.requests.get(key) || [];
    requests.push(now);
    this.requests.set(key, requests);
    
    return requestFn();
  }

  getRemainingRequests(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = (this.requests.get(key) || []).filter(t => t > windowStart);
    return Math.max(0, this.maxRequests - requests.length);
  }
}

const rateLimiter = new RateLimiter();
