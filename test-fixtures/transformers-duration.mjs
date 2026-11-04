// Deliberately fake ASR: observes server inputs/options, never recognition quality.
export const env = {};
export async function pipeline() {
  return async function (audio, options) {
    process.send({event: 'inference', samples: audio.length, argumentCount: arguments.length, options: options ?? null, allowRemoteModels: env.allowRemoteModels});
    return {text: 'duration fixture'};
  };
}
