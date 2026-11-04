import {open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';

export const LIMITS = Object.freeze({manifestBytes: 4 * 1024 * 1024, audioBytes: 12 * 1024 * 1024, files: 256, totalBytes: 512 * 1024 * 1024, observations: 10000});
export const NOTICE = 'Byte matches only. This does not authenticate the manifest, establish who reviewed it, or verify observations, measurements, or audio content.';
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };

// All paths originate in caller arguments, never in manifest fields.
async function readBounded(path, limit, consume) {
  requireThat(typeof path === 'string' && path.length > 0, 'Expected an explicit file path.');
  const file = await open(path, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    const before = await file.stat({bigint: true});
    requireThat(before.isFile(), 'Only regular files are supported.');
    requireThat(before.size <= BigInt(limit), `File exceeds ${limit} byte read limit.`);
    const buffer = Buffer.alloc(64 * 1024);
    let size = 0;
    while (true) {
      const {bytesRead} = await file.read(buffer, 0, Math.min(buffer.length, limit - size + 1), null);
      if (!bytesRead) break;
      size += bytesRead;
      requireThat(size <= limit, `File exceeds ${limit} byte read limit.`);
      consume(buffer.subarray(0, bytesRead));
    }
    const after = await file.stat({bigint: true});
    requireThat(before.size === after.size && BigInt(size) === after.size && before.mtimeNs === after.mtimeNs && before.ctimeNs === after.ctimeNs, 'File changed while being read; retry with stable files.');
    return size;
  } finally { await file.close(); }
}

export function sourcesFromManifest(manifest) {
  requireThat(object(manifest) && manifest.format === 'benchecho-reviewed-observations-v1', 'Unsupported or missing manifest format.');
  requireThat(Array.isArray(manifest.trials), 'Manifest trials must be an array.');
  const sources = [];
  manifest.trials.forEach((trial, trialIndex) => {
    requireThat(object(trial) && Array.isArray(trial.observations), `Trial ${trialIndex} must contain observations.`);
    trial.observations.forEach((observation, observationIndex) => {
      const location = `trials[${trialIndex}].observations[${observationIndex}]`;
      requireThat(object(observation) && object(observation.source), `${location} must contain a source.`);
      const {filename, sha256} = observation.source;
      requireThat(typeof filename === 'string', `${location}.source.filename must be a string.`);
      requireThat(typeof sha256 === 'string' && /^[a-fA-F0-9]{64}$/.test(sha256), `${location}.source.sha256 must be a full SHA256 hex digest.`);
      requireThat(sources.length < LIMITS.observations, 'Observation count exceeds verifier limit.');
      sources.push({location, filename, sha256: sha256.toLowerCase()});
    });
  });
  return sources;
}

export async function verify(manifestPath, audioPaths = []) {
  requireThat(Array.isArray(audioPaths) && audioPaths.length <= LIMITS.files, `Supply at most ${LIMITS.files} audio paths.`);
  const chunks = [];
  await readBounded(manifestPath, LIMITS.manifestBytes, chunk => chunks.push(Buffer.from(chunk)));
  let manifest;
  try { manifest = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(Buffer.concat(chunks))); }
  catch { throw new Error('Manifest must be valid UTF-8 JSON.'); }
  const sources = sourcesFromManifest(manifest);
  const files = [];
  let totalBytes = 0;
  for (const path of [...new Set(audioPaths)]) {
    try {
      const hash = createHash('sha256');
      const size = await readBounded(path, Math.min(LIMITS.audioBytes, LIMITS.totalBytes - totalBytes), chunk => { totalBytes += chunk.length; hash.update(chunk); });
      files.push({path, size, sha256: hash.digest('hex')});
    } catch (error) { files.push({path, error: error.message}); }
  }
  const byHash = new Map();
  for (const [index, file] of files.entries()) if (file.sha256) {
    if (!byHash.has(file.sha256)) byHash.set(file.sha256, []);
    byHash.get(file.sha256).push(index);
  }
  const observations = sources.map(source => ({...source, status: byHash.has(source.sha256) ? 'matched' : 'missing', matchingFileIndex: byHash.get(source.sha256)?.[0] ?? null, matchingFileCount: byHash.get(source.sha256)?.length ?? 0}));
  const expected = new Set(sources.map(source => source.sha256));
  const unmatchedFiles = files.filter(file => file.sha256 && !expected.has(file.sha256)).map(file => file.path);
  const missing = observations.filter(observation => observation.status === 'missing').length;
  const errors = files.filter(file => file.error).length;
  // Empty manifests are accepted structurally, but do not count as successful evidence verification.
  const exitCode = errors ? 2 : missing || sources.length === 0 ? 1 : 0;
  return {format: 'benchecho-byte-check-v1', notice: NOTICE, exitCode, summary: {observations: sources.length, matched: sources.length - missing, missing, fileErrors: errors, unmatchedFiles: unmatchedFiles.length}, observations, files, unmatchedFiles};
}
