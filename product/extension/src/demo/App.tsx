import { useEffect, useMemo, useState } from 'react';
import { PreferenceEngine } from '../engine/engine';
import { exportProfile, importProfile } from '../engine/profile';
import { IndexedDbPreferenceStore } from '../engine/store';
import {
  DIMENSIONS,
  DOMAINS,
  VALUES_BY_DIMENSION,
  type ClassifiedContext,
  type CompiledContext,
  type Domain,
  type PreferenceDimension,
  type PreferenceRecord,
  type PreferenceUpdateEvent,
  type Scope,
  type UsageDecision,
} from '../engine/types';

type Provider = 'ChatGPT' | 'Claude' | 'Gemini' | 'Local model';
type Scenario = 'domain' | 'abstention' | 'learning';

const store = new IndexedDbPreferenceStore('preference-intelligence-standalone-demo-v2');
const engine = new PreferenceEngine(store);
const REPOSITORY = 'https://github.com/Dipeshtripathi13/Preference-Intelligence';

const SEED_IDS = {
  verbosity: '10000000-0000-4000-8000-000000000001',
  answerFirst: '10000000-0000-4000-8000-000000000002',
  javaDepth: '10000000-0000-4000-8000-000000000003',
  softwareCode: '10000000-0000-4000-8000-000000000004',
  financeDepth: '10000000-0000-4000-8000-000000000005',
  financeFoundations: '10000000-0000-4000-8000-000000000006',
  financeExamples: '10000000-0000-4000-8000-000000000007',
  infrastructureDepth: '10000000-0000-4000-8000-000000000008',
} as const;

