import { getServerEnv } from "@/lib/env";
import { sinkFor, type EnquirySink } from "@/lib/integrations/enquiry-sink";
import { createEnquiryHandler } from "./handler";

// The sink is chosen from the environment on each delivery, not when this
// file loads. On Cloudflare the environment is filled in when the first
// request arrives, after modules may already have loaded. If the environment
// is wrong, delivery fails and the visitor is asked to try again.
const sinkFromEnvironment: EnquirySink = {
  deliver(enquiry, meta, signal) {
    return sinkFor(getServerEnv()).deliver(enquiry, meta, signal);
  },
};

export const POST = createEnquiryHandler(sinkFromEnvironment);
