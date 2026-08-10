<!-- harness:begin -->
# Engineering Agent Instructions

Applies to every agent session here and in template-derived repositories.

## Before deciding

- Inspect current code, tree, and effective runtime/config. Stale or unverified
  artifacts cannot override observed state or user-approved requirements.
- Query the CodeGraph MCP index first for structure, symbols, callers, and
  impact; explore by hand only what the index does not answer. The index
  persists across sessions — do not re-derive what it already knows.
- Use the `software-engineering` skill for every substantive task:
  requirements, architecture, implementation, debugging, or review. It loads
  automatically; never wait for a slash command.

## While working

- Prefer the smallest correct change. Reuse native and existing capabilities
  before adding code, configuration, or dependencies.
- Keep requirements and product decisions in the main conversation. Ask only
  questions whose answers change what you will build.
- Resolve root causes. Never suppress, work around, or defer an error to
  keep moving.
- Edit canonical sources; regenerate and verify derived outputs. Never
  hand-edit copies or assume config is effective.
- Re-scan shared state before mutations. Never revert, overwrite, or clean up
  work you did not make. Keep secrets out of commits, logs, and tool output.
- Follow the repo-wide service architecture standard (see the
  `software-engineering` skill's architecture reference): DTOs at API
  boundaries, data access behind DAOs/repositories, services communicate
  only through published APIs. Use repository-managed runtimes and commands;
  Python runs only through the project venv or a managed runner. Keep
  hermetic checks independent of ambient credentials and network.
- Delegate independent read-heavy work (exploration, research, review) to
  subagents; never run concurrent editing agents. Independently verify their
  claims. The current user request outranks stale hook or TODO work.

## Before reporting done

- Match proof to claim. Unit, fake, static, or upstream-smoke evidence is not
  integration, end-to-end, or live proof; name the tier and any limitation.
- Prove each gate loads and exercises the target. Classify every unexpected
  failure or skip; never subtract a red baseline from completion evidence.
- Run the relevant checks (`make check`, targeted tests) and report only
  observed results. If something could not be verified, say exactly what
  and why.
- Invoke the `reviewer` subagent once after any non-trivial plan or change,
  before handing off. Fix its findings and rerun it at most once.

## Learning

- When a user correction generalizes, update the scoped guidance: this file
  for universal behavior, the matching skill reference for workflow
  behavior. Do not persist one-off preferences.

## Communication

- Be concise and direct. Lead with the outcome, then the evidence. Use
  complete sentences; no filler and no unverified claims.
<!-- harness:end -->
