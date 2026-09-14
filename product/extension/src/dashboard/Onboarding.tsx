import { useMemo, useState } from 'react';
import { parseExistingInstructions, type OnboardingPreferenceInput } from '../engine/onboarding';
import {
  PRIMARY_USE_AREAS,
  type PreferenceDimension,
  type PrimaryUseArea,
} from '../engine/types';

interface OnboardingProps {
  onComplete(preferences: OnboardingPreferenceInput[], primaryUseAreas: PrimaryUseArea[]): Promise<void>;
}

interface AnswerChoice {
  label: string;
  dimension: PreferenceDimension;
  value: string;
  signal: string;
  answer: string;
}

const STEPS: ReadonlyArray<{
  eyebrow: string;
  title: string;
  question: string;
  choices: readonly [AnswerChoice, AnswerChoice];
}> = [
  {
    eyebrow: '1 · Answer length',
    title: 'Which answer would you rather receive?',
    question: 'Question: What does a browser cache do?',
    choices: [
      {
        label: 'Short answer', dimension: 'verbosity', value: 'concise', signal: 'onboarding_chose_concise',
        answer: 'A browser cache keeps local copies of website files so repeat visits load faster and use less network data.',
      },
      {
        label: 'Detailed answer', dimension: 'verbosity', value: 'detailed', signal: 'onboarding_chose_detailed',
        answer: 'A browser cache stores local copies of resources such as images, stylesheets, and scripts. On a later visit, the browser can reuse a valid cached copy instead of downloading it again. HTTP cache headers control how long a copy remains fresh and when the browser must revalidate it with the server. This reduces latency, bandwidth use, and server load.',
      },
    ],
  },
  {
    eyebrow: '2 · Structure',
    title: 'Which format is easier for you to scan?',
    question: 'Question: What does a browser cache improve?',
    choices: [
      {
        label: 'Bullet points', dimension: 'format_preference', value: 'bullets', signal: 'onboarding_chose_bullets',
        answer: 'A browser cache improves:\n\n• page-load speed\n• bandwidth use\n• repeat-visit latency\n• origin-server load',
      },
      {
        label: 'Connected prose', dimension: 'format_preference', value: 'prose', signal: 'onboarding_chose_prose',
        answer: 'A browser cache makes repeat visits faster while reducing bandwidth consumption and work on the origin server.',
      },
    ],
  },
  {
    eyebrow: '3 · Code',
    title: 'For a programming question, where should code appear?',
    question: 'Question: How can I debounce a JavaScript input?',
    choices: [
      {
        label: 'Code first', dimension: 'code_preference', value: 'preferred', signal: 'onboarding_chose_code_first',
        answer: '```js\nconst debounce = (fn, wait) => {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), wait);\n  };\n};\n```\n\nReset the timer on each call so only the final call runs.',
      },
      {
        label: 'Explanation first', dimension: 'code_preference', value: 'when_useful', signal: 'onboarding_chose_explanation_first',
        answer: 'Debouncing delays work until calls have stopped for a chosen interval. Keep one timer, clear it whenever a new event arrives, and start a replacement timer. Then add a small implementation if it helps apply the idea.',
      },
    ],
  },
  {
    eyebrow: '4 · Explanatory style',
    title: 'Which explanation feels more useful?',
    question: 'Question: What is a browser cache?',
    choices: [
      {
        label: 'Use an analogy', dimension: 'analogy_preference', value: 'preferred', signal: 'onboarding_chose_analogies',
        answer: 'A browser cache is like keeping frequently used ingredients on the kitchen counter: the browser can reach them immediately instead of returning to the store every time.',
      },
      {
        label: 'Keep it literal', dimension: 'analogy_preference', value: 'avoid', signal: 'onboarding_chose_literal_explanations',
        answer: 'A browser cache is a local store of previously downloaded HTTP resources. Valid cached resources can be reused without another complete transfer.',
      },
    ],
  },
];

