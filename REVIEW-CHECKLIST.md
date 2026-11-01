# Acceptance checklist — pending browser handoff
Version lineage: noisy hands-busy BenchEcho rejected; quiet post-trial comparator is a separately frozen experiment.

Completed:
- Independent source review, six substantive issues found and repaired before delivery.
- Seven actual Node tests pass (four state, three memory decoder).
- Actual independent synthetic ASR corpus preserved separately; failure not retuned or concealed.

Must exercise in actual browser before GO:
1. Three synthetic clips: actual inference returns visible editable drafts. Selected trial IDs stay correct despite garbled spoken labels.
2. Confirm corrected notes; comparison/export source hashes match originals. No unconfirmed notes exported.
3. Edit a confirmed note; confirmation clears and observation disappears until re-confirmed.
4. While ASR pending, focus empty textarea and precheck review; completed proposal appears visibly and review checkbox clears. Manual typing prevents late overwrite.
5. Play/edit one clip while another completes; playback node and focus remain intact.
6. Clear during demo/transcription; no trials reappear or stale 'source remains' status. Delete pending clip likewise.
7. Interrupted/network failure leaves source available to retry/manual entry. Fresh page close warns session loss.
8. Rejected corrupt/playlist/oversize input remains an explicit failure, not a successful observation.
9. Compare against fair baseline with memo and table visible simultaneously. Observe source/version tracking behavior, not contrived app-switch/time superiority.
10. Inspect desktop and narrow layout, keyboard focus, reduced-motion behavior. Listen/source controls observed does NOT constitute actual perceptual audio acceptance.

Independent review status: first repair batch independently reviewed and seventh test run; latest unseen-proposal checkbox fix still awaits independent browser verification; no complete browser workflow or safety/privacy proof yet. No external deployment/submission.

Deterministic browser race harness: append `?race-test` to local preview. Visible QA banner; actual ASR still executes, but applying response is delayed10s. Use only for focus/precheck/reset/delete interleavings, never for speed claims. Default path has no added delay. This explicit timing hook is not a mock transcript and is not proof of model quality.
