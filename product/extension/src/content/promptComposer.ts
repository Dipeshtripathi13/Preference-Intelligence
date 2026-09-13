/**
 * Keeps the current request verbatim and last. This ordering makes the fixed
 * instruction hierarchy visible to the provider and reduces recency conflicts.
 */
export function composePersonalizedPrompt(currentRequest: string, instruction: string): string {
  if (!instruction) return currentRequest;
  return `${instruction}\n\n--- CURRENT USER REQUEST (authoritative; verbatim) ---\n${currentRequest}`;
}
