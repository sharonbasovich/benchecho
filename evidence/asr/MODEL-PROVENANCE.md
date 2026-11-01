# Existing runtime provenance
- ASR: onnx-community/whisper-tiny.en cached metadata revision2575352d61be1bf7225cf8f8b268a4678025fc58, quantized q8.
- Encoder SHA256 e93ec822f16a8fd264e7de972ad17d615ea7334b75a52d54c50c2e18dd503a25
- Decoder SHA256 c0592d0749413c960569e1c7fb806b060d5d18f3ebad4a95cbf9a77dc6e9be52
- Transformers.js3.8.1, existing Node CPU/ONNX runtime, one intra-op thread. FFmpeg system installation, existing flite slt speech synthesis.
- Runtime/models NOT copied into this evidence package; relative paths deliberately refer to existing cloud assets. Models already cached before this experiment. No desktop downloads or installs.
- For reproduction: run `python generate-flite.py`; `node evaluate.mjs`; `node --test workflow.test.mjs` from this directory after providing the documented existing model/runtime paths. Exact transcript strings can differ by runtime version/hardware; preserve environment before comparing.
- Licensing review still required before distributing model/runtime; this private feasibility artifact does not assert redistribution permission. No model bytes bundled.
