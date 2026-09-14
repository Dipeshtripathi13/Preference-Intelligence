import rawSelectors from './provider-selectors.json';

export interface ProviderSelectors {
  composers: readonly string[];
  submit: readonly string[];
}

function validate(name: string, value: ProviderSelectors): ProviderSelectors {
  if (!value.composers.length || !value.submit.length
    || [...value.composers, ...value.submit].some((selector) => typeof selector !== 'string' || selector.length > 200)) {
    throw new Error(`Invalid packaged selectors for ${name}.`);
  }
  return Object.freeze({
    composers: Object.freeze([...value.composers]),
    submit: Object.freeze([...value.submit]),
  });
}

/**
 * Selectors are data, not adapter logic. V1 packages this reviewed file with the
 * extension; it deliberately does not add a remote configuration channel.
 */
export const PROVIDER_SELECTORS = Object.freeze({
  chatgpt: validate('chatgpt', rawSelectors.chatgpt),
  claude: validate('claude', rawSelectors.claude),
});
