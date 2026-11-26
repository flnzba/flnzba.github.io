// harness:generated - omp adapter for the harness guards (decision D22).
// Materialized into projects by .agents/scripts/install.mjs with HARNESS set
// to the harness submodule path; overwritten on update - edit it in the
// harness repository. The logic lives in .agents/hooks/omp-bridge.mjs.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HARNESS = '.harness';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const harness = path.join(root, HARNESS);
const bridge = path.join(harness, '.agents/hooks/omp-bridge.mjs');
// A bridge that is missing or fails to load must not drop the extension (omp
// would then run bash unguarded): keep the reason and block instead.
let register;
let reason = 'harness: submodule uninitialized - run: git submodule update --init';
if (existsSync(bridge)) {
  try {
    ({ register } = await import(pathToFileURL(bridge).href));
  } catch (error) {
    reason = `harness: omp-bridge.mjs failed to load (${error?.message ?? error}) - bash blocked (fail closed)`;
  }
}

export default function harnessGuards(pi) {
  if (typeof register === 'function') {
    try { return register(pi, { root, harness }); } catch (error) {
      reason = `harness: omp-bridge.mjs failed to register (${error?.message ?? error}) - bash blocked (fail closed)`;
    }
  }
  // Fail closed like the Claude/Codex PreToolUse wrapper: no guard, no bash.
  pi.on('tool_call', (event) => (event?.toolName === 'bash' ? { block: true, reason } : undefined));
  return undefined;
}
