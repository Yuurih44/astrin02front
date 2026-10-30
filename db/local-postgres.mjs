// Local Windows portable PostgreSQL lifecycle. Binaries are downloaded separately from EDB.
import {readFile,writeFile,mkdir,unlink,access} from 'node:fs/promises';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import pg from 'pg';

const base=join(process.env.LOCALAPPDATA||'', 'AstroSecurity','postgresql');
if(!process.env.LOCALAPPDATA||process.platform!=='win32')throw new Error('This helper requires Windows LOCALAPPDATA');
const bin=join(base,'pgsql','bin'),data=join(base,'cluster'),configPath=join(base,'local-config.json');
const exists=async path=>{try{await access(path);return true;}catch{return false;}};
async function run(name,args){await new Promise((resolve,reject)=>{const child=spawn(join(bin,name+'.exe'),args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',chunk=>{output+=chunk;});child.stderr.on('data',chunk=>{output+=chunk;});child.on('error',reject);child.on('exit',code=>{child.stdout.destroy();child.stderr.destroy();code===0?resolve():reject(new Error(`${name} failed (${code}): ${output}`));});});}
async function privateDirectory(){
 const account=`${process.env.USERDOMAIN}\\${process.env.USERNAME}`;
 await new Promise((resolve,reject)=>{const child=spawn(join(process.env.SystemRoot,'System32','icacls.exe'),[base,'/inheritance:r','/grant:r',`${account}:(OI)(CI)F`],{windowsHide:true,stdio:'ignore'});child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('Cannot secure local PostgreSQL directory')));});
}
const action=process.argv[2]||'start';
if(action==='stop'){if(await exists(join(data,'postmaster.pid')))await run('pg_ctl',['-D',data,'-m','fast','-w','stop']);console.log('Local PostgreSQL stopped');}
else if(action==='start'){
 await mkdir(base,{recursive:true});
 await privateDirectory();
 const initialized=await exists(join(data,'PG_VERSION'));
 let bootstrapPassword;
 if(!initialized){
  bootstrapPassword=randomBytes(32).toString('hex');
  // Recoverable bootstrap is written before init/start; it inherits the private directory ACL.
  await writeFile(join(base,'bootstrap-admin.json'),JSON.stringify({username:'astro_admin',password:bootstrapPassword}),{flag:'wx',mode:0o600});
  const passwordFile=join(base,'init-password.tmp');
  await writeFile(passwordFile,bootstrapPassword,{flag:'wx',mode:0o600});
  try{await run('initdb',['-D',data,'-U','astro_admin','--auth=scram-sha-256','--encoding=UTF8','--locale=C',`--pwfile=${passwordFile}`]);}
  finally{await unlink(passwordFile);}
 }
 if(!(await exists(join(data,'postmaster.pid'))))await run('pg_ctl',['-D',data,'-l',join(base,'postgres.log'),'-o','-h 127.0.0.1 -p 55432','-w','start']);
 if(!initialized){
  const admin=new pg.Client({connectionString:`postgresql://astro_admin:${bootstrapPassword}@127.0.0.1:55432/postgres`});await admin.connect();
  try{
   const password=randomBytes(32).toString('hex');
   // Generated hex password is the sole interpolated value; PostgreSQL role DDL does not accept bind parameters.
   await admin.query(`CREATE ROLE astro_app LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
   await admin.query('CREATE DATABASE astro_security OWNER astro_app');
   await admin.query('CREATE DATABASE astro_security_test OWNER astro_app');
   await writeFile(configPath,JSON.stringify({databaseUrl:`postgresql://astro_app:${password}@127.0.0.1:55432/astro_security`,testDatabaseUrl:`postgresql://astro_app:${password}@127.0.0.1:55432/astro_security_test`},null,2),{flag:'wx',mode:0o600});
  }finally{await admin.end();}
 }
 if(!(await exists(configPath)))throw new Error('Cluster exists but local-config.json is missing; manual recovery required');
 // Validate config without printing credentials.
 const config=JSON.parse(await readFile(configPath,'utf8'));const client=new pg.Client({connectionString:config.databaseUrl});await client.connect();await client.query('SELECT 1');await client.end();
 console.log('Local PostgreSQL ready at 127.0.0.1:55432; credentials: '+configPath);
}else throw new Error('Use start or stop');
