import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const manifest=JSON.parse(await fs.readFile(new URL('./model-manifest.json',import.meta.url)));const dir=path.resolve(process.env.BENCHECHO_MODEL_PATH||path.join(import.meta.dirname,'models/whisper-tiny.en'));let errors=0;
console.log('Node',process.version);try{console.log(execFileSync('ffmpeg',['-version'],{encoding:'utf8',timeout:5000}).split('\n')[0]);}catch{console.error('FFmpeg missing');errors++;}
try{await import(process.env.BENCHECHO_TRANSFORMERS_MODULE||'@huggingface/transformers');console.log('Transformers runtime import OK');}catch{console.error('Transformers runtime missing. Install dependencies first.');errors++;}
for(const f of manifest.files){try{const b=await fs.readFile(path.join(dir,f.path));if(b.length!==f.bytes||createHash('sha256').update(b).digest('hex')!==f.sha256)throw Error();console.log('Verified',f.path);}catch{console.error('Missing or mismatched model file:',f.path);errors++;}}
process.exitCode=errors?1:0;
