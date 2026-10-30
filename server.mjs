import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('public'),port=Number(process.env.ASTRO_PORT||4180),host=process.env.ASTRO_HOST||'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}const file=path===root?resolve(root,'index.html'):path,body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);}catch{if(!res.headersSent)res.writeHead(404).end('Not found');else res.destroy();}}).listen(port,host,()=>console.log(`Astro Security: http://${host}:${port}`));
