import {createAstroServer} from './backend/server.mjs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export {createAstroServer};
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const host=process.env.ASTRO_HOST||'127.0.0.1',port=Number(process.env.ASTRO_PORT||4180);
 try{
  const server=await createAstroServer({host,enableIntake:process.env.ASTRO_ENABLE_INTAKE==='1'});
  server.listen(port,host,()=>console.log(`Astro Security: http://${host}:${port}`));
 }catch{console.error('Astro Security: initialization failed. Verify local intake and database configuration.');process.exitCode=1;}
}
