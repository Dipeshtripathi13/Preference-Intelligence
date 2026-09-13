# ADR 0002: Deterministic bounded preference engine

- Status: accepted
- Date: 2026-09-13

## Decision

Use bounded enums, conservative local extraction rules, deterministic scope resolution, and fixed compiler templates for the MVP. Keep classifier, extractor, updater, retriever, ranker, and compiler behind separate modules.

## Consequences

Behavior is inspectable, offline, testable, and safe from arbitrary imported prompt strings. Recall and language coverage are limited. Later experiments can replace one component without changing the portable record contract.
