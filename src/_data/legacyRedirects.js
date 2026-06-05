// ─────────────────────────────────────────────────────────────────────────────
// LEGACY REDIRECTS — added 2026-06-05
//
// On 2026-06-05 every post folder was prefixed with its post number
// (`slug/` → `NN-slug/`), which changed each post's public URL. GitHub Pages has
// no server-side redirects, so this data file + `src/redirects.njk` generate a
// client-side redirect stub for each OLD url pointing at the new one, keeping
// inbound/SEO links alive.
//
// TO REMOVE LATER: delete this file and `src/redirects.njk`. Nothing else
// references them — the rest of the site is unaffected.
// ─────────────────────────────────────────────────────────────────────────────
import { readdirSync } from "node:fs";

// Previously-live slugs that are NOT just "the folder name minus the number".
// `/posts/start/` was the live URL for the post now at `01-first-post`.
const ALIASES = {
  "01-first-post": "start",
};

export default () => {
  const seen = new Set();
  const redirects = [];

  for (const entry of readdirSync("src/posts", { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const match = entry.name.match(/^(\d+)-(.+)$/);
    if (!match) continue; // only number-prefixed post folders

    const to = `/posts/${entry.name}/`;
    const oldSlugs = [match[2]]; // strip the "NN-" prefix
    if (ALIASES[entry.name]) oldSlugs.push(ALIASES[entry.name]);

    for (const slug of oldSlugs) {
      const from = `/posts/${slug}/`;
      if (from === to || seen.has(from)) continue;
      seen.add(from);
      redirects.push({ from, to });
    }
  }

  return redirects.sort((a, b) => a.from.localeCompare(b.from));
};
