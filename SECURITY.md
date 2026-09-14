# Security policy

Preference Intelligence runs a content script on supported AI provider pages,
so dependency and release integrity are treated as part of the product boundary.

## Supported version

Security fixes target the current `main` branch and most recent tagged release.
This repository is a research prototype and does not promise long-term support
for older versions.

## Reporting a vulnerability

Do not open a public issue for an unpatched vulnerability. Use GitHub's private
security-advisory reporting flow for this repository. Include the affected
version, reproduction steps, impact, and any suggested mitigation. Do not
include real conversations, credentials, or other sensitive user data.

## Security boundaries

- No Preference Intelligence account, backend, analytics, or telemetry.
- No wildcard host permission and no remotely downloaded executable code.
- No remote selector or behavior configuration in v1.
- Provider pages cannot directly query the extension-owned IndexedDB profile.
- AI responses and arbitrary webpage text cannot update the profile.
- Imported dimensions and values must pass bounded allowlists.
- Internal errors restore the original composer text and fail closed.

Every release should run type checking, lint, unit tests, production builds, and
package inspection. Maintainers should use account two-factor authentication,
review lockfile changes, and avoid adding runtime dependencies without a clear
security justification.
