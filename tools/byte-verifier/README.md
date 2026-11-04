# BenchEcho offline byte verifier

Check whether the original bytes referenced by a BenchEcho JSON export are among files you explicitly supply. No installation, model, FFmpeg, network, or third-party dependencies. Requires Node.js 22+.

```sh
node tools/byte-verifier/cli.mjs ./benchecho-evidence.json ./recordings/one.wav ./recordings/renamed.webm
node tools/byte-verifier/cli.mjs --help
node --test tools/byte-verifier/verify.test.mjs
```

Every positional argument is a literal path. Quote paths with spaces. The tool does not expand globs or scan directories (your shell may expand globs before invocation). No audio paths are required: omitting them reports missing sources. For a manifest literally named `--help`, use `./--help`.

The CLI emits JSON to stdout. A manifest/usage failure emits an error to stderr. Programmatic use:

```js
import {verify} from './tools/byte-verifier/verify.mjs';
const result = await verify('evidence.json', ['recording.wav']);
```

## Reading results

- Exit **0**: every referenced observation's SHA256 has at least one byte-identical supplied file, and all supplied files could be checked.
- Exit **1**: one or more referenced digests are missing, or the manifest contains no observations. An empty export is not evidence of a successful check.
- Exit **2**: invalid/unsupported manifest, usage/limit error, or a supplied file could not be checked. Readable files are still reported if an individual audio read fails. The module throws for manifest/argument errors and returns `exitCode: 2` for per-file errors.
- `observations` identifies each reference by its JSON location. `matchingFileIndex` is the zero-based index of the first matching entry in `files` (null if missing), and `matchingFileCount` counts supplied paths with that digest. All matches are discoverable in `files` by SHA256.
- `files` includes each unique literal supplied path, its digest and byte count, or a read error.
- `unmatchedFiles` lists supplied bytes not referenced by any observation. These are informational and do not alone cause failure.

A changed recording typically produces both a missing reference and an unmatched supplied file. The tool does not assert that a particular unmatched file was modified: filenames cannot establish that relationship. Renaming files does not affect matching. Two observations with the same filename but different content remain distinct. Reused content can satisfy multiple references; that does not establish independent recordings.

## Guarantees and limits

Only explicit command/module file paths are opened. Manifest filenames, IDs, and other fields are never interpreted as paths or URLs. Files are opened read-only; no input or output files are written by the verifier. Only regular files are accepted. An explicitly supplied symbolic link may resolve to a regular file, and parent-directory links are resolved by the operating system. Use trusted local file paths; this is not a filesystem sandbox or protection against hostile concurrent filesystem changes.

Reads use 64 KiB buffers. The manifest is limited to 4 MiB and parsed as strict UTF-8 JSON. Each supplied recording is limited to 12 MiB, matching the current app's byte cap. Operational limits are 256 supplied paths, 512 MiB total audio bytes consumed, and 10,000 observations. These are verifier safety limits, not claims about the export schema. A stable-file metadata check detects ordinary changes during a read; it is not an atomic snapshot or adversarial tamper guarantee. Files on slow/network-mounted filesystems may still block on OS I/O; no wall-clock timeout is promised.

Validation checks the v1 format marker, trial/observation containers, string filename and full SHA256 digest. Unknown fields are allowed. It deliberately does not invent UUID, date, review-version, text-length, or signature requirements, nor validate all other exported metadata. Empty trials are allowed. Uppercase hex is accepted and normalized.

**Byte matches do not authenticate the manifest, establish who reviewed it, or verify observations, measurements, audio validity, dates, trial labels, or transcription quality.** Anyone who can alter the manifest can replace its hashes and notes. A matching hash only compares supplied bytes to the digest the manifest declares. Store original recordings and a trusted copy of the export separately. No audio decoding or inference occurs.

## Compatibility and evidence

Current public main was verified as `ffe2ef527b0f71c1885414a9bd237fc25f8f321d` on 2026-11-04. The exporter at [public/app.mjs](https://github.com/sharonbasovich/benchecho/blob/ffe2ef527b0f71c1885414a9bd237fc25f8f321d/public/app.mjs) emits `benchecho-reviewed-observations-v1`, with `trials: n.compare()` and `source.sha256` over the original attached bytes.

Tests import the repository's actual `public/model.mjs`, call `Notebook.compare()`, and wrap the result in the export envelope. The verifier itself imports Node built-ins only.

Synthetic tests cover renamed content, duplicate filenames/content, modified bytes, malicious manifest paths, malformed UTF-8/JSON/schema, empty observations/trials, extra/missing/unreadable files, directories, oversized inputs, explicit symlinks, POSIX FIFO rejection, and CLI statuses. Synthetic byte fixtures are not an audio-quality or real-user test. No app UI, model, or inference dependencies are changed. Commands above run from the repository root.
