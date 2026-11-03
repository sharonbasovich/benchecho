import test from 'node:test';import assert from 'node:assert/strict';import {Notebook} from './public/model.mjs';
const setup=()=>{const n=new Notebook(),t=n.addTrial('A','15mm'),c=n.addClip(t,{id:'a',sha256:'abc',filename:'a.wav'});return{n,t,c};};
test('snapshots cannot mutate source or trial and drafts cannot export',()=>{const{n,t,c}=setup();const v=n.view;v.clips[0].source.id='x';v.clips[0].trialId='bad';n.proposal(c,'did not stall');assert.equal(n.view.clips[0].source.id,'a');assert.equal(n.compare()[0].observations.length,0);});
test('edits invalidate confirmation and stale ASR cannot overwrite',()=>{const{n,c}=setup();n.proposal(c,'no stall');n.confirm(c,true);assert.equal(n.compare()[0].observations.length,1);n.edit(c,'stall');assert.equal(n.compare()[0].observations.length,0);assert.throws(()=>n.proposal(c,'late'));});
test('empty proposals cannot be confirmed; interrupted clips recover',()=>{const{n,c}=setup();assert.equal(n.view.clips[0].status,'captured');n.proposal(c,'');assert.throws(()=>n.confirm(c,true));n.edit(c,'manually reviewed');assert.throws(()=>n.confirm(c,false));n.confirm(c,true);});
test('remove/reset return cleanup ids and isolate identical labels',()=>{const{n,t,c}=setup();const t2=n.addTrial('A','50mm'),c2=n.addClip(t2,{id:'b'});n.proposal(c,'15mm');n.confirm(c,true);assert.equal(n.compare()[1].observations.length,0);assert.equal(n.remove(c),'a');assert.deepEqual(n.reset(),['b']);assert.deepEqual(n.view,{trials:[],clips:[]});});
test('delete recovery restores exact confirmed version/source and position',()=>{const{n,t,c}=setup();n.proposal(c,'did not stall');n.confirm(c,true);const c2=n.addClip(t,{id:'b'}),before=n.view.clips[0];assert.equal(n.discardClip(c),null);assert.equal(n.compare()[0].observations.length,0);assert.deepEqual(n.view.clips.map(x=>x.id),[c2]);assert.equal(n.removed.id,c);const copy=n.removed;copy.text='tamper';assert.equal(n.restoreClip(),c);assert.deepEqual(n.view.clips[0],before);assert.equal(n.compare()[0].observations[0].text,'did not stall');assert.equal(n.restoreClip(),null);});
test('second delete releases only prior removed source; reset includes recoverable source',()=>{const{n,t,c}=setup();const c2=n.addClip(t,{id:'b'});n.discardClip(c);assert.equal(n.discardClip(c2),'a');assert.equal(n.restoreClip(),c2);assert.deepEqual(n.view.clips.map(x=>x.id),[c2]);n.discardClip(c2);assert.deepEqual(n.reset(),['b']);assert.equal(n.removed,null);assert.equal(n.restoreClip(),null);});
test('recovery preserves manual and unconfirmed notes without silently confirming',()=>{for(const mode of ['captured','draft','empty']){const{n,c}=setup();if(mode==='draft')n.edit(c,'manual correction');if(mode==='empty')n.edit(c,'');const before=n.view.clips[0];n.discardClip(c);n.restoreClip();assert.deepEqual(n.view.clips[0],before);assert.equal(n.compare()[0].observations.length,0);}});
test('failed repeated delete leaves last recovery intact; newer live edits remain',()=>{const{n,t,c}=setup();const other=n.addClip(t,{id:'b'});n.discardClip(c);assert.throws(()=>n.discardClip(c));n.edit(other,'newer note');n.restoreClip();assert.equal(n.view.clips.find(x=>x.id===other).text,'newer note');assert.equal(n.view.clips[0].id,c);});

test('trial-label validation is atomic and normalized no-op preserves reviews',()=>{
 const{n,t,c}=setup();n.proposal(c,'did not stall');n.confirm(c,true);
 const before=n.view;
 for(const [name,change] of [[null,'15mm'],['A',false],['','15mm'],['A',' \t '],['x'.repeat(81),'15mm'],['A','x'.repeat(121)]]){
  assert.throws(()=>n.editTrial(t,name,change));assert.deepEqual(n.view,before);
 }
 assert.throws(()=>n.editTrial('missing','A','15mm'));assert.deepEqual(n.view,before);
 assert.equal(n.editTrial(t,' A ',' 15mm '),false);assert.deepEqual(n.view,before);
 assert.equal(n.compare()[0].observations.length,1);
 assert.equal(n.editTrial(t,'x'.repeat(80),'y'.repeat(120)),true);
 assert.equal(n.view.trials[0].name.length,80);assert.equal(n.view.trials[0].change.length,120);
});

