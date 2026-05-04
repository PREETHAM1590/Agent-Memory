import { Observation, ObservedPattern } from '../types/index.js';
import { MemoryDatabase } from '../database/index.js';

export class PatternExtractor {
  private db: MemoryDatabase;

  constructor(db: MemoryDatabase) {
    this.db = db;
  }

  extractPatterns(observations: Observation[]): ObservedPattern[] {
    const patterns: Map<string, { pattern: string; count: number; examples: string[] }> = new Map();

    for (const obs of observations) {
      const extracted = this.extractFromObservation(obs);

      for (const pattern of extracted) {
        const existing = patterns.get(pattern);
        if (existing) {
          existing.count++;
          if (existing.examples.length < 5) {
            existing.examples.push(`#${obs.id}: ${obs.title}`);
          }
        } else {
          patterns.set(pattern, {
            pattern,
            count: 1,
            examples: [`#${obs.id}: ${obs.title}`]
          });
        }
      }
    }

    const results: ObservedPattern[] = [];

    for (const [patternKey, data] of patterns) {
      if (data.count >= 2) {
        const id = this.db.storePattern({
          type: this.detectPatternType(patternKey),
          pattern: patternKey,
          confidence: Math.min(data.count / 10, 1),
          occurrences: data.count,
          examples: data.examples
        });

        results.push({
          id,
          type: this.detectPatternType(patternKey),
          pattern: patternKey,
          confidence: Math.min(data.count / 10, 1),
          occurrences: data.count,
          firstSeen: new Date(),
          lastSeen: new Date(),
          examples: data.examples
        });
      }
    }

    return results;
  }

  private extractFromObservation(obs: Observation): string[] {
    const patterns: string[] = [];

    const decisionIndicators = ['decided', 'chose', 'selected', 'using', 'implementation'];
    if (decisionIndicators.some(ind => obs.title.toLowerCase().includes(ind))) {
      patterns.push(`decision-pattern:${obs.type}`);
    }

    const techPatterns = this.extractTechPatterns(obs.content);
    patterns.push(...techPatterns);

    const filePatterns = this.extractFilePatterns(obs.filesRead, obs.filesModified);
    patterns.push(...filePatterns);

    return patterns;
  }

  private extractTechPatterns(content: string): string[] {
    const patterns: string[] = [];

    const techKeywords = [
      'typescript', 'javascript', 'python', 'rust', 'go', 'java',
      'react', 'vue', 'angular', 'svelte', 'nextjs', 'sveltekit',
      'node', 'deno', 'bun',
      'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite',
      'docker', 'kubernetes', 'aws', 'gcp', 'azure',
      'graphql', 'rest', 'api',
      'jest', 'vitest', 'cypress', 'playwright'
    ];

    const lowerContent = content.toLowerCase();
    for (const tech of techKeywords) {
      if (lowerContent.includes(tech)) {
        patterns.push(`tech:${tech}`);
      }
    }

    return patterns;
  }

  private extractFilePatterns(filesRead: string[], filesModified: string[]): string[] {
    const patterns: string[] = [];

    const allFiles = [...filesRead, ...filesModified];

    const dirCounts: Map<string, number> = new Map();
    for (const file of allFiles) {
      const parts = file.split('/');
      if (parts.length > 1) {
        const dir = parts[0];
        dirCounts.set(dir, (dirCounts.get(dir) || 0) + 1);
      }
    }

    for (const [dir, count] of dirCounts) {
      if (count >= 2) {
        patterns.push(`directory:${dir}`);
      }
    }

    return patterns;
  }

  private detectPatternType(pattern: string): 'code' | 'decision' | 'workflow' {
    if (pattern.startsWith('decision-')) return 'decision';
    if (pattern.startsWith('directory:')) return 'workflow';
    return 'code';
  }

  suggestWorkflow(observations: Observation[]): string[] {
    const patterns = this.db.getPatterns(50);
    const suggestions: string[] = [];

    const decisionPatterns = patterns.filter(p => p.type === 'decision' && p.confidence > 0.5);
    for (const p of decisionPatterns) {
      suggestions.push(`Consider reviewing: ${p.pattern}`);
    }

    const techPatterns = patterns.filter(p => p.type === 'code' && p.confidence > 0.7);
    const techStack = techPatterns.map(p => p.pattern.replace('tech:', ''));
    if (techStack.length > 0) {
      suggestions.push(`Detected tech stack: ${techStack.join(', ')}`);
    }

    return suggestions;
  }
}
