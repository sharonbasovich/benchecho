# Remote capture proposal — not run, not a final submission film
`WORKFLOW-PROPOSAL.yml` is the reviewed proposal; `.github/workflows/capture.yml` is its manual-dispatch copy. It is manual-only, read-only repository permissions and a15minute job limit; uses public dependencies/model with pinned model hashes and no secrets or external ASR service. Existing free GitHub Actions access only; do not add billing/account grants to run it.

This first pass establishes a real Chromium recording of the actual app with actual Whisper inference, known synthetic fixtures, scripted corrections and export hash assertions. It is **not human perceptual listening**, a user study, or a polished2–3minute final film. No request interception or fake transcript responses. Artifacts include raw uncorrected drafts and audit JSON alongside the video so errors remain visible.

The workflow requires fresh dependency/model installation and a usable hosted runner; neither has been executed. Direct versions are pinned but transitive lockfiles are not yet available. Review recorded frames and pacing before creating the separate final captioned film specified by ../DEMO-PLAN.md. Do not claim a successful run from the presence of this script.

`final-captions.srt` is a draft aligned to the separate135second plan, not to the short functional capture. Do not attach it to a recording without retiming to actual visible actions. Final film still requires an actual timed workflow recording and end-to-end visual review; captions do not establish audio acceptance.
