class RateLimiter{
  constructor(){this.requests=new Map();this.maxRequests=15;this.windowMs=10000}
  async throttle(key,requestFn){const now=Date.now(),start=now-this.windowMs;if(this.requests.has(key)){const requests=this.requests.get(key).filter(t=>t>start);if(requests.length>=this.maxRequests){const wait=this.windowMs-(now-requests[0]);await new Promise(r=>setTimeout(r,wait));return this.throttle(key,requestFn)}this.requests.set(key,requests)}const requests=this.requests.get(key)||[];requests.push(now);this.requests.set(key,requests);return requestFn()}
  getRemainingRequests(key){const start=Date.now()-this.windowMs;const requests=(this.requests.get(key)||[]).filter(t=>t>start);return Math.max(0,this.maxRequests-requests.length)}
}
const rateLimiter=new RateLimiter();
