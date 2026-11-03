# Trial-label correction verification · 2026-11-03

Correcting a saved trial name or changed-variable label now preserves its source recordings and notes, but invalidates all affected confirmations, including a deleted clip retained for Undo. Unrelated trials are unchanged. Empty/oversized input is rejected; normalized no-op edits preserve review state. Note version now also advances on trial-label changes.

## Verified

- Independent model review added five regressions: atomic input validation/no-op; confirmation invalidation; unrelated/source preservation; Undo-held clip handling; pending proposal/export behavior.
- `npm test`: 17 passing (13 state/model and 4 actual audio-decode tests). `node --check public/app.mjs` passed.
- Actual Chromium managed preview with the built-in three synthetic recordings and actual Whisper inference: edit trial while ASR finishes, retain typed editor fields, cancel via Escape then dismiss discard confirmation, save labels, verify card/selector/comparison text and focus return.
- Confirm two trial observations, edit one label: affected note remains draft, its checkbox clears, other trial stays confirmed. Actual downloaded JSON excludes affected observation and preserves the unrelated confirmed observation with source hash.
- Delete confirmed second clip, change its trial label, Undo: original audio/note restored unconfirmed. Literal `<B>` in trial name remains text. All three audio elements subsequently readyState 4, no media error, source URLs and durations preserved.
- No-op browser save reports unchanged labels; focus returns to invoking Edit button.
- Desktop screenshot inspected: modal content, focus ring, fields and actions legible, no overlap at observed viewport.

## Limits

Synthetic known-script notes are QA fixtures, not perceptual audio review. Playback/listening is not claimed. Native file-chooser upload, narrow-device layout and accepted dirty-cancel branch were not reverified in this pass. Model no-op behavior is covered independently. Existing submission and film remain unchanged.
