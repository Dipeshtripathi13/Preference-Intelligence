# ADR 0004: Evidence authority and prompt order

- Status: accepted
- Date: 2026-09-13

## Decision

Only trusted user-composer actions, dashboard edits, and validated explicit imports can create authoritative records. Current-turn constraints suppress conflicting stored dimensions. Compiled defaults appear first and the untouched current request appears last.

## Consequences

Assistant/page text has no automatic learning path, and prompt ordering reinforces the declared authority hierarchy. A browser extension cannot prove authorship of pasted text or guarantee that a model follows instructions; these remain documented limitations.
