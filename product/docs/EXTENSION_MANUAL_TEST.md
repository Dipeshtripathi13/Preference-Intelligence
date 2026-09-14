# Chrome extension manual smoke test

Run this procedure after a provider UI release or selector change. Use only
non-sensitive prompts. Record browser version, extension commit, date, provider
URL, and result; a fixture test is not a live-DOM result.

## Setup

1. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and
   `npm run build` in `product/extension`.
2. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**,
   and select `product/extension/dist`.
3. Open the extension dashboard. Complete the paired-answer onboarding with
   `verbosity=concise` and at least one other choice. Confirm each setup record
   has 50% confidence and global scope.
4. Keep DevTools open on the provider page and extension service worker. Treat an
   uncaught error as a failure even if the message sends.

## ChatGPT and Claude matrix

Perform every step on both `chatgpt.com` and `claude.ai`:

1. Type `Explain Java virtual threads.` manually. Submit by button. Confirm the
   visible preference draft appears and the provider has not received it yet.
2. Edit the visible draft, submit again, and confirm it sends exactly once. Repeat
   using Enter. Confirm Shift+Enter still creates a newline.
3. Create another draft and press Escape. Confirm the exact original prompt is
   restored and nothing sends.
4. Type `Give me a comprehensive 3,000-word explanation of bond duration.` Confirm
   the global concise default is overridden by the current request.
5. With no onboarding verbosity value, type `Make this shorter.` twice. Confirm the first signal
   remains below activation and the repeated correction becomes available.
6. With a detailed onboarding value, type `Make this shorter.` once and confirm
   the setup choice changes immediately to concise.
7. Refresh the page. Confirm the profile persists and the next prompt reflects
   dashboard edits without reinstalling the extension.
8. Turn **Personalization** off in the dashboard. Confirm prompts send unchanged.
   Turn it on and confirm injection resumes.
9. Disable the extension in `chrome://extensions`. Confirm the provider works
   normally with no indicator or prompt transformation.
10. Inspect the dashboard trace. Confirm it reports the global v1 condition,
    applied/rejected records, update events, and estimated preference tokens—but
    no raw prompt in normal mode.

## Failure behavior

- With no enabled send button, the adapter must return failure and must not claim a
  successful click.
- If compilation messaging fails, the original prompt should be restored, no
  Preference Intelligence UI should appear, and the adapter should attempt a
  normal send.
- No content script or profile access should activate on an unsupported origin.
- Assistant output and arbitrary page text must never create evidence.

## Current validation status

- ChatGPT: automated selector/interaction fixtures pass; live smoke test not
  recorded for this commit.
- Claude: automated selector/interaction fixtures pass; live smoke test not
  recorded for this commit.
- Gemini: placeholder only, absent from manifest and adapter registry.
