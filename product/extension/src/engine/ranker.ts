import type { RankedPreference } from './types';

/** Applies a compact prompt budget after retrieval has resolved scope conflicts. */
export class PreferenceRanker {
  rank(preferences: RankedPreference[], limit = 8): RankedPreference[] {
    return [...preferences]
      .sort((left, right) => {
        const lockDelta = Number(right.preference.locked) - Number(left.preference.locked);
        return lockDelta || right.score - left.score || right.preference.dimension.localeCompare(left.preference.dimension);
      })
      .slice(0, limit);
  }
}