function label(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [screen, setScreen] = useState(0);
  const [selections, setSelections] = useState(new Map<PreferenceDimension, OnboardingPreferenceInput>());
  const [areas, setAreas] = useState<PrimaryUseArea[]>([]);
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const imported = useMemo(() => parseExistingInstructions(instructions), [instructions]);
  const totalScreens = STEPS.length + 2;

  function choose(choice: AnswerChoice) {
    setSelections((current) => {
      const next = new Map(current);
      next.set(choice.dimension, {
        dimension: choice.dimension,
        value: choice.value,
        signal: choice.signal,
        evidenceKind: 'onboarding_choice',
      });
      return next;
    });
  }

  function toggleArea(area: PrimaryUseArea) {
    setAreas((current) => current.includes(area) ? current.filter((item) => item !== area) : [...current, area]);
  }

  async function finish(skipAll = false) {
    setSaving(true);
    setError('');
    try {
      if (skipAll) {
        await onComplete([], []);
        return;
      }
      const merged = new Map(selections);
      for (const preference of imported) merged.set(preference.dimension, preference);
      await onComplete([...merged.values()], areas);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Setup could not be saved.');
      setSaving(false);
    }
  }

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card" aria-live="polite">
        <header className="onboarding-header">
          <div>
            <p className="eyebrow">Preference Intelligence</p>
            <p className="onboarding-progress">{screen + 1} of {totalScreens}</p>
          </div>
          <button className="skip-link" disabled={saving} onClick={() => void finish(true)}>Skip setup</button>
        </header>

        {error && <div role="alert" className="alert alert--error">{error}</div>}

        {screen === 0 && (
          <div className="onboarding-intro">
            <p className="eyebrow">No account · no server · no telemetry</p>
            <h1>Make every AI answer more like yours.</h1>
            <p>Choose between real answer examples. Your selections become a readable local profile that you can edit or delete at any time.</p>
            <ul>
              <li>Selections are global in v1, so they work immediately.</li>
              <li>Setup choices start at 50% confidence and remain easy to correct.</li>
              <li>The instruction is shown in the composer before anything is sent.</li>
            </ul>
            <button className="primary onboarding-primary" onClick={() => setScreen(1)}>Compare answers</button>
          </div>
        )}

        {screen > 0 && screen <= STEPS.length && (() => {
          const step = STEPS[screen - 1];
          const selected = selections.get(step.choices[0].dimension);
          return (
            <div className="onboarding-step">
              <p className="eyebrow">{step.eyebrow}</p>
              <h1>{step.title}</h1>
              <p className="setup-question">{step.question}</p>
              <div className="answer-pair">
                {step.choices.map((choice) => (
                  <button
                    key={choice.value}
                    className={`answer-choice ${selected?.value === choice.value ? 'selected' : ''}`}
                    aria-pressed={selected?.value === choice.value}
                    onClick={() => choose(choice)}
                  >
                    <strong>{choice.label}</strong>
                    <span>{choice.answer}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {screen === totalScreens - 1 && (
          <div className="onboarding-step">
            <p className="eyebrow">5 · Bring your defaults</p>
            <h1>What do you use AI for?</h1>
            <p>These areas seed no preferences. They only record which contextual features may be useful in a future opt-in v2.</p>
            <div className="area-grid">
              {PRIMARY_USE_AREAS.map((area) => (
                <button key={area} aria-pressed={areas.includes(area)} className={areas.includes(area) ? 'selected' : ''} onClick={() => toggleArea(area)}>{label(area)}</button>
              ))}
            </div>
            <label className="instruction-import">
              <strong>Already have ChatGPT custom instructions or a Claude style?</strong>
              <span>Paste them here. Parsing happens locally and only bounded preferences are saved.</span>
              <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Example: Keep answers concise, use bullets, and put the answer first." />
            </label>
            {instructions && <p className="parse-preview">Recognized {imported.length}: {imported.map((item) => `${label(item.dimension)} → ${label(item.value)}`).join(' · ') || 'no supported preferences yet'}</p>}
          </div>
        )}

        {screen > 0 && (
          <footer className="onboarding-actions">
            <button disabled={saving} onClick={() => setScreen((current) => Math.max(0, current - 1))}>Back</button>
            {screen < totalScreens - 1
              ? <><button disabled={saving} onClick={() => setScreen((current) => current + 1)}>Skip this choice</button><button className="primary" disabled={saving} onClick={() => setScreen((current) => current + 1)}>Continue</button></>
              : <button className="primary" disabled={saving} onClick={() => void finish()}>{saving ? 'Saving locally…' : `Finish with ${new Set([...selections.keys(), ...imported.map((item) => item.dimension)]).size} preferences`}</button>}
          </footer>
        )}
      </section>
    </main>
  );
}
