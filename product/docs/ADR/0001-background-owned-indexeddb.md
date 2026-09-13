# ADR 0001: Background-owned IndexedDB

- Status: accepted
- Date: 2026-09-13

## Decision

Store the preference profile and logs in IndexedDB under the extension origin. All content and UI access crosses a validated runtime-message API owned by the service worker.

## Consequences

The MVP needs no local server, account, sync permission, or Preference Intelligence network service. Provider pages cannot directly query the profile. Service-worker lifecycle and schema migration require care, and a compromised local browser profile remains able to access data.
