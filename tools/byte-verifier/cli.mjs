#!/usr/bin/env node
import {verify, NOTICE} from './verify.mjs';
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--help') {
  console.log('Usage: node cli.mjs MANIFEST.json [AUDIO_FILE ...]\nAll arguments are literal paths; use ./--help for a manifest named --help.\nPrints JSON. Exit 0: all referenced digests present; 1: missing sources or no observations; 2: invalid input/read failure.\n' + NOTICE);
} else if (!args.length) {
  console.error('Usage: node cli.mjs MANIFEST.json [AUDIO_FILE ...]');
  process.exitCode = 2;
} else {
  try {
    const result = await verify(args[0], args.slice(1));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.exitCode;
  } catch (error) {
    console.error(JSON.stringify({error: error.message, notice: NOTICE}));
    process.exitCode = 2;
  }
}
