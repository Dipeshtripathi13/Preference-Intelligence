# @preference-intelligence/engine

Provider-independent preference extraction, updating, retrieval, and prompt
compilation with no DOM or browser-storage dependency.

The canonical TypeScript source currently lives in `../extension/src/engine` so
the extension consumes the exact code published by this package. Browser
IndexedDB and provider adapters live outside that directory.

```bash
cd product/preference-engine
npm install
npm run build
npm run pack:check
```

The v1 default is global-first. Context types and experimental contextual
retrieval remain in the public API so a future v2 can add scoped preferences
without migrating stored profiles.

The simplest integration owns persistence and passes the current profile back
on each call:

```ts
import { processPreferenceMessage } from '@preference-intelligence/engine';

const result = await processPreferenceMessage({
  message: 'Always keep answers concise.',
  profile: [],
});

saveProfile(result.profile);
console.log(result.instruction);
```
