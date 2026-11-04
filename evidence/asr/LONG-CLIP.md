# Bounded long-clip regression evidence

2026-11-04. Node 24.22.1, FFmpeg 7.1.5, Transformers.js 3.8.1, pinned Whisper tiny.en q8 model revision 2575352d61be1bf7225cf8f8b268a4678025fc58. `doctor` verified every model file against `model-manifest.json` (manifest SHA256 `ca180d53ce5a9b51a6f6dbf5e31c815c5bc1a35275e682256219de2cc7bc72fb`). No model download was needed; remote-model fetching was disabled.

## Defect and bounded correction

The server accepted up to 60 seconds but passed audio to Whisper without chunk options. Transformers.js 3.8.1 defaults to no chunking; its Whisper feature extractor slices input at 480000 samples (30 seconds at 16 kHz). Speech after 30 seconds was therefore excluded from inference, not merely misrecognized.

Only clips longer than 30 seconds now pass `{chunk_length_s:30,stride_length_s:5}`. The original one-argument inference call remains for shorter clips, including exactly 30 seconds. Existing 60-second/12MB bounds, one-request gate, silent-input behavior and confirmation workflow remain unchanged.

## Actual-model observation

Existing fictional synthetic `public/samples/T1.wav` was delayed by 35 seconds using FFmpeg, resulting in 39.605 seconds. No new real-world recording or perceptual listening claim is involved.

- Original WAV SHA256: `8a6c20b4d266a6dcafca7e2cf8b89c0e68d99552261eb781441e62648c91defa`.
- Delayed WAV SHA256 with the stated FFmpeg build: `84458bd4ab79b98de3bb4ef7c790e74cb0dd675edd257bebd63e995407bfca34`.
- Unfixed server at 96d0737317ce09567bf9a0b3f96fb2ef3c35f742: HTTP 200, seconds 39.605, text `you`.
- Fixed server, same WAV and model: HTTP 200, seconds 39.605, text `you Dry lay spacing 15mm, the motor did not stall.`
- Direct-model speech-only crop, starting at 35 seconds: ` Dry lay, spacing 15mm, the motor did not stall.`

The actual-model run restores the late spoken observation but still contains a spurious `you` and a misrecognized trial name. This is not an accuracy, chunk-boundary continuity, real-user or all-format acceptance test. Users must replay and correct every draft. Native file-chooser upload remains unverified; this check used the local HTTP endpoint directly.

## Reproduce the synthetic input

From the repository root, with the model/runtime setup described in README:

```sh
ffmpeg -v error -i public/samples/T1.wav -af 'adelay=35000:all=1' -ac 1 -ar 16000 /tmp/benchecho-late-speech.wav
sha256sum public/samples/T1.wav /tmp/benchecho-late-speech.wav
npm run doctor
npm start
# In another terminal:
curl --fail-with-body --data-binary @/tmp/benchecho-late-speech.wav http://127.0.0.1:4173/api/transcribe
```

WAV container hashes may differ with FFmpeg versions. Exact ASR wording is not a CI assertion.

## Deterministic regression

`npm test`: 22 tests pass. The new HTTP test uses real FFmpeg decoding and an explicitly fake ASR loader. It verifies complete input lengths and inference argument/options at 1 second, 30 seconds, 30 seconds + 1 sample and 60 seconds; 60 seconds + 1 sample rejects before ASR. It also checks that remote-model fetching is disabled. Against the unfixed server, the test fails at 480001 samples because no chunk options are supplied. Existing tests continue to cover initialization retry, model reuse, concurrent-request rejection and inference-failure recovery.
