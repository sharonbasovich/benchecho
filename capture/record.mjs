// CI-only scripted synthetic demonstration of the real app. No API stubs or mocked ASR.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
await fs.mkdir('capture-output',{recursive:true});
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'capture-output',size:{width:1440,height:900}}});
const page=await context.newPage(),errors=[],events=[];
const film=process.env.BENCHECHO_FILM==='1';let start;const at=async(seconds)=>{if(film){const delay=seconds*1000-(performance.now()-start);if(delay>0)await page.waitForTimeout(delay);}};
page.on('pageerror',e=>errors.push(String(e)));
const event=name=>events.push({name,time:new Date().toISOString()});
try {
 await page.goto('http://127.0.0.1:4173/');start=performance.now();event('opening real app');await at(18);
 await page.getByRole('button',{name:'Try 3 synthetic recordings',exact:true}).click();
 await page.locator('.clip').nth(2).locator('textarea').waitFor({state:'visible',timeout:120000});
 await page.waitForFunction(()=>document.querySelectorAll('.clip').length===3&&[...document.querySelectorAll('.clip textarea')].every(x=>x.value.trim()),{},{timeout:120000});
 event('three actual ASR drafts visible');
 await page.locator('.clip textarea').nth(0).scrollIntoViewIfNeeded();event('raw first draft visibly held');
 const raw=await page.locator('.clip textarea').evaluateAll(es=>es.map(e=>e.value));
 await fs.writeFile('capture-output/raw-drafts.json',JSON.stringify(raw,null,2));
 await page.screenshot({path:'capture-output/drafts.png',fullPage:true});
 // Known fictional fixture scripts, not a claim of human listening or real measurements.
 await at(42);
 const corrected=['Trial A, spacing fifteen millimeters. The motor did not stall.','Trial B, spacing fifty millimeters. The motor did stall.','Trial A two. It slipped twice—correction, three times. No crack was visible.'];
 for(let i=0;i<3;i++){
  await at(42+i*9);const card=page.locator('.clip').nth(i);
  await card.locator('textarea').scrollIntoViewIfNeeded();await at(45+i*9);event('raw draft shown before correction '+i);
  await card.locator('textarea').fill(corrected[i]);
  await card.getByRole('checkbox').check();
  await card.getByRole('button',{name:'Confirm observation',exact:true}).click();
  assert.equal(await card.getByRole('checkbox').isChecked(),true);
 }
 assert.equal(await page.locator('#count').innerText(),'3 confirmed');event('scripted correction and confirmation');
 await at(72);await page.locator('#comparison').scrollIntoViewIfNeeded();await page.screenshot({path:'capture-output/comparison.png'});
 await at(87);await page.locator('.clip textarea').nth(2).fill(corrected[2]+' Review pending.');
 assert.equal(await page.locator('#count').innerText(),'2 confirmed');assert.equal(await page.locator('.clip').nth(2).getByRole('checkbox').isChecked(),false);event('edit invalidates confirmation');
 await at(94);await page.locator('#comparison').scrollIntoViewIfNeeded();await at(104);
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;await download.saveAs('capture-output/evidence.json');
 const exported=JSON.parse(await fs.readFile('capture-output/evidence.json','utf8'));
 assert.deepEqual(exported.trials.map(t=>t.observations.length),[1,1,0]);
 for(let i=0;i<2;i++)assert.equal(exported.trials[i].observations[0].source.sha256,createHash('sha256').update(await fs.readFile(`public/samples/T${i+1}.wav`)).digest('hex'));
 assert.deepEqual(errors,[]);event('export source hashes verified');
 await at(115);await page.locator('.notice').scrollIntoViewIfNeeded();event('visible limitations');await at(135);
 await fs.writeFile('capture-output/audit.json',JSON.stringify({commit:process.env.GITHUB_SHA||'unknown',events,errors,film,elapsedSeconds:(performance.now()-start)/1000,scope:'Scripted synthetic UI capture with real offline Whisper, not human perceptual review or polished final 2–3 minute film',rawDrafts:raw,exportCounts:[1,1,0]},null,2));
} catch (error) {
 await fs.writeFile('capture-output/failure.json',JSON.stringify({error:String(error),events,errors},null,2));
 await page.screenshot({path:'capture-output/failure.png'}).catch(()=>{});
 throw error;
} finally {await context.close();await browser.close();}
