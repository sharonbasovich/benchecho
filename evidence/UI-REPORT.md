# Actual browser pass — 2026-11-01 23:10–23:15 UTC
Tested local managed preview http://127.0.0.1:4173 using CUA native Chromium, then supported CUA DOM controls. Synthetic fictional clips only. This is functional UI verification, NOT human usability research or perceptual listening acceptance.

PASS observed:
- Built-in three-recording action actually called Whisper backend. Three editable drafts appeared with fixed user-selected trial IDs, despite garbled spoken names.
- Native audio controls played; progress visibly advanced to4/4 and5/5 seconds. No claim audio was heard or judged aesthetically.
- Corrected T1/T2/T3 against frozen synthetic scripts; checked review; confirmed. All three source-linked cards appeared in comparison.
- Edited T3 after confirmation; it immediately left comparison and checkbox cleared.
- Export downloaded via UI. Supported download.path yielded a real file copied as export-after-edit.json. Parsed counts1,1,0; T1/T2 SHA256 exactly match original audio. T3 draft excluded.
- Baseline with both memo and notes visible: three text edits and three checkbox checks completed; subsequent T3 edit leaves its generic review checkbox checked.0 view switches. BenchEcho does not claim fewer context switches/speed; distinct benefit observed is automatic source/version linkage and stale-review invalidation. Generic spreadsheet automation could implement similar safeguards; no market novelty claim.
- Explicit race-test10s delayed-response harness: focused empty textarea and prechecked review before response. Actual draft then appeared in still-focused textarea and review became unchecked. No unseen-proposal confirmation.
- Clear during demo/pending response accepted via native confirm dialog. All trials/clips cleared, button re-enabled, no source-remains message or recreated trials in subsequent snapshots after delayed completion.
- Desktop rendering readable.175% browser zoom produced stacked controls without visible horizontal overflow in the empty race-test state. Not an actual phone/device test.

PARTIAL / UNVERIFIED:
- Ordinary user-selected file input invoked native upload approval at23:15; call remained blocked despite timeout15s and was interrupted23:24. Outcome UNKNOWN. Parent official cancellation returned already_resolved, not proof of approval or upload. Do not retry/bypass or count this path passed.
- Concurrent playback across another clip's ASR completion not isolated. Playback did remain through correction/confirmation and progressed normally.
- Manual note before delayed ASR was entered, but clear interrupted that case before isolated late-result verification; model test covers overwrite rejection, browser case not completed independently.
- Delete while pending, malformed upload UI, beforeunload and reduced-motion browser settings not yet exercised. Backend malformed WAV/playlist rejection and actual WAV/MP3/WebM decoding tested separately.
- Retained fullpage capture reviewed-fullpage.jpg was captured after browser-wide zoom changes. It shows right-edge cropping at intermediate width plus missing arrow glyph. Fixed grid min-width, action wrapping,900px stack breakpoint, and replaced unsupported glyph. Fixes need fresh render verification; do not use old screenshot as final.

No external deployment/submission. Source package still requires existing runtime/model paths; portability work next. No screenshots are uploaded to Library as deliverables; internal screenshot only.

## Portable revision retest — 23:32–23:33 UTC
Current source ec7e0c0, own bundled synthetic samples and environment-configured existing verified offline runtime. Built-in demo again produced all three real drafts; identical known errors remained (no curated replacement). At desktop1180px and populated narrow666px CSS viewport (175% desktop browser zoom), scrollWidth exactly equaled clientWidth. Actual pixels inspected: repaired logo visible, single-column layout, full source player/textbox/review/buttons visible without right-edge crop. This is responsive zoom testing, not a physical phone test. Normal browser zoom restored and preview released.

Portable package now has pinned direct dependency, model revision/file hashes, explicit bounded model downloader and doctor. Existing runtime doctor and8tests pass. Fresh dependency install/model network download remain untested. No supported CUA video recording capability found; actual recording still open, caption/demo plan prepared.
