import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {createAstroServer} from './server.mjs';
async function main(){
 let databaseUrl=process.env.DATABASE_URL;
 if(!databaseUrl){
  if(!process.env.LOCALAPPDATA)throw new Error('Configure DATABASE_URL');
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['db/local-postgres.mjs','start'],{cwd:import.meta.dirname,windowsHide:true,stdio:'inherit'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('Local PostgreSQL startup failed')));});
  const config=JSON.parse(await readFile(join(process.env.LOCALAPPDATA,'AstroSecurity','postgresql','local-config.json'),'utf8'));databaseUrl=config.databaseUrl;
 }
 const port=Number(process.argv[2]||process.env.ASTRO_PORT||4180);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
 const server=await createAstroServer({host:'127.0.0.1',enableIntake:true,databaseUrl});
 server.listen(port,'127.0.0.1',()=>console.log(`Astro Security + PostgreSQL: http://localhost:${port}/?motion=full`));
}
main().catch(()=>{console.error('Não foi possível iniciar. Confira PostgreSQL e a configuração local de conexão.');process.exitCode=1;});
