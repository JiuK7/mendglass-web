import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Prerendered pages are read from Workers Static Assets: no R2, KV, D1 or
// Durable Objects, so nothing beyond the free plan. The trade-off is that
// pages cannot be revalidated at runtime, which this site does not need.
// See docs/decisions/004-hosting-cloudflare-workers.md.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
