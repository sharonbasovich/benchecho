# BenchEcho · quiet post-trial review

Turn a short **quiet** bench-test recording into an editable Whisper draft, review it beside its source, and compare only observations you explicitly confirm. Editing a confirmed note removes it from the comparison until you review it again. Exported JSON keeps the source filename, SHA256 and reviewed version.

**Prototype, not a measurement instrument.** It does not infer trial IDs, extract trusted numbers, diagnose faults or assign pass/fail. Noisy input can produce entirely wrong text. The included synthetic noisy test did exactly that; see [the frozen evaluation](evidence/asr/RESULTS.md). Keep original recordings and check every number/negation. Audio playback progression is not proof an assistant listened.

## Run locally

Tested with Node24.22.1, Transformers.js3.8.1, ONNX Runtime1.21.0 and FFmpeg7.1.5. The package declares Node22+, but Node22 compatibility is untested; Node24.22.1 is the verified runtime. FFmpeg must be installed and on PATH. No account, API key, paid model or hosted AI endpoint is used.

1. Install the pinned direct dependency (no lockfile yet; transitive dependency resolution is not frozen): `npm install` (network download; verified on a fresh Ubuntu24.04 GitHub-hosted runner).
2. Download the pinned public model explicitly: `npm run setup:model` (~42MB model files, plus the separate npm runtime install). The setup script verifies every file's size and SHA256. The explicit download, all hashes, doctor and8tests passed on a fresh Ubuntu24.04 GitHub-hosted runner (Node24.22.1, FFmpeg6.1.1), run41363381594. Local development used verified cached assets.
3. Run `npm run doctor` to verify FFmpeg, runtime import and all model hashes.
4. Run `npm test`, then `npm start`. Open `http://127.0.0.1:4173/`.

The app binds localhost only. Do not expose this prototype publicly or put it behind a proxy without a separate security/authentication review. This is a Node app, not a static web page or Cloudflare Worker.

For an existing offline installation, create ignored `.env.local` with `BENCHECHO_MODEL_PATH=/absolute/path/to/whisper-tiny.en`. Optional `BENCHECHO_TRANSFORMERS_MODULE` may point to an existing compatible Transformers.js module. These local paths are not bundled. Default model directory is `models/whisper-tiny.en`. Inference has remote-model fetching disabled. The explicit setup step is separate from inference.

## Data and limits

- WAV/MP3/WebM, up to60seconds and12MB per file. One transcription at a time.
- Uploaded audio is decoded through FFmpeg stdin/stdout using an explicit demuxer and pipe-only protocol. No uploaded audio files are written by the server. Memory is not a secure-erasure guarantee.
- Browser audio and notes live in this tab's memory only. Closing/reloading loses the session; export first. Export does not embed audio, so keep the originals matching the hashes.
- All AI proposals begin unconfirmed. Spoken names never select the trial. Review cannot prove scientific truth; the app tracks what a person confirmed.
- This is for quiet **post-trial** review. Original hands-busy/noisy-workshop premise was rejected after actual evaluation. That failure is not erased by the narrower scope.

## Validation coverage

`npm test`:8 tests covering private-state isolation, stale proposal rejection, confirmation invalidation, cleanup references, and actual WAV/MP3/WebM decoding plus malformed/playlist rejection.

Actual browser: built-in3-recording → actual Whisper drafts → correction → confirmation → comparison → downloaded JSON. Exact source hashes verified; editing T3 removed it from exported observations. Delayed-response focus/precheck and clear-during-demo exercised. See `evidence/UI-REPORT.md` for precise passes/limits.

**Ordinary file-chooser upload remains unverified**: native upload approval interrupted that test. Do not interpret the built-in demo as proof that every input path passed. The silent scripted demo passed independent rendered temporal review (complete one-second coverage, scene-change checks and targeted frame-level inspection), not continuous perception or audio listening. [Watch the unlisted demo](https://youtu.be/2wey28XNSCk). It uses synthetic audio and known-script corrections. Perceptual audio review is not claimed. Submitted to [Remote Control AI](https://remote-control-ai.devpost.com/) on 2026-11-02 at 19:34 UTC; [verified project entry](https://devpost.com/software/benchecho).

## Test-only race harness

`/?race-test` visibly delays applying real ASR responses by10seconds. It does not fake output. Use to exercise pending-request edits/reset; never benchmark latency with it.

## Credits

- OpenAI Whisper tiny.en base model: https://github.com/openai/whisper (MIT).
- ONNX conversion: https://huggingface.co/onnx-community/whisper-tiny.en ; pinned revision2575352d61be1bf7225cf8f8b268a4678025fc58. Model bytes are not included in this source package.
- Hugging Face Transformers.js3.8.1 (Apache2.0), ONNX Runtime (MIT).
- FFmpeg system runtime; not redistributed. Three demo WAVs were synthesized for this project using installed FFmpeg/libflite voice `slt`; they are fictional test observations, not recordings of an actual experiment.

The full evaluation provenance retains the rejected noisy-input results and synthetic-fixture limitations; no accuracy, time-saving or market-novelty guarantee is made.
