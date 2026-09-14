import type { CompiledContext } from '../engine/types';

const HOST_ID = 'preference-intelligence-indicator';

function label(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function showPreferenceIndicator(
  compiled: CompiledContext,
  root: Document = document,
  onNotRelevant?: (preferenceId: string) => Promise<void>,
): HTMLElement {
  let host = root.getElementById(HOST_ID) as HTMLElement | null;
  if (!host) {
    host = root.createElement('div');
    host.id = HOST_ID;
    root.documentElement.append(host);
    host.attachShadow({ mode: 'open' });
  }

  const shadow = host.shadowRoot!;
  shadow.replaceChildren();
  const style = root.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .pi-wrap { position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; font: 12px/1.4 ui-sans-serif, system-ui, sans-serif; color: #17231e; }
    button { border: 1px solid #b9c9bf; border-radius: 999px; background: #f7faf8; color: #214d3d; box-shadow: 0 8px 28px rgba(20,40,31,.18); padding: 8px 11px; font: 700 11px/1 ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
    button span { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #3d946e; margin-right: 6px; }
    .panel { display: none; position: absolute; right: 0; bottom: 40px; width: 290px; max-height: 340px; overflow: auto; background: #fff; border: 1px solid #d8dfda; border-radius: 12px; box-shadow: 0 15px 45px rgba(20,40,31,.2); padding: 13px; }
    .open .panel { display: block; }
    h2 { font: 700 13px/1.25 ui-sans-serif, system-ui, sans-serif; margin: 0 0 4px; }
    .context { color: #66736c; font-size: 10px; margin: 0 0 11px; }
    .section { border-top: 1px solid #e6eae7; padding-top: 8px; margin-top: 8px; }
    h3 { color: #65726b; font: 800 9px/1 ui-sans-serif, system-ui, sans-serif; text-transform: uppercase; letter-spacing: .08em; margin: 0 0 6px; }
    p { margin: 5px 0; font-size: 10px; }
    p.used::before { content: '✓'; color: #2d805f; margin-right: 6px; }
    p.suppressed::before { content: '×'; color: #ad604c; margin-right: 6px; }
    small { display: block; color: #78817c; margin-left: 14px; }
    .wrong { box-shadow: none; border-color: #e1c5bc; color: #8b4c3e; background: #fffafa; margin: 2px 0 7px 14px; padding: 5px 7px; font-size: 9px; }
  `;

  const wrapper = root.createElement('div');
  wrapper.className = 'pi-wrap';
  const toggle = root.createElement('button');
  toggle.type = 'button';
  const applied = compiled.decisions.filter(({ status }) => status === 'used');
  const suppressed = compiled.decisions.filter(({ status }) => status !== 'used');
  toggle.append(root.createElement('span'), `Preference Intelligence · Using ${applied.length}`);
  toggle.setAttribute('aria-expanded', 'false');

  const panel = root.createElement('div');
  panel.className = 'panel';
  const heading = root.createElement('h2');
  heading.textContent = applied.length ? `${applied.length} preference${applied.length === 1 ? '' : 's'} applied` : 'No preferences applied';
  const context = root.createElement('p');
  context.className = 'context';
  context.textContent = `${label(compiled.classification.domain)} · ${label(compiled.classification.task)} · ${compiled.estimatedTokens} tokens`;
  panel.append(heading, context);

  const usedSection = root.createElement('div');
  usedSection.className = 'section';
  const usedHeading = root.createElement('h3');
  usedHeading.textContent = 'Applied';
  usedSection.append(usedHeading);
  for (const item of applied) {
    const row = root.createElement('p');
    row.className = 'used';
    row.textContent = `${label(item.dimension)}: ${label(item.value)}`;
    usedSection.append(row);
    if (onNotRelevant) {
      const wrong = root.createElement('button');
      wrong.type = 'button';
      wrong.className = 'wrong';
      wrong.textContent = 'Wasn’t relevant here';
      wrong.addEventListener('click', () => {
        wrong.disabled = true;
        void onNotRelevant(item.preferenceId)
          .then(() => { wrong.textContent = 'Saved for similar requests'; })
          .catch(() => { wrong.textContent = 'Could not save'; wrong.disabled = false; });
      });
      usedSection.append(wrong);
    }
  }
  if (!applied.length) {
    const row = root.createElement('p');
    row.textContent = 'The engine abstained for this request.';
    usedSection.append(row);
  }
  panel.append(usedSection);

  if (suppressed.length) {
    const suppressedSection = root.createElement('div');
    suppressedSection.className = 'section';
    const suppressedHeading = root.createElement('h3');
    suppressedHeading.textContent = `Not applied · ${suppressed.length}`;
    suppressedSection.append(suppressedHeading);
    for (const item of suppressed.slice(0, 4)) {
      const row = root.createElement('p');
      row.className = 'suppressed';
      row.textContent = `${label(item.dimension)}: ${label(item.value)}`;
      const reason = root.createElement('small');
      reason.textContent = item.reason;
      suppressedSection.append(row, reason);
    }
    panel.append(suppressedSection);
  }

  toggle.addEventListener('click', () => {
    wrapper.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(wrapper.classList.contains('open')));
  });
  wrapper.append(toggle, panel);
  shadow.append(style, wrapper);
  return host;
}
