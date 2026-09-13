import type {
  ExtractionInput,
  PreferenceDimension,
  PreferenceEvidence,
  Scope,
} from './types';

interface SignalRule {
  dimension: PreferenceDimension;
  value: string;
  signal: string;
  patterns: readonly RegExp[];
  strength: number;
  learnAsCorrection?: boolean;
}

const SIGNAL_RULES: readonly SignalRule[] = [
  { dimension: 'verbosity', value: 'concise', signal: 'asks_for_conciseness', strength: 0.92, learnAsCorrection: true, patterns: [/\b(make|keep) (it |this |(?:the )?answers? )?(shorter|concise|brief)\b/i, /\bno (long|lengthy) (answers?|explanations?)\b/i] },
  { dimension: 'verbosity', value: 'detailed', signal: 'asks_for_detail', strength: 0.88, learnAsCorrection: true, patterns: [/\b(more detail|be more detailed|thorough explanation)\b/i] },
  { dimension: 'technical_depth', value: 'advanced', signal: 'rejects_basic_explanation', strength: 0.94, learnAsCorrection: true, patterns: [/\b(don't|do not|skip) explain (the )?(basics?|basic\s+\w+\s+syntax)\b/i, /\bassume (I am|I'm) (an )?(advanced|expert)\b/i] },
  { dimension: 'technical_depth', value: 'beginner', signal: 'asks_for_beginner_level', strength: 0.92, patterns: [/\b(explain|teach).*(beginner|new to|from scratch)\b/i, /\bassume (I know nothing|no prior knowledge)\b/i] },
  { dimension: 'explanation_level', value: 'foundational', signal: 'asks_for_foundations', strength: 0.85, patterns: [/\b(explain the fundamentals|start with the basics|from first principles)\b/i] },
  { dimension: 'explanation_level', value: 'minimal', signal: 'rejects_explanation', strength: 0.9, learnAsCorrection: true, patterns: [/\b(no explanation|just (give|show) me the answer)\b/i] },
  { dimension: 'code_preference', value: 'preferred', signal: 'asks_for_code', strength: 0.9, learnAsCorrection: true, patterns: [/\b(give|show) me code first\b/i, /\bprefer (the )?code (over|to) prose\b/i] },
  { dimension: 'code_preference', value: 'avoid', signal: 'rejects_code', strength: 0.9, learnAsCorrection: true, patterns: [/\b(no code|avoid code|prose only)\b/i] },
  { dimension: 'example_preference', value: 'preferred', signal: 'asks_for_examples', strength: 0.82, learnAsCorrection: true, patterns: [/\b(include|use|give) (more |concrete )?examples?\b/i] },
  { dimension: 'example_preference', value: 'avoid', signal: 'rejects_examples', strength: 0.9, learnAsCorrection: true, patterns: [/\b(no examples|skip the examples)\b/i] },
  { dimension: 'analogy_preference', value: 'preferred', signal: 'asks_for_analogies', strength: 0.84, patterns: [/\b(use (an )?analog(y|ies)|explain by analogy)\b/i] },
  { dimension: 'analogy_preference', value: 'avoid', signal: 'rejects_analogies', strength: 0.9, patterns: [/\b(no analog(y|ies)|avoid analog(y|ies))\b/i] },
  { dimension: 'format_preference', value: 'bullets', signal: 'asks_for_bullets', strength: 0.86, patterns: [/\buse (bullet points|bullets)\b/i] },
  { dimension: 'format_preference', value: 'prose', signal: 'asks_for_prose', strength: 0.86, patterns: [/\b(use prose|no bullet points)\b/i] },
  { dimension: 'step_by_step_preference', value: 'preferred', signal: 'asks_for_steps', strength: 0.86, patterns: [/\b(step[- ]by[- ]step|walk me through)\b/i] },
  { dimension: 'step_by_step_preference', value: 'avoid', signal: 'rejects_steps', strength: 0.9, patterns: [/\b(no step[- ]by[- ]step|skip the steps)\b/i] },
  { dimension: 'tone', value: 'professional', signal: 'asks_for_professional_tone', strength: 0.86, patterns: [/\b(professional|formal) tone\b/i] },
  { dimension: 'tone', value: 'casual', signal: 'asks_for_casual_tone', strength: 0.86, patterns: [/\b(casual|conversational) tone\b/i] },
  { dimension: 'math_depth', value: 'rigorous', signal: 'asks_for_math_rigor', strength: 0.88, patterns: [/\b(mathematically rigorous|show (the )?derivation|include proofs?)\b/i] },
  { dimension: 'math_depth', value: 'minimal', signal: 'rejects_math', strength: 0.9, patterns: [/\b(no math|avoid equations|without equations)\b/i] },
  { dimension: 'citation_preference', value: 'preferred', signal: 'asks_for_citations', strength: 0.86, patterns: [/\b(include|provide|use) (sources|citations|references)\b/i] },
  { dimension: 'answer_first_preference', value: 'answer_first', signal: 'asks_for_answer_first', strength: 0.9, patterns: [/\b(answer|recommendation|bottom line) first\b/i] },
];

function inferredScope(input: ExtractionInput): Scope {
  const saysGlobal = /\b(always|in general|by default|from now on)\b/i.test(input.text);
  if (saysGlobal && input.context.domain === 'general') return {};

  return {
    domain: input.context.domain === 'general' ? undefined : input.context.domain,
    subdomain: input.context.subdomain,
  };
}

export class PreferenceExtractor {
  extract(input: ExtractionInput): PreferenceEvidence[] {
    if (!input.isTrustedUserAction || input.origin !== 'user_composer') return [];

    // Temporary language is executed through currentTurnConstraints but must never
    // mutate the durable profile, even when it resembles a correction.
    if (/\b(for this (one|answer|request)|this time|just this once|today|in this (answer|response|conversation))\b/i.test(input.text)) {
      return [];
    }

    const scope = inferredScope(input);
    const hasDurableLanguage = /\b(always|usually|in general|by default|from now on|I prefer|never|don't ever|do not ever)\b/i.test(input.text);
    return SIGNAL_RULES.filter((rule) =>
      rule.patterns.some((pattern) => pattern.test(input.text)) && (hasDurableLanguage || rule.learnAsCorrection),
    ).map(
      (rule) => ({
        dimension: rule.dimension,
        value: rule.value,
        scope,
        strength: rule.strength,
        sourceType: hasDurableLanguage ? 'explicit_feedback' : 'implicit_feedback',
        origin: 'user_composer',
        observedAt: new Date().toISOString(),
        signal: rule.signal,
      }),
    );
  }

  /** Dimensions explicitly requested for this turn. These suppress conflicting stored values. */
  currentTurnConstraints(text: string): Map<PreferenceDimension, string> {
    const constraints = new Map<PreferenceDimension, string>();
    for (const rule of SIGNAL_RULES) {
      if (rule.patterns.some((pattern) => pattern.test(text))) constraints.set(rule.dimension, rule.value);
    }

    if (/\b(\d{3,}|comprehensive|exhaustive)\s*(word|explanation|guide)?/i.test(text)) {
      constraints.set('verbosity', 'detailed');
    }
    if (/\b(one sentence|one paragraph|in \d+ words|briefly|tl;dr)\b/i.test(text)) {
      constraints.set('verbosity', 'concise');
    }
    return constraints;
  }
}
