require('dotenv').config();
const express=require('express'), cors=require('cors'), axios=require('axios'), helmet=require('helmet'), rateLimit=require('express-rate-limit');
const app=express(), PORT=process.env.PORT||3000, TMDB_API_KEY=process.env.TMDB_API_KEY;
app.use(helmet({contentSecurityPolicy:false})); app.use(express.json({limit:'10kb'}));
const allowedOrigins=(process.env.ALLOWED_ORIGINS||'*').split(',');
app.use(cors({origin:(origin,cb)=>{if(!origin||allowedOrigins.includes('*')||allowedOrigins.includes(origin))cb(null,true);else cb(new Error('Origin tidak diizinkan'))}}));
app.use('/api/',rateLimit({windowMs:15*60*1000,max:100,message:{error:'Terlalu banyak request'}}));
const cache=new Map(), CACHE_DURATION=5*60*1000;
function getCache(k){const c=cache.get(k);return c&&Date.now()-c.timestamp<CACHE_DURATION?c.data:null}
function setCache(k,data){cache.set(k,{data,timestamp:Date.now()})}
app.get('/health',(req,res)=>res.json({status:'ok',timestamp:new Date().toISOString()}));
app.get('/api/tmdb/:endpoint',async(req,res)=>{try{if(!TMDB_API_KEY)return res.status(500).json({error:'API key tidak dikonfigurasi'});const {endpoint}=req.params,k=`tmdb:${endpoint}:${JSON.stringify(req.query)}`,c=getCache(k);if(c)return res.json({...c,cached:true});const r=await axios.get(`https://api.themoviedb.org/3/${endpoint}`,{params:{...req.query,api_key:TMDB_API_KEY,language:req.query.language||'id-ID'},timeout:10000});setCache(k,r.data);res.json(r.data)}catch(e){console.error('TMDB Error:',e.message);res.status(500).json({error:'Gagal mengambil data dari TMDB'})}});
app.listen(PORT,()=>console.log(`🚀 Server berjalan di port ${PORT}`));
