import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

// Neon Object Storage via the Files SDK. Endpoint, region and credentials come from the
// AWS_* variables `neon deploy` / `neon env pull` wrote for this branch.
export const BUCKET = "assets";
export const files = new Files({ adapter: neon({ bucket: BUCKET }) });
