# ADR 0005: Global-first, visible-injection v1

- Status: accepted
- Date: 2026-09-14

## Context

The contextual prototype had two launch risks. An empty profile required repeated
corrections before users saw value, while a wrong domain classification could
silently apply an inappropriate preference. Automatic prompt submission also
made correct personalization invisible and incorrect personalization look like
provider failure.

## Decision

The default v1 runtime uses global preferences only and does not execute the
domain classifier during normal product use. The optional scope schema and
classifier remain available for explicit research conditions and a future v2.

First-run onboarding uses paired answer examples and optional local parsing of
existing custom instructions. Setup declarations have confidence `0.50`, state
`inferred`, and source `onboarding_declaration`. They activate immediately but
one contrary direct user correction replaces them.

The first provider submit compiles a bounded instruction and leaves it visible
in the composer. The user must submit again, may edit the draft, or may press
Escape to restore the original request. Any internal failure restores the exact
original request, shows no Preference Intelligence UI, and attempts the normal
provider submit.

## Consequences

V1 has a useful cold start and an inspectable trust boundary. It gives up
domain-specific expertise preferences until classification and user-facing
correction behavior can be evaluated. Product claims and the playground must
describe contextual scope as deferred research, not shipped behavior.

Provider selectors are reviewed packaged data. V1 does not download remote
selector configuration because that would create a network and supply-chain
authority outside the installed extension.
