import {createServer} from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import {decode,formatOf} from './audio.mjs';
const {pipeline,env}=await import(process.env.BENCHECHO_TRANSFORMERS_MODULE||'@huggingface/transformers');
const root=import.meta.dirname;
env.allowRemoteModels=false;env.useFSCache=false;let asr,loading,busy=false;
async function model(){if(!asr){loading??=pipeline('automatic-speech-recognition',path.resolve(process.env.BENCHECHO_MODEL_PATH||path.join(root,'models/whisper-tiny.en')),{dtype:'q8',device:'cpu',session_options:{intraOpNumThreads:1}});asr=await loading;}return asr;}
const send=(res,status,obj)=>res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(obj));
createServer(async(req,res)=>{try{
const p=new URL(req.url,'http://localhost').pathname;
if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host||''))return send(res,403,{error:'Local host required.'});
if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return send(res,403,{error:'Same origin required.'});
if(p==='/api/transcribe'&&req.method==='POST'){
 if(busy)return send(res,409,{error:'Another clip is processing. Please retry.'});busy=true;
 try{const chunks=[];let size=0;for await(const b of req){size+=b.length;if(size>12*1024*1024)throw Error('File exceeds12MB.');chunks.push(b);}if(!size)throw Error('Empty audio file.');const bytes=Buffer.concat(chunks),stdout=await decode(bytes,formatOf(bytes));const a=new Float32Array(stdout.buffer,stdout.byteOffset,stdout.length/4);if(a.length>16000*60)throw Error('Use a clip of60seconds or less.');if(!a.length)throw Error('No audio found.');const rms=Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length);
 const t=performance.now();const result=rms===0?{text:''}:await(await model())(a);send(res,200,{text:result.text.trim(),seconds:a.length/16000,elapsedMs:performance.now()-t,engine:'Whisper tiny.en q8; server-local inference',warning:'Draft only. Replay and correct numbers, negation and names.'});
 }catch(e){send(res,400,{error:e.message.includes('ffmpeg')?'Audio could not be decoded. Try WAV, MP3 or WebM.':e.message});}finally{busy=false;}return;
}
if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
let file;if(p.startsWith('/samples/')&&/^\/samples\/T[123]\.wav$/.test(p))file=path.resolve(root,'public/samples',path.basename(p));else if(['/','/app.mjs','/model.mjs','/style.css','/baseline.html'].includes(p))file=path.join(root,'public',p==='/'?'index.html':p.slice(1));else return send(res,404,{error:'Not found'});
res.writeHead(200,{'Content-Type':({'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.wav':'audio/wav'})[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(await fs.readFile(file));
}catch(e){send(res,500,{error:'Request failed.'});}}).listen(Number(process.env.PORT||4173),'127.0.0.1');
