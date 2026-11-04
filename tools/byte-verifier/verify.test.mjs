import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, readFile, mkdir, rm, truncate, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {Notebook} from '../../public/model.mjs';
import {verify, sourcesFromManifest, LIMITS} from './verify.mjs';
const digest = data => createHash('sha256').update(data).digest('hex');
const envelope = trials => ({format:'benchecho-reviewed-observations-v1',createdAt:new Date().toISOString(),notice:'Human-confirmed notes, not verified measurements. Audio is not embedded; retain original files matching SHA256.',trials});
async function setup(t, entries = [{filename:'source.wav', bytes:Buffer.from('synthetic byte fixture, not audio') }]) {
  const dir = await mkdtemp(join(tmpdir(), 'benchecho-verifier-'));
  t.after(() => rm(dir,{recursive:true,force:true}));
  const n = new Notebook();
  const trial = n.addTrial('Synthetic fixture', 'byte integrity');
  n.addTrial('Unreviewed trial', 'must allow empty observations');
  for (const entry of entries) {
    const id = n.addClip(trial,{id:crypto.randomUUID(),filename:entry.filename,sha256:digest(entry.bytes)});
    n.proposal(id,'Synthetic observation.'); n.confirm(id,true);
  }
  const manifest = join(dir,'evidence.json');
  const data = envelope(n.compare());
  await writeFile(manifest,JSON.stringify(data));
  return {dir,manifest,data,entries};
}

