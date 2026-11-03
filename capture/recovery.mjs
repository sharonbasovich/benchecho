// Real Chromium + real local Whisper, using synthetic repository audio only.
import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
await fs.mkdir('recovery-output',{recursive:true});
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:4173/');await page.locator('#demo').click();
 await expect(page.locator('.clip')).toHaveCount(3,{timeout:120000});await expect(page.locator('.clip textarea').last()).not.toHaveValue('',{timeout:120000});
 const first=page.locator('.clip').first();await first.locator('textarea').fill('Known synthetic script: motor did not stall.');await first.locator('[data-review]').check();await first.locator('[data-confirm]').click();
 // Withdrawal must remove evidence immediately without losing source or note.
 const second=page.locator('.clip').nth(1);
 await second.locator('textarea').fill('Second synthetic observation for export exclusion.');
 await second.locator('[data-review]').check();await second.locator('[data-confirm]').click();
 const confirmed=await first.evaluate(e=>({id:e.dataset.id,version:e.dataset.version,text:e.querySelector('textarea').value,src:e.querySelector('audio').src}));
 await first.locator('[data-review]').press('Space');
 await expect(first.locator('[data-review]')).not.toBeChecked();await expect(first.locator('[data-review]')).toBeFocused();
 await expect(first.locator('.tag')).toHaveText('draft');await expect(page.locator('#count')).toHaveText('1 confirmed');
 assert.deepEqual(await first.evaluate(e=>({id:e.dataset.id,version:e.dataset.version,text:e.querySelector('textarea').value,src:e.querySelector('audio').src})),confirmed);
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();
 const exported=JSON.parse(await fs.readFile(await(await downloadPromise).path(),'utf8'));
 assert.equal(exported.trials.flatMap(t=>t.observations).some(o=>o.captureId===confirmed.id),false);
 assert.equal(exported.trials.flatMap(t=>t.observations).length,1);
 await first.locator('[data-delete]').click();await page.locator('#undo-delete').click();
 await expect(first.locator('[data-review]')).not.toBeChecked();await expect(first.locator('.tag')).toHaveText('draft');
 await first.locator('[data-review]').check();await expect(page.locator('#count')).toHaveText('1 confirmed');
 await first.locator('[data-confirm]').click();await expect(page.locator('#count')).toHaveText('2 confirmed');
 await second.locator('[data-review]').uncheck();await expect(page.locator('#count')).toHaveText('1 confirmed');
 await first.locator('[data-review]').uncheck();await expect(page.locator('#count')).toHaveText('0 confirmed');await expect(page.locator('#export')).toBeDisabled();
 await first.locator('[data-review]').check();await expect(page.locator('#export')).toBeDisabled();
 await first.locator('[data-confirm]').click();await expect(page.locator('#count')).toHaveText('1 confirmed');
 const before=await first.evaluate(e=>({id:e.dataset.id,version:e.dataset.version,text:e.querySelector('textarea').value,src:e.querySelector('audio').src}));
 await first.locator('audio').evaluate(e=>{e.currentTime=1;e.playbackRate=.25;});await first.locator('[data-delete]').click();
 await expect(page.locator('#undo-delete')).toBeFocused();await expect(page.locator('#count')).toHaveText('0 confirmed');await page.locator('#undo-delete').press('Enter');
 await expect(first.locator('textarea')).toBeFocused();await expect(page.locator('#count')).toHaveText('1 confirmed');
 assert.deepEqual(await first.evaluate(e=>({id:e.dataset.id,version:e.dataset.version,text:e.querySelector('textarea').value,src:e.querySelector('audio').src})),before);
 await expect.poll(()=>first.locator('audio').evaluate(e=>e.readyState)).toBeGreaterThan(0);
 assert.equal(await first.locator('audio').evaluate(e=>e.paused),true);assert.equal(await first.locator('audio').evaluate(e=>e.currentTime),1);assert.equal(await first.locator('audio').evaluate(e=>e.playbackRate),.25);
 const restoredBytes=await first.locator('audio').evaluate(async e=>Array.from(new Uint8Array(await(await fetch(e.src)).arrayBuffer())));
 assert.equal(createHash('sha256').update(Buffer.from(restoredBytes)).digest('hex'),createHash('sha256').update(await fs.readFile('public/samples/T1.wav')).digest('hex'));
 await first.locator('audio').evaluate(e=>e.play());await expect.poll(()=>first.locator('audio').evaluate(e=>e.currentTime)).toBeGreaterThan(1);
 // Removing a different card must not replace or reset the playing source.
 const playingSource=await first.locator('audio').getAttribute('src');await page.locator('.clip').last().locator('[data-delete]').click();await page.locator('#undo-delete').click();
 assert.equal(await first.locator('audio').getAttribute('src'),playingSource);assert.equal(await first.locator('audio').evaluate(e=>e.paused),false);
 await first.locator('audio').evaluate(e=>e.pause());
 // Only newest removal can be recovered; existing later edits survive.
 await first.locator('[data-delete]').click();await page.locator('.clip').last().locator('[data-delete]').click();await page.locator('.clip textarea').first().fill('Later correction');await page.locator('#undo-delete').click();
 await expect(page.locator('.clip')).toHaveCount(2);await expect(page.locator('.clip textarea').first()).toHaveValue('Later correction');await expect(page.locator('.clip').last().locator('[data-review]')).not.toBeChecked();
 await page.setViewportSize({width:390,height:844});await page.locator('.clip').last().locator('[data-delete]').click();await page.screenshot({path:'recovery-output/narrow-undo.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('#undo-delete').press('Enter');
 // Real delayed response, delete then immediately Undo must not resurrect the old proposal.
 const race=await context.newPage();race.on('pageerror',e=>errors.push(String(e)));await race.goto('http://127.0.0.1:4173/?race-test');await race.locator('#demo').click();await expect(race.locator('.clip')).toHaveCount(1);
 await race.locator('.clip [data-delete]').click();await race.locator('#undo-delete').click();
 await expect(race.locator('.clip')).toHaveCount(3,{timeout:120000});await expect(race.locator('#demo')).toBeEnabled({timeout:120000});
 await expect(race.locator('.clip textarea').first()).toHaveValue('');await expect(race.locator('.clip .tag').first()).toHaveText('captured');
 await race.locator('.clip [data-retry]').first().click();await expect(race.locator('.clip textarea').first()).not.toHaveValue('',{timeout:120000});
 await race.locator('.clip [data-delete]').first().click();race.once('dialog',d=>d.dismiss());await race.locator('#reset').click();await expect(race.locator('#undo-delete')).toBeVisible();
 race.once('dialog',d=>d.accept());await race.locator('#reset').click();await expect(race.locator('.clip')).toHaveCount(0);await expect(race.locator('#recovery')).toBeHidden();
 assert.deepEqual(errors,[]);await fs.writeFile('recovery-output/result.json',JSON.stringify({passed:true,checks:['keyboard withdrawal removes export eligibility','revoked source/note/version preserved','revocation survives delete and undo','checking alone cannot reconfirm','zero-confirmed export disabled','exact confirmed source/version/text recovery','audio byte hash parity','paused time/rate recovery','actual restored playback','other source continuity','latest-only deletion','newer edit survival','keyboard focus','390px no overflow','late real ASR blocked','explicit retry works','clear cancel and clear recovery'],errors},null,2));
}finally{await browser.close();}