test('label correction invalidates every affected review without altering source or note',()=>{
 const{n,t,c}=setup();const c2=n.addClip(t,{id:'b',sha256:'def',filename:'b.wav'});
 const other=n.addTrial('A','15mm'),c3=n.addClip(other,{id:'c',sha256:'ghi',filename:'c.wav'});
 for(const id of [c,c2,c3]){n.proposal(id,`proposal ${id}`);n.edit(id,`corrected ${id}`);n.confirm(id,true);}
 const before=n.view;
 assert.equal(n.editTrial(t,'A corrected','50 mm spacer'),true);
 const after=n.view;assert.deepEqual(after.trials[1],before.trials[1]);assert.deepEqual(after.clips[2],before.clips[2]);
 for(let i=0;i<2;i++){
  assert.deepEqual(after.clips[i],{...before.clips[i],version:before.clips[i].version+1,confirmedVersion:null,status:'draft'});
 }
 assert.equal(n.compare()[0].observations.length,0);assert.equal(n.compare()[1].observations.length,1);
 n.confirm(c,true);const exported=JSON.parse(JSON.stringify(n.compare()));
 assert.equal(exported[0].name,'A corrected');assert.equal(exported[0].change,'50 mm spacer');
 assert.deepEqual(exported[0].observations,[{captureId:c,text:before.clips[0].text,source:before.clips[0].source,version:before.clips[0].version+1}]);
 assert.equal(exported[1].observations[0].captureId,c3);
});

test('recoverable deleted clip cannot restore a confirmation from the old trial labels',()=>{
 const{n,t,c}=setup();n.proposal(c,'no stall');n.confirm(c,true);n.discardClip(c);
 const removed=n.removed;assert.equal(n.editTrial(t,'A corrected','50mm'),true);
 assert.deepEqual(n.removed,{...removed,version:removed.version+1,confirmedVersion:null,status:'draft'});
 assert.equal(n.restoreClip(),c);assert.equal(n.compare()[0].observations.length,0);
 n.confirm(c,true);assert.equal(n.compare()[0].observations[0].text,'no stall');
 assert.equal(n.compare()[0].change,'50mm');
});

test('editing another trial and no-op edits preserve removed clip confirmation',()=>{
 const{n,t,c}=setup();n.proposal(c,'no stall');n.confirm(c,true);n.discardClip(c);const before=n.removed;
 const other=n.addTrial('other','20mm');n.editTrial(other,'other corrected','30mm');
 assert.deepEqual(n.removed,before);assert.equal(n.editTrial(t,'A','15mm'),false);assert.deepEqual(n.removed,before);
 n.restoreClip();assert.equal(n.compare()[0].observations.length,1);
});

test('pending proposal and manual states remain unconfirmed after metadata correction',()=>{
 const{n,t,c}=setup();const draft=n.addClip(t,{id:'b'}),empty=n.addClip(t,{id:'c'});
 n.edit(draft,'manual note');n.edit(empty,'');const before=n.view.clips;
 n.editTrial(t,'A revised','50mm');const after=n.view.clips;
 for(let i=0;i<3;i++)assert.deepEqual(after[i],{...before[i],version:before[i].version+1,confirmedVersion:null});
 n.proposal(c,'late proposal from the same original source');
 assert.equal(n.view.clips[0].status,'draft');assert.equal(n.compare()[0].observations.length,0);
 assert.throws(()=>n.proposal(draft,'late overwrite'));assert.equal(n.view.clips[1].text,'manual note');
});

test('revoking confirmation preserves evidence and requires explicit re-confirmation',()=>{
 const{n,c}=setup();n.proposal(c,'original proposal');n.edit(c,'corrected observation');n.confirm(c,true);
 const before=n.view.clips[0];assert.equal(n.revokeConfirmation(c),true);
 assert.deepEqual(n.view.clips[0],{...before,status:'draft',confirmedVersion:null});
 assert.equal(n.compare()[0].observations.length,0);
 assert.throws(()=>n.confirm(c,false));assert.equal(n.compare()[0].observations.length,0);
 n.confirm(c,true);assert.deepEqual(n.view.clips[0],before);
 assert.equal(n.compare()[0].observations[0].version,before.version);
});

test('revoking an unconfirmed clip is an idempotent no-op for every draft state',()=>{
 for(const state of ['captured','draft','empty','revoked']){
  const{n,c}=setup();if(state==='draft')n.proposal(c,'proposal');
  if(state==='empty')n.edit(c,'');
  if(state==='revoked'){n.proposal(c,'proposal');n.confirm(c,true);n.revokeConfirmation(c);}
  const before=n.view;assert.equal(n.revokeConfirmation(c),false);assert.equal(n.revokeConfirmation(c),false);
  assert.deepEqual(n.view,before);assert.equal(n.compare()[0].observations.length,0);
 }
});

test('delete and Undo preserve revoked review and unrelated confirmations',()=>{
 const{n,t,c}=setup();const other=n.addClip(t,{id:'b',filename:'b.wav',sha256:'def'});
 for(const id of [c,other]){n.proposal(id,'reviewed note');n.confirm(id,true);}
 const otherBefore=n.view.clips[1];n.revokeConfirmation(c);const revoked=n.view.clips[0];
 n.discardClip(c);assert.deepEqual(n.removed,revoked);n.restoreClip();
 assert.deepEqual(n.view.clips[0],revoked);assert.deepEqual(n.view.clips[1],otherBefore);
 assert.deepEqual(n.compare()[0].observations.map(o=>o.captureId),[other]);
 const before=n.view;assert.throws(()=>n.revokeConfirmation('missing'));assert.deepEqual(n.view,before);
});