test('actual Notebook.compare output matches renamed bytes and leaves inputs unchanged',async t => {
  const x = await setup(t); const audio = join(x.dir,'renamed.bin');
  await writeFile(audio,x.entries[0].bytes);
  const before = await readFile(x.manifest);
  const r = await verify(x.manifest,[audio]);
  assert.equal(r.exitCode,0); assert.equal(r.files[r.observations[0].matchingFileIndex].path,audio);
  assert.deepEqual(await readFile(audio),x.entries[0].bytes); assert.deepEqual(await readFile(x.manifest),before);
});
test('duplicate filenames and duplicate content use digests, never names',async t => {
  const x = await setup(t,[{filename:'same.wav',bytes:Buffer.from('one')},{filename:'same.wav',bytes:Buffer.from('two')},{filename:'different.wav',bytes:Buffer.from('one')}]);
  const a = join(x.dir,'a'); const b = join(x.dir,'b');
  await writeFile(a,'one'); await writeFile(b,'two');
  const r = await verify(x.manifest,[b,a,a]);
  assert.equal(r.exitCode,0); assert.equal(r.files.length,2);
  assert.deepEqual(r.observations.map(o=>r.files[o.matchingFileIndex].path),[a,b,a]);
});
test('modified same-name bytes report missing reference and unmatched supplied file',async t => {
  const x = await setup(t); const audio = join(x.dir,'source.wav');
  await writeFile(audio,Buffer.concat([x.entries[0].bytes,Buffer.from('modified')]));
  const r = await verify(x.manifest,[audio]);
  assert.equal(r.exitCode,1); assert.equal(r.summary.missing,1); assert.deepEqual(r.unmatchedFiles,[audio]);
});
test('manifest paths are never opened, even when absolute and valid',async t => {
  const x = await setup(t); const audio = join(x.dir,'outside.wav');
  await writeFile(audio,x.entries[0].bytes);
  x.data.trials[0].observations[0].source.filename = audio;
  await writeFile(x.manifest,JSON.stringify(x.data));
  const r = await verify(x.manifest,[]);
  assert.equal(r.exitCode,1); assert.deepEqual(r.files,[]); assert.equal(r.summary.missing,1);
  x.data.trials[0].observations[0].source.filename = '../../escape.wav\u001b[31m';
  await writeFile(x.manifest,JSON.stringify(x.data));
  assert.equal((await verify(x.manifest,[audio])).exitCode,0);
});
test('malformed manifests fail before reading supplied files',async t => {
  const x = await setup(t);
  for (const data of ['{', 'null', JSON.stringify({format:'unknown',trials:[]}), JSON.stringify(envelope([{}])), JSON.stringify(envelope([{observations:[{source:{filename:'x',sha256:'abc'}}]}]))]) {
    await writeFile(x.manifest,data); await assert.rejects(verify(x.manifest,['does-not-exist']));
  }
  await writeFile(x.manifest,Buffer.from([0xff])); await assert.rejects(verify(x.manifest),/UTF-8 JSON/);
});
test('empty observations do not yield a misleading success',async t => {
  const x = await setup(t); await writeFile(x.manifest,JSON.stringify(envelope([{observations:[]}])));
  const r = await verify(x.manifest); assert.equal(r.exitCode,1); assert.equal(r.summary.observations,0);
});
test('extra valid files are informational; unreadable extras make result incomplete',async t => {
  const x = await setup(t); const a = join(x.dir,'a'); const b = join(x.dir,'b');
  await writeFile(a,x.entries[0].bytes); await writeFile(b,'extra');
  assert.equal((await verify(x.manifest,[a,b])).exitCode,0);
  const r = await verify(x.manifest,[a,join(x.dir,'missing')]);
  assert.equal(r.exitCode,2); assert.equal(r.summary.matched,1); assert.equal(r.summary.fileErrors,1);
});
test('directory and oversized inputs reject; limits cover manifest and argument count',async t => {
  const x = await setup(t); const large=join(x.dir,'large'); await writeFile(large,''); await truncate(large,LIMITS.audioBytes+1);
  const r = await verify(x.manifest,[x.dir,large]); assert.equal(r.exitCode,2); assert.equal(r.summary.fileErrors,2);
  await assert.rejects(verify(x.manifest,Array(LIMITS.files+1).fill(large)),/at most/);
  await truncate(x.manifest,LIMITS.manifestBytes+1); await assert.rejects(verify(x.manifest),/read limit/);
});
test('explicit symlink to regular file is supported; FIFO does not block',async t => {
  const x = await setup(t); const a=join(x.dir,'a'), link=join(x.dir,'link');
  await writeFile(a,x.entries[0].bytes); await symlink(a,link);
  assert.equal((await verify(x.manifest,[link])).exitCode,0);
  if (process.platform !== 'win32') {
    const fifo=join(x.dir,'fifo'); assert.equal(spawnSync('mkfifo',[fifo]).status,0);
    const r=spawnSync(process.execPath,['cli.mjs',x.manifest,fifo],{cwd:import.meta.dirname,timeout:3000,encoding:'utf8'});
    assert.equal(r.status,2); assert.match(r.stdout,/regular files/);
  }
});
test('minimal fields and case-insensitive SHA256 are accepted without invented review constraints',() => {
  const r=sourcesFromManifest(envelope([{observations:[{source:{filename:'',sha256:'AB'.repeat(32)},version:0}]}]));
  assert.equal(r[0].sha256,'ab'.repeat(32));
});
test('CLI help, JSON result and exit codes',async t => {
  const x=await setup(t); const a=join(x.dir,'audio'); await writeFile(a,x.entries[0].bytes);
  const run=args=>spawnSync(process.execPath,['cli.mjs',...args],{cwd:import.meta.dirname,encoding:'utf8'});
  assert.equal(run(['--help']).status,0); assert.equal(run([]).status,2);
  const success=run([x.manifest,a]); assert.equal(success.status,0); assert.equal(JSON.parse(success.stdout).summary.matched,1);
  assert.equal(run([x.manifest]).status,1); await writeFile(x.manifest,'{'); assert.equal(run([x.manifest]).status,2);
});
test('match index remains correct after a file read error',async t => {
  const x=await setup(t); const a=join(x.dir,'a'); await writeFile(a,x.entries[0].bytes);
  const r=await verify(x.manifest,[join(x.dir,'absent'),a]);
  assert.equal(r.observations[0].matchingFileIndex,1); assert.equal(r.observations[0].matchingFileCount,1); assert.equal(r.files[1].path,a);
});
test('repeated references and aliases produce compact JSON, not path cross-products',async t => {
  const x=await setup(t); const a=join(x.dir,'audio'); await writeFile(a,x.entries[0].bytes);
  const observation=x.data.trials[0].observations[0];
  x.data.trials[0].observations=Array.from({length:LIMITS.observations},()=>observation);
  await writeFile(x.manifest,JSON.stringify(x.data));
  const paths=Array.from({length:LIMITS.files},(_,i)=>x.dir+'/'+ './'.repeat(i+1)+'audio');
  const r=await verify(x.manifest,paths);
  assert.equal(r.exitCode,0); assert.equal(r.observations[0].matchingFileCount,256);
  assert.ok(Buffer.byteLength(JSON.stringify(r)) < 5*1024*1024);
  x.data.trials[0].observations.push(observation);
  assert.throws(()=>sourcesFromManifest(x.data),/Observation count/);
});
test('exact audio limit works and aggregate read budget is enforced',async t => {
  const x=await setup(t); const a=join(x.dir,'audio'); await writeFile(a,''); await truncate(a,LIMITS.audioBytes);
  x.data.trials[0].observations[0].source.sha256=digest(Buffer.alloc(LIMITS.audioBytes));
  await writeFile(x.manifest,JSON.stringify(x.data));
  const paths=Array.from({length:44},(_,i)=>x.dir+'/'+ './'.repeat(i+1)+'audio');
  const r=await verify(x.manifest,paths);
  assert.equal(r.files[0].size,LIMITS.audioBytes); assert.equal(r.observations[0].matchingFileCount,42);
  assert.equal(r.exitCode,2); assert.equal(r.summary.fileErrors,2);
  assert.match(r.files[42].error,/read limit/);
});
