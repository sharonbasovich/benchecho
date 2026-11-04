import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import fs from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';

// HTTP integration with real FFmpeg decoding and explicitly fake ASR.
// No model download or inference-quality claim is involved.
test('failed model loading can retry; successful model stays cached and busy always recovers', {timeout: 20000}, async t => {
  const reservation = createServer().listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const events = [];
  let output = '', exited = false;
  const child = fork(new URL('./server.mjs', import.meta.url), [], {
    env: {...process.env, PORT: String(port), BENCHECHO_TRANSFORMERS_MODULE: new URL('./test-fixtures/transformers-retry.mjs', import.meta.url).href},
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  child.stdout.on('data', b => { output += b; });
  child.stderr.on('data', b => { output += b; });
  child.on('message', message => events.push(message));
  child.on('exit', () => { exited = true; });
  t.after(async () => {
    if (!exited) {
      const stopped = once(child, 'exit');
      child.kill();
      await stopped;
    }
  });
  const waitFor = async predicate => {
    const deadline = Date.now() + 5000;
    while (!(await predicate())) {
      assert.equal(exited, false, `Server exited: ${output}`);
      assert.ok(Date.now() < deadline, `Server condition timed out: ${output}`);
      await delay(10);
    }
  };
  const base = `http://127.0.0.1:${port}`;
  await waitFor(async () => {
    try { return (await fetch(base, {signal: AbortSignal.timeout(500)})).ok; }
    catch { return false; }
  });
  const audio = await fs.readFile(new URL('./public/samples/T1.wav', import.meta.url));
  const post = async () => {
    const response = await fetch(`${base}/api/transcribe`, {method: 'POST', body: audio, signal: AbortSignal.timeout(10000)});
    return {status: response.status, body: await response.json()};
  };
  const first = post();
  await waitFor(() => events.some(e => e.event === 'loading'));
  assert.equal((await post()).status, 409, 'initialization holds the busy guard');
  child.send('release initialization');
  assert.deepEqual(await first, {status: 400, body: {error: 'Injected local model initialization failure'}});

  const retry = post();
  // Observe either retry entry or its early failure, so the unfixed server fails
  // directly rather than waiting for a nonexistent fixture event.
  let earlyResult;
  retry.then(result => { earlyResult = result; });
  await waitFor(() => earlyResult || events.some(e => e.event === 'inference'));
  assert.equal(earlyResult, undefined, 'retry must initialize again, not replay the cached rejection');
  assert.equal((await post()).status, 409, 'inference holds the busy guard');
  child.send('release inference');
  const recovered = await retry;
  assert.equal(recovered.status, 200);
  assert.equal(recovered.body.text, 'fixture load 2, call 1');
  assert.ok(recovered.body.seconds > 0, 'non-silent audio was actually decoded');

  assert.deepEqual(await post(), {status: 400, body: {error: 'Injected inference failure'}});
  const cached = await post();
  assert.equal(cached.status, 200, 'busy guard clears after inference failure');
  assert.equal(cached.body.text, 'fixture load 2, call 3');
  assert.deepEqual(events.filter(e => e.event === 'loaded'), [{event: 'loaded', load: 2}], 'successful model is reused');
});
