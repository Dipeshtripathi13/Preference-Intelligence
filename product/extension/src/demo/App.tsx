import { useEffect, useMemo, useState } from 'react';
import { PreferenceEngine } from '../engine/engine';
import { exportProfile } from '../engine/profile';
import { IndexedDbPreferenceStore } from '../engine/store';
import {
  DIMENSIONS,
  DOMAINS,
  VALUES_BY_DIMENSION,
  type CompiledContext,
  type Domain,
  type PreferenceDimension,
  type PreferenceRecord,
  type Scope,
} from '../engine/types';

const store = new IndexedDbPreferenceStore('preference-intelligence-standalone-demo');
const engine = new PreferenceEngine(store);

const SEED_IDS = {
  verbosity: '10000000-0000-4000-8000-000000000001',
  answerFirst: '10000000-0000-4000-8000-000000000002',
  softwareDepth: '10000000-0000-4000-8000-000000000003',
  softwareCode: '10000000-0000-4000-8000-000000000004',
  financeDepth: '10000000-0000-4000-8000-000000000005',
  financeExamples: '10000000-0000-4000-8000-000000000006',
} as const;

function label(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeRecord(
  id: string,
  dimension: PreferenceDimension,
  value: string,
  scope: Scope,
  locked = true,
): PreferenceRecord {
  const now = new Date().toISOString();
  return {
    id,
    dimension,
    value,
    scope,
    confidence: locked ? 0.98 : 0.82,
    evidenceCount: locked ? 3 : 2,
    createdAt: now,
    updatedAt: now,
    lastObservedAt: now,
    sourceType: 'user_edit',
    state: locked ? 'locked' : 'confirmed',
    locked,
    enabled: true,
    decayRate: locked ? 0 : 0.002,
    provenance: [{
      id: `${id}-seed`,
      sourceType: 'user_edit',
      origin: 'dashboard',
      observedAt: now,
      signal: 'standalone_demo_seed',
    }],
  };
}

const seededPreferences = (): PreferenceRecord[] => [
  makeRecord(SEED_IDS.verbosity, 'verbosity', 'concise', {}),
  makeRecord(SEED_IDS.answerFirst, 'answer_first_preference', 'answer_first', {}),
  makeRecord(SEED_IDS.softwareDepth, 'technical_depth', 'advanced', { domain: 'software_engineering' }),
  makeRecord(SEED_IDS.softwareCode, 'code_preference', 'preferred', { domain: 'software_engineering' }),
  makeRecord(SEED_IDS.financeDepth, 'technical_depth', 'beginner', { domain: 'finance' }),
  makeRecord(SEED_IDS.financeExamples, 'example_preference', 'preferred', { domain: 'finance' }),
];

function scopeLabel(scope: Scope): string {
  return scope.domain ? label(scope.domain) : 'Global';
}

export default function App() {
  const [preferences, setPreferences] = useState<PreferenceRecord[]>(seededPreferences);
  const [prompt, setPrompt] = useState('Explain how bond duration affects price when interest rates rise.');
  const [provider, setProvider] = useState('ChatGPT');
  const [compiled, setCompiled] = useState<CompiledContext>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [dimension, setDimension] = useState<PreferenceDimension>('format_preference');
  const [value, setValue] = useState('prose');
  const [domain, setDomain] = useState<Domain | 'global'>('global');

  async function refresh() {
    setPreferences((await store.listPreferences()).sort((left, right) => {
      const leftScope = left.scope.domain ?? '';
      const rightScope = right.scope.domain ?? '';
      return leftScope.localeCompare(rightScope) || left.dimension.localeCompare(right.dimension);
    }));
  }

  useEffect(() => {
    void (async () => {
      if ((await store.listPreferences()).length === 0) {
        await Promise.all(seededPreferences().map((preference) => store.putPreference(preference)));
      }
      await refresh();
    })().catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Could not open the local profile.'));
  }, []);

  const grouped = useMemo(() => {
    const groups = new Map<string, PreferenceRecord[]>();
    for (const preference of preferences) {
      const group = preference.scope.domain ?? 'global';
      groups.set(group, [...(groups.get(group) ?? []), preference]);
    }
    return [...groups.entries()];
  }, [preferences]);

  function changeDimension(next: PreferenceDimension) {
    setDimension(next);
    setValue(VALUES_BY_DIMENSION[next][0]);
  }

  async function update(preference: PreferenceRecord, patch: Partial<PreferenceRecord>) {
    const now = new Date().toISOString();
    const next = { ...preference, ...patch, updatedAt: now };
    if ('locked' in patch) next.state = patch.locked ? 'locked' : 'confirmed';
    await store.putPreference(next);
    await refresh();
    setCompiled(undefined);
  }

  async function addPreference(event: React.FormEvent) {
    event.preventDefault();
    const scope: Scope = domain === 'global' ? {} : { domain };
    const id = globalThis.crypto.randomUUID();
    await store.putPreference(makeRecord(id, dimension, value, scope, false));
    await refresh();
    setNotice('Preference added locally.');
  }

  async function compile() {
    if (!prompt.trim()) return;
    try {
      const result = await engine.processPrompt({
        prompt: prompt.trim(),
        provider,
        trustedUserAction: true,
      });
      setCompiled(result);
      await refresh();
      setError('');
      setNotice(result.selected.length === 0 ? 'No stored preference matched this request.' : `Applied ${result.selected.length} relevant preference${result.selected.length === 1 ? '' : 's'}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not compile this prompt.');
    }
  }

  const portablePrompt = compiled?.instruction
    ? `${compiled.instruction}\n\n<user-request>\n${prompt.trim()}\n</user-request>`
    : prompt.trim();

  async function copyPrompt() {
    await navigator.clipboard.writeText(portablePrompt);
    setNotice(`Copied a model-neutral prompt for ${provider}.`);
  }

  async function exportData() {
    const profile = await exportProfile(store);
    const url = URL.createObjectURL(new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'preference-intelligence-profile.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function reset() {
    if (!window.confirm('Replace this local profile with the demonstration defaults?')) return;
    await store.clearPreferences();
    await store.clearUsageLogs();
    await Promise.all(seededPreferences().map((preference) => store.putPreference(preference)));
    setCompiled(undefined);
    await refresh();
    setNotice('Demo profile restored.');
  }

  return (
    <main className="shell demo-shell">
      <header className="hero demo-hero">
        <div>
          <p className="eyebrow">Preference Intelligence · Working prototype</p>
          <h1>Your preferences.<br />Every AI.</h1>
          <p>A user-owned policy layer that selects only the preferences relevant to the task, then compiles a model-neutral prompt.</p>
        </div>
        <div className="privacy-badge"><span>●</span> Browser-local · no account</div>
      </header>

      {error && <div role="alert" className="alert alert--error">{error}</div>}
      {notice && <div role="status" className="alert">{notice}</div>}

      <section className="demo-grid">
        <div className="panel playground">
          <div className="section-title">
            <div><p className="eyebrow">Try the engine</p><h2>Portable prompt compiler</h2></div>
            <span>Local inference</span>
          </div>
          <label className="field">Target AI
            <select value={provider} onChange={(event) => setProvider(event.target.value)}>
              {['ChatGPT', 'Claude', 'Gemini', 'Local model', 'Other AI'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">Your request
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={6} />
          </label>
          <div className="prompt-actions">
            <button className="primary" onClick={() => void compile()}>Personalize request</button>
            <button disabled={!compiled} onClick={() => void copyPrompt()}>Copy for {provider}</button>
          </div>
          <p className="microcopy">Try Java, Kafka, or finance prompts. An explicit instruction such as “be detailed this time” overrides the stored profile.</p>
        </div>

        <div className="panel decision-panel" aria-live="polite">
          <div className="section-title"><div><p className="eyebrow">Transparent decision</p><h2>What the layer selected</h2></div></div>
          {!compiled && <div className="empty compact-empty"><h3>Ready to personalize</h3><p>The classifier, chosen scope, and exact injected instructions will appear here.</p></div>}
          {compiled && <>
            <div className="classification">
              <span>{label(compiled.classification.domain)}</span>
              {compiled.classification.subdomain && <span>{label(compiled.classification.subdomain)}</span>}
              <span>{label(compiled.classification.task)}</span>
              <span>{Math.round(compiled.classification.confidence * 100)}% context confidence</span>
            </div>
            <div className="decision-list">
              {compiled.decisions.length === 0 && <p>No preference was eligible for this context.</p>}
              {compiled.decisions.map((decision) => <article key={decision.preferenceId} className={decision.status === 'used' ? 'decision used' : 'decision overridden'}>
                <strong>{label(decision.dimension)} → {label(decision.value)}</strong>
                <span>{label(decision.status)}</span>
                <p>{decision.reason}</p>
              </article>)}
            </div>
            <details className="compiled-output" open>
              <summary>Compiled model-neutral instruction · ≈{compiled.estimatedTokens} tokens</summary>
              <pre>{portablePrompt}</pre>
            </details>
          </>}
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <div><p className="eyebrow">Inspectable and reversible</p><h2>Your local preference policy</h2></div>
          <div className="profile-actions"><button onClick={() => void exportData()}>Export UPP JSON</button><button onClick={() => void reset()}>Restore demo</button></div>
        </div>
        <form className="new-preference" onSubmit={(event) => void addPreference(event)}>
          <label>Dimension<select value={dimension} onChange={(event) => changeDimension(event.target.value as PreferenceDimension)}>{DIMENSIONS.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
          <label>Value<select value={value} onChange={(event) => setValue(event.target.value)}>{VALUES_BY_DIMENSION[dimension].map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
          <label>Scope<select value={domain} onChange={(event) => setDomain(event.target.value as Domain | 'global')}><option value="global">Global</option>{DOMAINS.filter((item) => item !== 'general').map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
          <button className="primary" type="submit">Add preference</button>
        </form>

        {grouped.map(([group, items]) => <div className="preference-group" key={group}>
          <h2>{label(group)}</h2>
          <div className="preference-grid">{items.map((preference) => <article className={`preference-card ${preference.enabled ? '' : 'muted'}`} key={preference.id}>
            <div className="preference-card__heading">
              <div><h3>{label(preference.dimension)}</h3><select aria-label={`Value for ${preference.dimension}`} value={preference.value} onChange={(event) => void update(preference, { value: event.target.value })}>{VALUES_BY_DIMENSION[preference.dimension].map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></div>
              <span className={`state state--${preference.state}`}>{preference.locked ? 'Locked' : 'Editable'}</span>
            </div>
            <div className="meter"><span style={{ width: `${preference.confidence * 100}%` }} /></div>
            <p className="meta">{scopeLabel(preference.scope)} · {Math.round(preference.confidence * 100)}% confidence</p>
            <div className="card-actions">
              <button className="small" onClick={() => void update(preference, { locked: !preference.locked })}>{preference.locked ? 'Unlock' : 'Lock'}</button>
              <button className="small" onClick={() => void update(preference, { enabled: !preference.enabled })}>{preference.enabled ? 'Disable' : 'Enable'}</button>
              <button className="small danger" onClick={() => void store.deletePreference(preference.id).then(refresh)}>Delete</button>
            </div>
          </article>)}</div>
        </div>)}
      </section>

      <footer className="demo-footer">
        <p><strong>What is local?</strong> Preferences, decisions, and usage logs remain in this browser's IndexedDB. The playground calls no AI API.</p>
        <p><strong>What is portable?</strong> The compiled instruction and exported User Preference Profile are provider-neutral; the packaged extension automates insertion on supported AI sites.</p>
      </footer>
    </main>
  );
}
