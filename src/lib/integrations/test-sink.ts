import type { EnquirySink } from "./enquiry-sink";

/**
 * Delivers nowhere: no network, no storage, no logging. For local
 * development, CI and previews. Production refuses to start with it
 * (src/lib/env.ts).
 */
export const testSink: EnquirySink = {
  async deliver(_enquiry, _meta, signal) {
    signal.throwIfAborted();
  },
};
