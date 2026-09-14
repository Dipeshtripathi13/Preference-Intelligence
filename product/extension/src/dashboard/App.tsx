import { useEffect, useMemo, useState } from 'react';
import {
  DIMENSIONS,
  DOMAINS,
  VALUES_BY_DIMENSION,
  type Domain,
  type PreferenceDimension,
  type PreferenceRecord,
  type ProductSettings,
  type Scope,
  type UsageDecision,
} from '../engine/types';
import { sendExtensionMessage, type DashboardState, type ExtensionResponse } from '../messaging';

function label(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function requireOk(request: Parameters<typeof sendExtensionMessage>[0]): Promise<ExtensionResponse> {
  const response = await sendExtensionMessage<ExtensionResponse>(request);
  if (!response.ok) throw new Error(response.error);
  return response;
}

interface PreferenceCardProps {
  preference: PreferenceRecord;
  latestDecision?: UsageDecision;
  onChanged: () => Promise<void>;
}

function PreferenceCard({ preference, latestDecision, onChanged }: PreferenceCardProps) {
  const [editing, setEditing] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [value, setValue] = useState(preference.value);

  async function save(patch: Partial<Pick<PreferenceRecord, 'value' | 'locked' | 'enabled' | 'notApplicableTo'>> = {}) {
    await requireOk({
      type: 'SAVE_PREFERENCE',
      preference: {
        id: preference.id,
        dimension: preference.dimension,
        value: patch.value ?? value,
        scope: preference.scope,
        locked: patch.locked ?? preference.locked,
        enabled: patch.enabled ?? preference.enabled,
        notApplicableTo: patch.notApplicableTo ?? preference.notApplicableTo,
      },
    });
    setEditing(false);
    await onChanged();
  }

  async function remove() {
    if (!window.confirm(`Delete ${label(preference.dimension)}? This cannot be undone.`)) return;
    await requireOk({ type: 'DELETE_PREFERENCE', id: preference.id });
    await onChanged();
  }

  return (
    <article className={`preference-card ${preference.enabled ? '' : 'muted'}`}>
      <div className="preference-card__heading">
        <div>
          <h3>{label(preference.dimension)}</h3>
          {editing ? (
            <select aria-label={`Value for ${preference.dimension}`} value={value} onChange={(event) => setValue(event.target.value)}>
              {VALUES_BY_DIMENSION[preference.dimension].map((item) => <option key={item} value={item}>{label(item)}</option>)}
            </select>
          ) : <p className="value">{label(preference.value)}</p>}
        </div>
        <span className={`state state--${preference.state}`}>{preference.enabled ? label(preference.state) : 'Disabled'}</span>
      </div>
      <div className="meter" title={`${Math.round(preference.confidence * 100)}% evidence confidence`}>
        <span style={{ width: `${preference.confidence * 100}%` }} />
      </div>
      <p className="meta">{Math.round(preference.confidence * 100)}% evidence confidence · {preference.evidenceCount} observation{preference.evidenceCount === 1 ? '' : 's'} · {label(preference.lifetime ?? 'durable')}</p>
      <div className="card-actions">
        {editing ? <button className="primary small" onClick={() => void save()}>Save</button> : <button className="small" onClick={() => setEditing(true)}>Edit</button>}
        <button className="small" onClick={() => void save({ locked: !preference.locked })}>{preference.locked ? 'Unlock' : 'Lock'}</button>
        <button className="small" onClick={() => void save({ enabled: !preference.enabled })}>{preference.enabled ? 'Disable' : 'Enable'}</button>
        <button className="small danger" onClick={() => void remove()}>Delete</button>
        <button className="small link-button" onClick={() => setWhyOpen(!whyOpen)}>Why?</button>
      </div>
      {whyOpen && (
        <div className="why-box">
          <strong>{latestDecision ? label(latestDecision.status) : 'No recent decision'}</strong>
          <p>{latestDecision?.reason ?? 'No recent prompt evaluated this preference.'}</p>
          <dl>
            <div><dt>Scope</dt><dd>{[preference.scope.domain, preference.scope.subdomain, preference.scope.task].filter((item): item is string => Boolean(item)).map(label).join(' / ') || 'Global'}</dd></div>
            <div><dt>Last observed</dt><dd>{new Date(preference.lastObservedAt).toLocaleString()}</dd></div>
            <div><dt>Source</dt><dd>{label(preference.sourceType)}</dd></div>
            {latestDecision && <><div><dt>Scope match</dt><dd>{Math.round((latestDecision.scopeMatch ?? 0) * 100)}%</dd></div><div><dt>Semantic relevance</dt><dd>{Math.round((latestDecision.semanticRelevance ?? 0) * 100)}%</dd></div><div><dt>Final applicability</dt><dd>{Math.round((latestDecision.applicability ?? 0) * 100)}%</dd></div></>}
          </dl>
          {Boolean(preference.notApplicableTo?.length) && <button className="small" onClick={() => void save({ notApplicableTo: [] })}>Clear {preference.notApplicableTo!.length} applicability correction{preference.notApplicableTo!.length === 1 ? '' : 's'}</button>}
        </div>
      )}
    </article>
  );
}

function NewPreference({ onCreated }: { onCreated: () => Promise<void> }) {
  const [dimension, setDimension] = useState<PreferenceDimension>('verbosity');
  const [value, setValue] = useState('concise');
  const [domain, setDomain] = useState<Domain | 'global'>('global');

  function changeDimension(next: PreferenceDimension) {
    setDimension(next);
    setValue(VALUES_BY_DIMENSION[next][0]);
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const scope: Scope = domain === 'global' ? {} : { domain };
    await requireOk({ type: 'SAVE_PREFERENCE', preference: { dimension, value, scope, locked: false, enabled: true } });
    await onCreated();
  }

  return (
    <form className="new-preference" onSubmit={(event) => void create(event)}>
      <label>Dimension<select value={dimension} onChange={(event) => changeDimension(event.target.value as PreferenceDimension)}>{DIMENSIONS.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
      <label>Value<select value={value} onChange={(event) => setValue(event.target.value)}>{VALUES_BY_DIMENSION[dimension].map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
      <label>Scope<select value={domain} onChange={(event) => setDomain(event.target.value as Domain | 'global')}><option value="global">Global</option>{DOMAINS.filter((item) => item !== 'general').map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
      <button className="primary" type="submit">Add preference</button>
    </form>
  );
}

export default function App() {
  const [data, setData] = useState<DashboardState>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    try {
      const response = await requireOk({ type: 'GET_DASHBOARD_STATE' });
      if ('state' in response) setData(response.state);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load the local profile.');
    }
  }

  useEffect(() => { void refresh(); }, []);

  const latestDecisions = useMemo(() => {
    const result = new Map<string, UsageDecision>();
    for (const log of data?.usageLogs ?? []) {
      for (const decision of log.decisions) if (!result.has(decision.preferenceId)) result.set(decision.preferenceId, decision);
    }
    return result;
  }, [data?.usageLogs]);

  const groups = useMemo(() => {
    const grouped = new Map<string, PreferenceRecord[]>();
    for (const preference of data?.preferences ?? []) {
      const group = preference.scope.domain ?? 'global';
      grouped.set(group, [...(grouped.get(group) ?? []), preference]);
    }
    return [...grouped.entries()].sort(([left], [right]) => left === 'global' ? -1 : right === 'global' ? 1 : left.localeCompare(right));
  }, [data?.preferences]);

  async function updateSettings(patch: Partial<ProductSettings>) {
    await requireOk({ type: 'UPDATE_SETTINGS', settings: patch });
    await refresh();
  }

  async function exportData() {
    const response = await requireOk({ type: 'EXPORT_PROFILE' });
    if (!('profile' in response)) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(response.profile, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'preference-profile.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('Profile is larger than the 5 MB import limit.');
      const profile: unknown = JSON.parse(await file.text());
      const response = await requireOk({ type: 'IMPORT_PROFILE', profile, replace: false });
      if ('imported' in response) setNotice(`Imported ${response.imported} preference${response.imported === 1 ? '' : 's'}.`);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Import failed.');
    } finally {
      event.target.value = '';
    }
  }

  async function reset() {
    if (!window.confirm('Delete every preference and local usage explanation? This cannot be undone.')) return;
    await requireOk({ type: 'RESET_PROFILE' });
    setNotice('Local profile reset.');
    await refresh();
  }

  if (!data && !error) return <main className="shell"><p>Loading local profile…</p></main>;

  return (
    <main className="shell">
      <header className="hero">
        <div><p className="eyebrow">Preference Intelligence</p><h1>Your preferences. Every AI.</h1><p>Portable, contextual, and transparent response personalization—stored in this browser.</p></div>
        <div className="privacy-badge"><span>●</span> Local profile</div>
      </header>

      {error && <div role="alert" className="alert alert--error">{error}</div>}
      {notice && <div role="status" className="alert">{notice}</div>}

      <section className="controls panel">
        <label className="toggle"><input type="checkbox" checked={data?.settings.personalizationEnabled ?? true} onChange={(event) => void updateSettings({ personalizationEnabled: event.target.checked })} /><span>Personalization</span><small>Inject relevant preferences</small></label>
        <label className="toggle"><input type="checkbox" checked={data?.settings.learningEnabled ?? true} onChange={(event) => void updateSettings({ learningEnabled: event.target.checked })} /><span>Learning</span><small>Learn from trusted corrections</small></label>
        <div className="profile-actions"><button onClick={() => void exportData()}>Export JSON</button><label className="button-like">Import JSON<input type="file" accept="application/json" onChange={(event) => void importData(event)} /></label><button className="danger" onClick={() => void reset()}>Reset profile</button></div>
      </section>

      <section className="panel privacy-dashboard">
        <div className="section-title"><div><p className="eyebrow">Privacy boundary</p><h2>What this extension keeps</h2></div><span>No Preference Intelligence server</span></div>
        <div className="privacy-dashboard__grid"><div><h3>Stored locally</h3><p>✓ Preferences and scopes</p><p>✓ Evidence confidence and bounded signal labels</p><p>✓ Applied and suppressed decision metadata</p></div><div><h3>Not stored by default</h3><p>× Full chat or browsing history</p><p>× Assistant-authored claims about you</p><p>× Sensitive demographic profiles</p></div></div>
      </section>

      <section className="panel">
        <div className="section-title"><div><p className="eyebrow">Profile</p><h2>Response preferences</h2></div><span>{data?.preferences.length ?? 0} total</span></div>
        <NewPreference onCreated={refresh} />
        {groups.length === 0 && <div className="empty"><h3>No learned preferences yet</h3><p>Add one here, or use an explicit correction such as “Always keep answers concise” in ChatGPT or Claude.</p></div>}
        {groups.map(([group, preferences]) => (
          <div className="preference-group" key={group}>
            <h2>{label(group)}</h2>
            <div className="preference-grid">{preferences.map((preference) => <PreferenceCard key={preference.id} preference={preference} latestDecision={latestDecisions.get(preference.id)} onChanged={refresh} />)}</div>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="section-title"><div><p className="eyebrow">Context control</p><h2>Disabled domains</h2></div></div>
        <div className="domain-chips">{DOMAINS.filter((domain) => domain !== 'general').map((domain) => {
          const disabled = data?.settings.disabledDomains.includes(domain) ?? false;
          return <label className={disabled ? 'domain-chip disabled' : 'domain-chip'} key={domain}><input type="checkbox" checked={disabled} onChange={() => void updateSettings({ disabledDomains: disabled ? data!.settings.disabledDomains.filter((item) => item !== domain) : [...data!.settings.disabledDomains, domain] })} />{label(domain)}</label>;
        })}</div>
      </section>

      <details className="panel experimental">
        <summary><div><p className="eyebrow">Internal</p><h2>Experimental mode</h2></div><span>{data?.settings.experimentalMode ? 'On' : 'Off'}</span></summary>
        <div className="experimental-body">
          <label className="toggle"><input type="checkbox" checked={data?.settings.experimentalMode ?? false} onChange={(event) => void updateSettings({ experimentalMode: event.target.checked })} /><span>Enable experiment condition</span></label>
          <label>Condition<select value={data?.settings.experimentCondition} onChange={(event) => void updateSettings({ experimentCondition: event.target.value as ProductSettings['experimentCondition'] })}><option value="no_personalization">No personalization</option><option value="static_profile">Static profile</option><option value="global_learned">Global learned</option><option value="domain_conditioned">Domain-conditioned</option></select></label>
          <label className="toggle warning"><input type="checkbox" checked={data?.settings.recordRawPrompts ?? false} onChange={(event) => void updateSettings({ recordRawPrompts: event.target.checked })} /><span>Record raw prompts locally</span><small>Off by default. Use only with non-sensitive experiment prompts.</small></label>
          <p>{data?.usageLogs.length ?? 0} recent local decision logs. Compact logs omit prompt and response text unless raw prompt logging is explicitly enabled.</p>
          <button onClick={() => void requireOk({ type: 'CLEAR_USAGE_LOGS' }).then(refresh)}>Clear experiment logs</button>
        </div>
      </details>

      <details className="panel experimental developer-inspector">
        <summary><div><p className="eyebrow">Developer / researcher view</p><h2>Latest selection trace</h2></div><span>{data?.usageLogs[0] ? 'Available' : 'No trace'}</span></summary>
        <div className="experimental-body trace-body">
          {!data?.usageLogs[0] && <p>Submit a prompt on a supported provider to create a compact local trace.</p>}
          {data?.usageLogs[0] && <>
            <dl className="trace-summary"><div><dt>Provider</dt><dd>{label(data.usageLogs[0].provider)}</dd></div><div><dt>Classification</dt><dd>{label(data.usageLogs[0].classification.domain)} / {label(data.usageLogs[0].classification.task)}</dd></div><div><dt>Preference tokens</dt><dd>≈{data.usageLogs[0].estimatedTokens}</dd></div><div><dt>Condition</dt><dd>{label(data.usageLogs[0].experimentCondition)}</dd></div></dl>
            <div className="trace-list">{data.usageLogs[0].decisions.map((decision) => <article key={`${decision.preferenceId}-${decision.status}`}><b>{label(decision.dimension)} → {label(decision.value)}</b><span>{label(decision.status)}</span><p>{decision.reason}</p><small>scope {Math.round((decision.scopeMatch ?? 0) * 100)}% · semantic {Math.round((decision.semanticRelevance ?? 0) * 100)}% · evidence {Math.round((decision.evidenceConfidence ?? decision.confidence) * 100)}% · final {Math.round((decision.applicability ?? 0) * 100)}%</small></article>)}</div>
            {Boolean(data.usageLogs[0].updates?.length) && <div><h3>Preference updates</h3>{(data.usageLogs[0].updates ?? []).map((update) => <p key={`${update.preferenceId}-${update.signal}`}>{label(update.dimension)}: {label(update.previousValue ?? 'new')} → {label(update.value)} ({Math.round((update.previousConfidence ?? 0) * 100)}% → {Math.round(update.confidence * 100)}%) — {update.rationale}</p>)}</div>}
            <details><summary>Provider payload / compiled context</summary><pre>{data.usageLogs[0].compiledInstruction ?? 'Not retained in normal mode. Enable experimental mode and raw-prompt logging only for non-sensitive research prompts.'}</pre></details>
          </>}
        </div>
      </details>
    </main>
  );
}
