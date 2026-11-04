// Deliberately fake ASR: tests server lifecycle, never inference quality.
export const env = {};
let loads = 0, calls = 0;
const release = () => new Promise(resolve => process.once('message', resolve));
export async function pipeline() {
  const load = ++loads;
  if (load === 1) {
    const gate = release();
    process.send({event: 'loading', load});
    await gate;
    throw Error('Injected local model initialization failure');
  }
  process.send({event: 'loaded', load});
  return async () => {
    const call = ++calls;
    if (call === 1) {
      const gate = release();
      process.send({event: 'inference', call});
      await gate;
    }
    if (call === 2) throw Error('Injected inference failure');
    return {text: ` fixture load ${load}, call ${call} `};
  };
}
