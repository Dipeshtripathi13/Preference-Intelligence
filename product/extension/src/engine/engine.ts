import { ContextCompiler } from './contextCompiler';
import { DomainClassifier } from './domainClassifier';
import { PreferenceExtractor } from './extractor';
import { PreferenceRanker } from './ranker';
import { PreferenceRetriever } from './retriever';
import type { PreferenceStore } from './store';
import type { ClassifiedContext, CompiledContext, PreferenceUpdateEvent, UsageDecision, UsageLog } from './types';
import { PreferenceUpdater } from './updater';

function identifier(): string {
  return globalThis.crypto?.randomUUID?.() ?? `usage-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface ProcessPromptInput {
  prompt: string;
  provider: string;
  trustedUserAction: boolean;
  contextHint?: ClassifiedContext;
}

export class PreferenceEngine {
  private readonly classifier = new DomainClassifier();
  private readonly extractor = new PreferenceExtractor();
  private readonly updater: PreferenceUpdater;
  private readonly retriever: PreferenceRetriever;
  private readonly ranker = new PreferenceRanker();
  private readonly compiler = new ContextCompiler(this.extractor);

  constructor(private readonly store: PreferenceStore) {
    this.updater = new PreferenceUpdater(store);
    this.retriever = new PreferenceRetriever(store);
  }

  async processPrompt(input: ProcessPromptInput): Promise<CompiledContext> {
    const settings = await this.store.getSettings();
    const condition = settings.experimentalMode ? settings.experimentCondition : 'global_learned';
    const contextualExperiment = settings.experimentalMode && condition === 'domain_conditioned';
    let classification: ClassifiedContext = contextualExperiment
      ? this.classifier.classify(input.prompt)
      : { domain: 'general', task: 'general', confidence: 1, method: 'abstained' };
    if (contextualExperiment && classification.domain === 'general' && input.contextHint
      && this.extractor.currentTurnConstraints(input.prompt).size > 0) {
      classification = { ...input.contextHint, confidence: Math.min(input.contextHint.confidence, 0.7) };
    }

    const updates: PreferenceUpdateEvent[] = [];
    if (settings.learningEnabled && input.trustedUserAction) {
      const evidence = this.extractor.extract({
        text: input.prompt,
        context: classification,
        origin: 'user_composer',
        isTrustedUserAction: true,
      });
      for (const item of evidence) updates.push((await this.updater.applyDetailed(item)).event);
    }

    // The public v1 deliberately uses global preferences. Contextual retrieval
    // remains available only as an explicit research condition for v2 work.
    const retrieval = await this.retriever.evaluate(classification, condition);
    const ranked = this.ranker.rank(retrieval.selected);
    const selectedIds = new Set(ranked.map(({ preference }) => preference.id));
    const budgetDecisions: UsageDecision[] = retrieval.selected
      .filter(({ preference }) => !selectedIds.has(preference.id))
      .map((candidate) => ({
        preferenceId: candidate.preference.id,
        dimension: candidate.preference.dimension,
        value: candidate.preference.value,
        scope: candidate.preference.scope,
        confidence: candidate.preference.confidence,
        status: 'suppressed_budget',
        reason: 'Excluded by the compact eight-preference prompt budget.',
        scopeMatch: candidate.scopeMatch,
        semanticRelevance: candidate.semanticRelevance,
        evidenceConfidence: candidate.evidenceConfidence,
        applicability: candidate.applicability,
        evidenceCount: candidate.preference.evidenceCount,
        lastObservedAt: candidate.preference.lastObservedAt,
        sourceType: candidate.preference.sourceType,
        state: candidate.preference.state,
        lifetime: candidate.preference.locked || candidate.preference.state === 'locked'
          ? 'locked'
          : candidate.preference.lifetime ?? 'durable',
      }));
    const base = this.compiler.compile(input.prompt, classification, ranked);
    const compiled: CompiledContext = {
      ...base,
      decisions: [...retrieval.decisions, ...budgetDecisions, ...base.decisions],
      updates,
    };
    const log: UsageLog = {
      id: identifier(),
      timestamp: new Date().toISOString(),
      provider: input.provider,
      classification,
      decisions: compiled.decisions,
      updates,
      experimentCondition: condition,
      estimatedTokens: compiled.estimatedTokens,
      ...(settings.experimentalMode && settings.recordRawPrompts
        ? { rawPrompt: input.prompt, compiledInstruction: compiled.instruction }
        : {}),
    };
    await this.store.addUsageLog(log);
    return compiled;
  }
}
