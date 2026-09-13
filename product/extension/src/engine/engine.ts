import { ContextCompiler } from './contextCompiler';
import { DomainClassifier } from './domainClassifier';
import { PreferenceExtractor } from './extractor';
import { PreferenceRanker } from './ranker';
import { PreferenceRetriever } from './retriever';
import type { PreferenceStore } from './store';
import type { ClassifiedContext, CompiledContext, UsageLog } from './types';
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
    let classification = this.classifier.classify(input.prompt);
    if (classification.domain === 'general' && input.contextHint && this.extractor.currentTurnConstraints(input.prompt).size > 0) {
      classification = { ...input.contextHint, confidence: Math.min(input.contextHint.confidence, 0.7) };
    }

    const settings = await this.store.getSettings();
    if (settings.learningEnabled && input.trustedUserAction) {
      const evidence = this.extractor.extract({
        text: input.prompt,
        context: classification,
        origin: 'user_composer',
        isTrustedUserAction: true,
      });
      for (const item of evidence) await this.updater.apply(item);
    }

    const condition = settings.experimentalMode ? settings.experimentCondition : 'domain_conditioned';
    const retrieved = await this.retriever.retrieve(classification, condition);
    const compiled = this.compiler.compile(input.prompt, classification, this.ranker.rank(retrieved));
    const log: UsageLog = {
      id: identifier(),
      timestamp: new Date().toISOString(),
      provider: input.provider,
      classification,
      decisions: compiled.decisions,
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
