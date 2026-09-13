import type { ClassifiedContext, Domain, Task } from './types';

interface DomainRule {
  domain: Domain;
  subdomain?: string;
  terms: readonly string[];
}

const DOMAIN_RULES: readonly DomainRule[] = [
  { domain: 'software_engineering', subdomain: 'java', terms: ['java', 'spring boot', 'jvm', 'maven', 'gradle'] },
  { domain: 'software_engineering', subdomain: 'python', terms: ['python', 'django', 'fastapi', 'pytest'] },
  { domain: 'software_engineering', subdomain: 'frontend', terms: ['react', 'typescript', 'css', 'frontend', 'browser extension'] },
  { domain: 'software_engineering', subdomain: 'databases', terms: ['sql', 'database', 'postgres', 'mysql', 'index query'] },
  { domain: 'software_engineering', subdomain: 'distributed_systems', terms: ['kafka', 'consensus', 'distributed system', 'consumer group', 'raft'] },
  { domain: 'machine_learning', subdomain: 'nlp', terms: ['language model', 'llm', 'nlp', 'transformer', 'tokenization'] },
  { domain: 'machine_learning', subdomain: 'computer_vision', terms: ['computer vision', 'image classification', 'object detection'] },
  { domain: 'machine_learning', subdomain: 'deep_learning', terms: ['neural network', 'deep learning', 'backpropagation'] },
  { domain: 'science', subdomain: 'physics', terms: ['physics', 'quantum', 'relativity', 'force', 'momentum', 'thermodynamics'] },
  { domain: 'science', subdomain: 'biology', terms: ['biology', 'cell', 'genetics', 'evolution', 'protein'] },
  { domain: 'science', subdomain: 'chemistry', terms: ['chemistry', 'molecule', 'reaction', 'periodic table'] },
  { domain: 'finance', terms: ['finance', 'stock', 'bond', 'portfolio', 'interest rate', 'accounting'] },
  { domain: 'legal', terms: ['legal', 'law', 'contract', 'statute', 'litigation'] },
  { domain: 'health', terms: ['health', 'medical', 'medicine', 'symptom', 'diagnosis', 'treatment'] },
  { domain: 'education', terms: ['lesson plan', 'curriculum', 'teach', 'student', 'pedagogy'] },
  { domain: 'professional_writing', terms: ['business email', 'cover letter', 'resume', 'memo', 'professional writing'] },
  { domain: 'creative_writing', terms: ['poem', 'short story', 'creative writing', 'screenplay', 'fiction'] },
];

const TASK_RULES: readonly { task: Task; terms: readonly string[] }[] = [
  { task: 'debugging', terms: ['debug', 'fix this', 'error', 'stack trace', 'not working'] },
  { task: 'implementation', terms: ['implement', 'write code', 'build', 'code for', 'function'] },
  { task: 'comparison', terms: ['compare', 'versus', ' vs ', 'difference between'] },
  { task: 'summarization', terms: ['summarize', 'summary', 'tl;dr'] },
  { task: 'writing', terms: ['rewrite', 'draft', 'write an email', 'edit this'] },
  { task: 'calculation', terms: ['calculate', 'solve', 'equation', 'compute'] },
  { task: 'explanation', terms: ['explain', 'why', 'how does', 'what is', 'teach me'] },
];

function countMatches(text: string, terms: readonly string[]): number {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
}

export class DomainClassifier {
  classify(prompt: string): ClassifiedContext {
    const normalized = ` ${prompt.toLowerCase()} `;
    const scored = DOMAIN_RULES.map((rule) => ({ rule, score: countMatches(normalized, rule.terms) }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score);

    const best = scored[0];
    const task = TASK_RULES.find((rule) => countMatches(normalized, rule.terms) > 0)?.task ?? 'general';

    if (!best) {
      return { domain: 'general', task, confidence: 0.35 };
    }

    return {
      domain: best.rule.domain,
      subdomain: best.rule.subdomain,
      task,
      confidence: Math.min(0.95, 0.62 + best.score * 0.11),
    };
  }
}