function label(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

interface RecordOptions {
  locked?: boolean;
  confidence?: number;
  evidenceCount?: number;
  sourceType?: PreferenceRecord['sourceType'];
  state?: PreferenceRecord['state'];
}

function makeRecord(
  id: string,
  dimension: PreferenceDimension,
  value: string,
  scope: Scope,
  options: RecordOptions = {},
): PreferenceRecord {
  const now = new Date().toISOString();
  const locked = options.locked ?? true;
  const sourceType = options.sourceType ?? 'user_edit';
  return {
    id,
    dimension,
    value,
    scope,
    confidence: options.confidence ?? (locked ? 0.98 : 0.82),
    evidenceCount: options.evidenceCount ?? (locked ? 3 : 2),
    createdAt: now,
    updatedAt: now,
    lastObservedAt: now,
    sourceType,
    state: locked ? 'locked' : options.state ?? 'confirmed',
    locked,
    enabled: true,
    decayRate: locked ? 0 : sourceType === 'implicit_feedback' ? 0.01 : 0.002,
    lifetime: locked ? 'locked' : 'durable',
    provenance: [{
      id: `${id}-seed`,
      sourceType,
      origin: sourceType === 'user_edit' ? 'dashboard' : 'user_composer',
      observedAt: now,
      signal: sourceType === 'implicit_feedback' ? 'prior_technical_depth_correction' : 'standalone_demo_seed',
      evidenceKind: sourceType === 'implicit_feedback' ? 'direct_correction' : 'dashboard_edit',
      strength: options.confidence ?? 0.9,
    }],
  };
}

const seededPreferences = (): PreferenceRecord[] => [
  makeRecord(SEED_IDS.verbosity, 'verbosity', 'concise', {}),
  makeRecord(SEED_IDS.answerFirst, 'answer_first_preference', 'answer_first', {}),
  makeRecord(SEED_IDS.javaDepth, 'technical_depth', 'advanced', { domain: 'software_engineering', subdomain: 'java' }),
  makeRecord(SEED_IDS.softwareCode, 'code_preference', 'preferred', { domain: 'software_engineering' }),
  makeRecord(SEED_IDS.financeDepth, 'technical_depth', 'beginner', { domain: 'finance', subdomain: 'fixed_income' }),
  makeRecord(SEED_IDS.financeFoundations, 'explanation_level', 'foundational', { domain: 'finance' }),
  makeRecord(SEED_IDS.financeExamples, 'example_preference', 'when_useful', { domain: 'finance' }, { locked: false, confidence: 0.72 }),
  makeRecord(
    SEED_IDS.infrastructureDepth,
    'technical_depth',
    'intermediate',
    { domain: 'software_engineering', subdomain: 'infrastructure' },
    { locked: false, confidence: 0.52, evidenceCount: 1, sourceType: 'implicit_feedback', state: 'inferred' },
  ),
];

const PROMPTS = {
  java: 'Explain Java virtual threads.',
  finance: 'Explain bond duration.',
  abstention: 'Explain bond convexity.',
  learningInitial: 'Explain Kubernetes StatefulSets.',
  correction: 'I already understand containers and pods. Skip the basics and make this more technical.',
  learningFollowUp: 'Explain Kubernetes operators.',
} as const;

const PROVIDERS: Provider[] = ['ChatGPT', 'Claude', 'Gemini', 'Local model'];

function scopeLabel(scope: Scope): string {
  return [scope.domain ? label(scope.domain) : 'Global', scope.subdomain && label(scope.subdomain), scope.task && label(scope.task)]
    .filter(Boolean)
    .join(' / ');
}

function sourceLabel(decision: UsageDecision): string {
  if (decision.sourceType === 'user_edit') return 'User-set in dashboard';
  if (decision.sourceType === 'profile_import') return 'Imported profile';
  if (decision.sourceType === 'explicit_feedback') return 'Direct statement';
  return decision.evidenceCount > 1 ? 'Repeated correction' : 'Single correction';
}

function responseKind(compiled: CompiledContext): 'java' | 'finance' | 'infrastructureAdvanced' | 'infrastructureIntermediate' | 'general' {
  if (compiled.classification.subdomain === 'java') return 'java';
  if (compiled.classification.subdomain === 'fixed_income') return 'finance';
  if (compiled.classification.subdomain === 'infrastructure') {
    return compiled.selected.some(({ preference }) => preference.dimension === 'technical_depth' && preference.value === 'advanced')
      ? 'infrastructureAdvanced'
      : 'infrastructureIntermediate';
  }
  return 'general';
}

const RESPONSE_KIND_LABELS: Record<ReturnType<typeof responseKind>, string> = {
  java: 'Advanced Java profile behavior',
  finance: 'Beginner fixed-income profile behavior',
  infrastructureAdvanced: 'Advanced infrastructure profile behavior',
  infrastructureIntermediate: 'Intermediate infrastructure profile behavior',
  general: 'Neutral profile behavior',
};

const RESPONSE_LIBRARY: Record<Provider, Record<ReturnType<typeof responseKind>, string>> = {
  ChatGPT: {
    java: 'Java virtual threads are JVM-managed threads designed for high-throughput, blocking I/O workloads. They preserve the thread-per-request programming model while multiplexing many virtual threads over fewer carrier threads. Use Executors.newVirtualThreadPerTaskExecutor(); avoid pinning carriers with long synchronized blocks, and measure throughput rather than expecting CPU-bound speedups.',
    finance: 'Bond duration estimates how sensitive a bond’s price is to interest-rate changes. As a practical approximation, a duration of 5 means that if rates rise by 1 percentage point, the bond price falls by about 5%. Example: a $1,000 bond would fall to roughly $950. Longer-maturity and lower-coupon bonds usually have higher duration.',
    infrastructureIntermediate: 'A StatefulSet manages pods that need stable identities and storage. Unlike interchangeable Deployment pods, each pod keeps an ordinal name such as db-0 and can receive its own persistent volume. It is useful for databases and clustered systems that depend on predictable membership.',
    infrastructureAdvanced: 'A Kubernetes operator encodes a reconciliation loop for a domain-specific resource. The controller watches desired state, compares it with observed state, and performs idempotent transitions until they converge. Production operators need explicit status conditions, finalizers, ownership boundaries, backoff, and upgrade-safe reconciliation—not imperative orchestration scripts.',
    general: 'The profile did not provide enough context-specific guidance, so this representative answer stays neutral.',
  },
  Claude: {
    java: 'Virtual threads make blocking Java code scale by decoupling application threads from OS threads. The scheduler mounts runnable virtual threads on carrier threads and unmounts them around supported blocking operations. They improve concurrency density, not raw computation speed; inspect pinning and avoid pooling virtual threads.',
    finance: 'Duration is a bond’s approximate percentage price response to a one-percentage-point rate move. A five-year duration implies roughly a 5% price decline when rates rise by one point, or a 5% increase when they fall by one point. This is an approximation; convexity refines it for larger moves.',
    infrastructureIntermediate: 'StatefulSets are for replicas that cannot be treated as anonymous. Kubernetes gives each pod a stable ordinal identity, ordered lifecycle, and a persistent-volume claim that survives pod replacement—properties commonly needed by databases.',
    infrastructureAdvanced: 'Operators extend Kubernetes through custom resources plus controllers. Treat reconciliation as a level-based, idempotent control loop: derive actions from current and desired state, persist progress in status conditions, use finalizers for external cleanup, and expect duplicate or out-of-order events.',
    general: 'No contextual preference was strong enough to alter this demonstration response.',
  },
  Gemini: {
    java: 'Virtual threads are lightweight Java threads scheduled by the JVM over carrier threads. They let I/O-heavy services keep straightforward blocking code while supporting very high concurrency. Create one per task, do not pool them, and watch for pinned carriers. They do not accelerate CPU-bound work.',
    finance: 'Duration is a simple measure of interest-rate risk. If a bond has duration 5, a 1% rise in rates implies an approximately 5% price drop. For a $1,000 bond, that is about $50. The relationship reverses when rates fall and becomes less exact for large changes.',
    infrastructureIntermediate: 'StatefulSets manage applications whose pods need persistent identity. Each replica receives a stable name, ordered startup and shutdown, and separate durable storage. That makes them suitable for databases and consensus-based services.',
    infrastructureAdvanced: 'Kubernetes operators implement application-specific control loops. A robust reconciler is idempotent, owns a narrow resource boundary, records conditions in status, handles deletion with finalizers, and converges from any observed state instead of assuming an event sequence.',
    general: 'This pre-generated example remains unpersonalized because applicability was uncertain.',
  },
  'Local model': {
    java: 'Virtual threads are cheap JVM-scheduled threads for blocking I/O concurrency. They map many application tasks onto fewer carrier threads. Use a virtual thread per task; do not pool them. Check synchronized/native sections that can pin carriers. CPU-bound throughput is unchanged.',
    finance: 'Duration approximates a bond price’s sensitivity to rates. Duration 5 means rates up 1 percentage point → price down about 5%. A $1,000 bond becomes roughly $950. Longer maturity usually means more sensitivity.',
    infrastructureIntermediate: 'StatefulSets give pods stable names, ordered lifecycle, and persistent storage. Use them when replicas have identity, such as a database cluster.',
    infrastructureAdvanced: 'An operator is an idempotent reconciliation loop over a custom resource. Compare desired and observed state, converge with retry-safe actions, expose status conditions, and use finalizers for external cleanup.',
    general: 'No relevant profile preference was applied.',
  },
};

function providerEnvelope(provider: Provider, instruction: string): string {
  if (!instruction) return 'No preference context emitted.';
  if (provider === 'Gemini') return `systemInstruction.parts[0].text\n${instruction}`;
  if (provider === 'Local model') return `[SYSTEM]\n${instruction}`;
  return `${provider} composer adapter · prepended model-neutral context\n${instruction}`;
}

export default function App() {
  const [preferences, setPreferences] = useState<PreferenceRecord[]>([]);
  const [prompt, setPrompt] = useState<string>(PROMPTS.java);
  const [provider, setProvider] = useState<Provider>('ChatGPT');
  const [scenario, setScenario] = useState<Scenario>('domain');
  const [compiled, setCompiled] = useState<CompiledContext>();
  const [lastContext, setLastContext] = useState<ClassifiedContext>();
  const [learningUpdate, setLearningUpdate] = useState<PreferenceUpdateEvent>();
  const [learningBefore, setLearningBefore] = useState<CompiledContext>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [dimension, setDimension] = useState<PreferenceDimension>('format_preference');
  const [value, setValue] = useState('prose');
  const [domain, setDomain] = useState<Domain | 'global'>('global');

  async function refresh() {
    setPreferences((await store.listPreferences()).sort((left, right) => {
      const leftScope = `${left.scope.domain ?? ''}${left.scope.subdomain ?? ''}`;
      const rightScope = `${right.scope.domain ?? ''}${right.scope.subdomain ?? ''}`;
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

  const used = compiled?.decisions.filter(({ status }) => status === 'used') ?? [];
  const suppressed = compiled?.decisions.filter(({ status }) => status !== 'used') ?? [];
  const portablePrompt = compiled?.instruction
    ? `${compiled.instruction}\n\n<user-request>\n${prompt.trim()}\n</user-request>`
    : prompt.trim();

  function selectPreset(nextPrompt: string, nextScenario: Scenario) {
    setPrompt(nextPrompt);
    setScenario(nextScenario);
    setCompiled(undefined);
    setLearningUpdate(undefined);
    setNotice('');
  }

  async function process(text = prompt, hint?: ClassifiedContext): Promise<CompiledContext | undefined> {
    if (!text.trim()) return undefined;
    try {
      const result = await engine.processPrompt({ prompt: text.trim(), provider, trustedUserAction: true, contextHint: hint });
      setPrompt(text);
      setCompiled(result);
      setLastContext(result.classification);
      if (result.updates[0]) setLearningUpdate(result.updates[0]);
      await refresh();
      setError('');
      setNotice(result.selected.length === 0
        ? 'The layer abstained: no stored preference was applicable.'
        : `Applied ${result.selected.length} relevant preference${result.selected.length === 1 ? '' : 's'}; unrelated preferences were withheld.`);
      return result;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not compile this prompt.');
      return undefined;
    }
  }

  async function startLearning() {
    setScenario('learning');
    setLearningUpdate(undefined);
    const result = await process(PROMPTS.learningInitial);
    if (result) setLearningBefore(result);
  }

  async function applyCorrection() {
    const result = await process(PROMPTS.correction, lastContext);
    if (result?.updates[0]) {
      setLearningUpdate(result.updates[0]);
      setNotice('Correction understood. The scoped preference changed locally; ask the follow-up to see its effect.');
    }
  }

  async function askLearningFollowUp() {
    await process(PROMPTS.learningFollowUp, lastContext);
  }

  async function update(preference: PreferenceRecord, patch: Partial<PreferenceRecord>) {
    const next = { ...preference, ...patch, updatedAt: new Date().toISOString() };
    if ('locked' in patch) {
      next.state = patch.locked ? 'locked' : 'confirmed';
      next.lifetime = patch.locked ? 'locked' : 'durable';
    }
    await store.putPreference(next);
    await refresh();
    setCompiled(undefined);
  }

  async function markWrong(decision: UsageDecision) {
    const record = await store.getPreference(decision.preferenceId);
    if (!record) return;
    const correction: Scope = {
      domain: compiled?.classification.domain,
      subdomain: compiled?.classification.subdomain,
      task: compiled?.classification.task,
    };
    const existing = record.notApplicableTo ?? [];
    await store.putPreference({
      ...record,
      updatedAt: new Date().toISOString(),
      notApplicableTo: [...existing, correction],
      provenance: [...record.provenance, {
        id: globalThis.crypto.randomUUID(),
        sourceType: 'implicit_feedback',
        origin: 'user_composer',
        observedAt: new Date().toISOString(),
        signal: 'not_applicable_for_context',
        evidenceKind: 'direct_correction',
        strength: 1,
        polarity: 'negative',
        scope: correction,
      }],
    });
    await refresh();
    setCompiled(undefined);
    setNotice(`${label(record.dimension)} remains in your profile but will not apply to similar ${scopeLabel(correction)} requests.`);
  }

  function changeDimension(next: PreferenceDimension) {
    setDimension(next);
    setValue(VALUES_BY_DIMENSION[next][0]);
  }

  async function addPreference(event: React.FormEvent) {
    event.preventDefault();
    const scope: Scope = domain === 'global' ? {} : { domain };
    await store.putPreference(makeRecord(globalThis.crypto.randomUUID(), dimension, value, scope, { locked: false }));
    await refresh();
    setNotice('Preference added to this browser-local profile.');
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(portablePrompt);
    setNotice(`Copied provider-neutral context for ${provider}.`);
  }

  async function exportData() {
    const profile = await exportProfile(store);
    const url = URL.createObjectURL(new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'preference-intelligence-profile.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('Exported a versioned Universal Preference Profile JSON file.');
  }

  async function importData(file?: File) {
    if (!file) return;
    try {
      await importProfile(store, JSON.parse(await file.text()), true);
      await refresh();
      setCompiled(undefined);
      setNotice('Validated and imported the profile locally.');
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The selected profile is invalid.');
    }
  }

  async function reset() {
    if (!window.confirm('Replace this local profile with the demonstration defaults?')) return;
    await store.clearPreferences();
    await store.clearUsageLogs();
    await Promise.all(seededPreferences().map((preference) => store.putPreference(preference)));
    setCompiled(undefined);
    setLearningUpdate(undefined);
    setLearningBefore(undefined);
    await refresh();
    setNotice('Demo profile restored.');
  }

  return (
    <main className="demo-site">
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top"><span>PI</span> Preference Intelligence</a>
        <div><a href="#demo">Demo</a><a href="#learning">Learning</a><a href="#privacy">Privacy</a><a href={REPOSITORY}>GitHub ↗</a></div>
      </nav>

      <header className="landing-hero" id="top">
        <p className="eyebrow">Open-source research prototype</p>
        <h1>Your preferences.<br /><em>Every AI.</em></h1>
        <p className="hero-copy">Preference Intelligence learns how you want AI to respond and carries those preferences across ChatGPT, Claude, Gemini, and local models.</p>
        <div className="hero-actions"><a className="cta" href="#demo">Try the demo</a><a className="secondary-cta" href={REPOSITORY}>View on GitHub ↗</a></div>
        <p className="trust-line"><span>● Browser-local</span><span>One portable profile</span><span>Current request wins</span></p>
      </header>

      <section className="thesis-strip">
        <h2>You shouldn’t have to teach every AI how you like answers.</h2>
        <div className="principles"><div><b>Portable</b><span>One canonical profile</span></div><div><b>Contextual</b><span>Expert here, beginner there</span></div><div><b>Transparent</b><span>Inspect, override, delete</span></div></div>
      </section>

      {error && <div role="alert" className="alert alert--error site-alert">{error}</div>}
      {notice && <div role="status" className="alert site-alert">{notice}</div>}

      <section className="demo-section" id="demo">
        <div className="section-intro"><p className="eyebrow">Interactive personalization demo</p><h2>Watch one profile adapt to the request.</h2><p>Choose a scenario, then inspect what the engine applies—and what it deliberately leaves out.</p></div>

        <div className="scenario-tabs" role="tablist" aria-label="Demonstration scenarios">
          <button className={scenario === 'domain' ? 'active' : ''} onClick={() => selectPreset(PROMPTS.java, 'domain')}>1 · Domain switching</button>
          <button className={scenario === 'abstention' ? 'active' : ''} onClick={() => selectPreset(PROMPTS.abstention, 'abstention')}>2 · Abstention</button>
          <button className={scenario === 'learning' ? 'active' : ''} onClick={() => selectPreset(PROMPTS.learningInitial, 'learning')}>3 · Learning loop</button>
        </div>

        <div className="demo-workbench">
          <div className="request-column">
            <div className="profile-preview">
              <p className="overline">Example user profile</p>
              <div><span>Global</span><b>Concise · answer first</b></div>
              <div><span>Software / Java</span><b>Advanced · code preferred</b></div>
              <div><span>Finance / Fixed income</span><b>Beginner · explain terms</b></div>
            </div>

            {scenario !== 'learning' ? <>
              <div className="preset-row">
                <button onClick={() => selectPreset(PROMPTS.java, 'domain')}>Java virtual threads</button>
                <button onClick={() => selectPreset(PROMPTS.finance, 'domain')}>Bond duration</button>
                <button onClick={() => selectPreset(PROMPTS.abstention, 'abstention')}>Convexity abstention</button>
              </div>
              <label className="field">Ask any request<textarea aria-label="Your request" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} /></label>
              <button className="cta full" onClick={() => void process()}>Personalize this request →</button>
            </> : <div className="learning-steps" id="learning">
              <button className={learningBefore ? 'done' : ''} onClick={() => void startLearning()}><span>1</span><div><b>Ask the first question</b><small>{PROMPTS.learningInitial}</small></div></button>
              <button className={learningUpdate ? 'done' : ''} disabled={!learningBefore} onClick={() => void applyCorrection()}><span>2</span><div><b>Correct the response style</b><small>{PROMPTS.correction}</small></div></button>
              <button disabled={!learningUpdate} onClick={() => void askLearningFollowUp()}><span>3</span><div><b>Ask a follow-up</b><small>{PROMPTS.learningFollowUp}</small></div></button>
              <p className="storage-note">The correction text is shown transiently here. Only its bounded signal label and scores are stored.</p>
            </div>}
          </div>

          <div className="decision-column" aria-live="polite">
            {!compiled ? <div className="decision-empty"><span>↳</span><h3>Run a scenario</h3><p>Detected context, applied defaults, and explicit abstentions will appear here.</p></div> : <>
              <div className="context-card">
                <p className="overline">Detected context</p>
                <dl><div><dt>Domain</dt><dd>{label(compiled.classification.domain)}</dd></div><div><dt>Subdomain</dt><dd>{label(compiled.classification.subdomain ?? 'None')}</dd></div><div><dt>Task</dt><dd>{label(compiled.classification.task)}</dd></div><div><dt>Classifier</dt><dd>{compiled.classification.method === 'abstained' ? 'Abstained / general' : `${Math.round(compiled.classification.confidence * 100)}% rules`}</dd></div></dl>
                {compiled.classification.domains && compiled.classification.domains.length > 1 && <p className="candidate-line">Also detected: {compiled.classification.domains.slice(1).map(({ domain: item }) => label(item)).join(', ')}</p>}
              </div>

              <div className="decision-group">
                <p className="overline">Applied preferences · {used.length}</p>
                {used.map((decision) => <details className="decision-row used" key={`used-${decision.preferenceId}`}>
                  <summary><span>✓</span><b>{label(decision.dimension)}: {label(decision.value)}</b><i>{Math.round(decision.applicability * 100)}% applicable</i></summary>
                  <div className="why-detail"><p>{decision.reason}</p><dl><div><dt>Scope</dt><dd>{scopeLabel(decision.scope)}</dd></div><div><dt>Evidence confidence</dt><dd>{Math.round(decision.evidenceConfidence * 100)}%</dd></div><div><dt>Semantic relevance</dt><dd>{Math.round(decision.semanticRelevance * 100)}%</dd></div><div><dt>Evidence</dt><dd>{decision.evidenceCount} observation{decision.evidenceCount === 1 ? '' : 's'}</dd></div><div><dt>Source</dt><dd>{sourceLabel(decision)}</dd></div><div><dt>Lifetime</dt><dd>{label(decision.lifetime)}</dd></div></dl><button className="wrong-control" onClick={(event) => { event.preventDefault(); void markWrong(decision); }}>This preference wasn’t relevant here</button></div>
                </details>)}
              </div>

              <details className="suppressed-box" open={scenario === 'abstention'}>
                <summary>Suppressed or overridden · {suppressed.length} <span>Why not?</span></summary>
                {suppressed.slice(0, 8).map((decision) => <div className="decision-row suppressed" key={`suppressed-${decision.preferenceId}-${decision.status}`}><span>×</span><div><b>{label(decision.dimension)}: {label(decision.value)}</b><p>{decision.reason}</p></div><i>{label(decision.status.replace('suppressed_', ''))}</i></div>)}
              </details>
            </>}
          </div>
        </div>

        {learningUpdate && <article className="update-event">
          <div><p className="overline">Preference updated</p><h3>{label(learningUpdate.dimension)}</h3></div>
          <div><span>Value</span><b>{label(learningUpdate.previousValue ?? 'None')} <i>→</i> {label(learningUpdate.value)}</b></div>
          <div><span>Scope</span><b>{scopeLabel(learningUpdate.scope)}</b></div>
          <div><span>Evidence confidence</span><b>{Math.round((learningUpdate.previousConfidence ?? 0) * 100)}% <i>→</i> {Math.round(learningUpdate.confidence * 100)}%</b></div>
          <div><span>Why</span><b>{learningUpdate.rationale.replaceAll('_', ' ')}</b></div>
        </article>}

        {compiled && <section className="response-stage">
          <div className="response-heading"><div><p className="eyebrow">Response behavior</p><h2>Same preferences, different model.</h2></div><div className="provider-tabs" role="tablist">{PROVIDERS.map((item) => <button className={provider === item ? 'active' : ''} onClick={() => setProvider(item)} key={item}>{item}</button>)}</div></div>
          <div className="disclosure"><b>Pre-generated demonstration response</b> · No live model or provider API is called on this public page.</div>
          <article className="model-response"><header><span>{provider}</span><small>{RESPONSE_KIND_LABELS[responseKind(compiled)]}</small></header><p>{RESPONSE_LIBRARY[provider][responseKind(compiled)]}</p></article>
          <details className="compiled-output"><summary>Inspect {provider} context envelope · ≈{compiled.estimatedTokens} preference tokens</summary><pre>{providerEnvelope(provider, compiled.instruction)}</pre><button onClick={() => void copyPrompt()}>Copy portable prompt</button></details>
        </section>}
      </section>

      <section className="how-section" id="how"><div className="section-intro"><p className="eyebrow">How it works</p><h2>A small policy, selected at the moment it matters.</h2></div><div className="pipeline"><div><span>01</span><b>Observe</b><p>Trusted user statements and corrections only.</p></div><i>→</i><div><span>02</span><b>Classify</b><p>Domain, subdomain, task, and uncertainty.</p></div><i>→</i><div><span>03</span><b>Evaluate</b><p>Scope, relevance, evidence, conflicts.</p></div><i>→</i><div><span>04</span><b>Compile</b><p>Up to eight compact, relevant defaults.</p></div></div></section>

      <section className="portability-section" id="portability">
        <div className="section-intro"><p className="eyebrow">Cross-model portability</p><h2>One profile—not four preference databases.</h2><p>The canonical profile is provider-independent. Thin adapters insert the same selected policy into each supported composer.</p></div>
        <div className="portability-map"><div className="profile-node"><span>UPP 0.1.0</span><b>Canonical preference profile</b><small>{preferences.length} local records</small></div><div className="branch" aria-hidden="true"><i /><i /><i /><i /></div><div className="provider-nodes"><div><b>ChatGPT</b><span>Implemented*</span></div><div><b>Claude</b><span>Implemented*</span></div><div><b>Gemini</b><span>Experimental</span></div><div><b>Local models</b><span>Research</span></div></div></div>
        <p className="footnote">* Adapter and fixture tested; live provider DOM smoke testing is still required for each UI release.</p>
      </section>

      <section className="privacy-section" id="privacy">
        <div className="privacy-copy"><p className="eyebrow">Local-first by default</p><h2>Your response policy belongs to you.</h2><p>No Preference Intelligence account, backend, analytics, or cloud sync. The provider still receives the prompt you intentionally send.</p><div className="profile-actions"><button onClick={() => void exportData()}>Export Profile</button><label className="button-like">Import Profile<input type="file" accept="application/json" onChange={(event) => void importData(event.target.files?.[0])} /></label><button onClick={() => void reset()}>Reset Profile</button></div></div>
        <div className="privacy-panel"><div><h3>Stored locally</h3><p>✓ Preferences</p><p>✓ Evidence confidence scores</p><p>✓ Bounded evidence metadata</p><p>✓ Why-used decisions</p></div><div><h3>Not stored by default</h3><p>× Full chat history</p><p>× Browsing history</p><p>× AI-generated assumptions</p><p>× Sensitive demographic profiles</p></div></div>
      </section>

      <section className="inspection-section">
        <details>
          <summary><div><p className="eyebrow">Transparent controls</p><h2>Inspect and edit the browser-local profile</h2></div><span>Open profile inspector ↓</span></summary>
          <div className="inspector-body">
            <form className="new-preference" onSubmit={(event) => void addPreference(event)}>
              <label>Dimension<select value={dimension} onChange={(event) => changeDimension(event.target.value as PreferenceDimension)}>{DIMENSIONS.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
              <label>Value<select value={value} onChange={(event) => setValue(event.target.value)}>{VALUES_BY_DIMENSION[dimension].map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
              <label>Scope<select value={domain} onChange={(event) => setDomain(event.target.value as Domain | 'global')}><option value="global">Global</option>{DOMAINS.filter((item) => item !== 'general').map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
              <button className="primary" type="submit">Add preference</button>
            </form>
            {grouped.map(([group, items]) => <div className="preference-group" key={group}><h2>{label(group)}</h2><div className="preference-grid">{items.map((preference) => <article className={`preference-card ${preference.enabled ? '' : 'muted'}`} key={preference.id}><div className="preference-card__heading"><div><h3>{label(preference.dimension)}</h3><select aria-label={`Value for ${preference.dimension}`} value={preference.value} onChange={(event) => void update(preference, { value: event.target.value })}>{VALUES_BY_DIMENSION[preference.dimension].map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></div><span className={`state state--${preference.state}`}>{preference.enabled ? label(preference.state) : 'Disabled'}</span></div><div className="meter"><span style={{ width: `${preference.confidence * 100}%` }} /></div><p className="meta">{scopeLabel(preference.scope)} · {Math.round(preference.confidence * 100)}% evidence confidence · {preference.evidenceCount} observation{preference.evidenceCount === 1 ? '' : 's'}</p><details className="why-box"><summary>Why?</summary><p>{preference.provenance.at(-1)?.signal ?? 'User-managed preference'}</p><p>Source: {label(preference.sourceType)} · Lifetime: {label(preference.lifetime ?? 'durable')}</p></details><div className="card-actions"><button className="small" onClick={() => void update(preference, { locked: !preference.locked })}>{preference.locked ? 'Unlock' : 'Lock'}</button><button className="small" onClick={() => void update(preference, { enabled: !preference.enabled, state: preference.enabled ? 'suppressed' : 'confirmed' })}>{preference.enabled ? 'Disable' : 'Enable'}</button><button className="small danger" onClick={() => void store.deletePreference(preference.id).then(refresh)}>Delete</button></div></article>)}</div></div>)}
          </div>
        </details>
      </section>

      <section className="status-section">
        <div className="section-intro"><p className="eyebrow">Honest product status</p><h2>Working mechanism, open research questions.</h2></div>
        <div className="status-grid"><div><b>Chrome extension</b><span className="implemented">Implemented</span><p>Local engine, dashboard, export/import, ChatGPT and Claude adapters.</p></div><div><b>Gemini adapter</b><span className="experimental-label">Experimental</span><p>Code placeholder; intentionally excluded from extension permissions.</p></div><div><b>Local-model evaluation</b><span className="research-label">Research</span><p>128 real generations; execution and token behavior measured.</p></div><div><b>Cloud sync</b><span className="planned">Not implemented</span><p>Profiles stay on this device unless the user exports them.</p></div></div>
        <div className="research-note"><b>Evidence boundary</b><p>The real pilot found an input-compression/output-expansion trade-off. It does not show that personalization improves subjective answer quality; a powered human study is the next major step.</p><a href={`${REPOSITORY}/blob/main/research/experiments/real_local_model_results.md`}>Read measured results ↗</a></div>
      </section>

      <footer><div><b>Preference Intelligence</b><p>A user-owned response policy for every AI.</p></div><div><a href={`${REPOSITORY}/tree/main/product/extension`}>Install extension</a><a href={`${REPOSITORY}/blob/main/research/specification/preference-profile.schema.json`}>Profile schema</a><a href={REPOSITORY}>GitHub</a></div></footer>
    </main>
  );
}
