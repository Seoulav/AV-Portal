// Local static verification server: exact Pages paths, no SPA fallback, no uploads or request logs.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.pdf':'application/pdf','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml','.webp':'image/webp','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const mapping=[['/AV-Portal/cpq/','cpq/dist'],['/AV-Portal/builder/','builder/dist'],['/AV-Portal/','beta/site']].find(([p])=>pathname.startsWith(p));
  if(!mapping || req.method!=='GET') {res.writeHead(404).end();return;}
  const [prefix,folder]=mapping;const base=resolve(root,folder);let file=resolve(base,pathname.slice(prefix.length)||'index.html');
  if(!file.startsWith(base+sep)) {res.writeHead(403).end();return;}
  if((await stat(file)).isDirectory()) file=resolve(file,'index.html');
  res.setHeader('Content-Type',types[extname(file)]??'application/octet-stream');res.setHeader('Cache-Control','no-store');
  res.end(await readFile(file));
 } catch {res.writeHead(404).end();}
}).listen(4188,'127.0.0.1',()=>console.log('Local Portal: http://127.0.0.1:4188/AV-Portal/'));
