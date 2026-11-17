import { getServerEnv } from "@/lib/env";

/**
 * Next.js calls this once when a server instance starts, before it handles
 * any request. Throwing here stops that instance from serving, which is how
 * production refuses to start with the test sink or a missing variable
 * (Brief 5, src/lib/env.ts).
 */
export function register(): void {
  getServerEnv();
}
