import { releasePackagingExcludePatterns } from "./lib/release-policy.mjs";

for (const pattern of releasePackagingExcludePatterns) {
  console.log(pattern);
}
