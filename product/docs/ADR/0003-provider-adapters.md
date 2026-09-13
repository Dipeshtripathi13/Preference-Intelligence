# ADR 0003: DOM provider adapters

- Status: accepted
- Date: 2026-09-13

## Decision

Integrate through a small provider-adapter interface in a Manifest V3 content script. Enable only ChatGPT and Claude; retain Gemini as an ungranted placeholder.

## Consequences

The proof of concept works without provider API keys and demonstrates portability in the interfaces users already use. Provider DOM changes can break selectors and require smoke testing. The system intentionally does not scrape conversation history or assistant responses.
