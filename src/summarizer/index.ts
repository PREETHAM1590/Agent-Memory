import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { Observation } from '../types/index.js';

export type CompressionLevel = 'low' | 'medium' | 'high';
export type Provider = 'openai' | 'anthropic' | 'local';

export interface SummarizationResult {
  summary: string;
  keyPoints: string[];
  topics: string[];
  suggestedTags: string[];
}

export class Summarizer {
  private anthropic?: Anthropic;
  private openai?: OpenAI;
  private provider: Provider;

  constructor(provider: Provider = 'openai', apiKey?: string) {
    this.provider = provider;

    if (provider === 'anthropic') {
      this.anthropic = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
    } else if (provider === 'openai') {
      this.openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    }
  }

  async summarize(observation: Observation, level: CompressionLevel = 'medium'): Promise<SummarizationResult> {
    const maxTokens = { low: 200, medium: 100, high: 50 }[level];

    const prompt = `Analyze the following observation and provide:
1. A concise summary (${maxTokens} tokens max)
2. Key points (3-5 bullet points)
3. Main topics (1-3 words)
4. Suggested tags for categorization

Observation:
Type: ${observation.type}
Title: ${observation.title}
Content: ${observation.content}

Respond in JSON format:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "topics": ["...", "..."],
  "suggestedTags": ["...", "..."]
}`;

    if (this.provider === 'openai' && this.openai) {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    }

    if (this.provider === 'anthropic' && this.anthropic) {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
    }

    return {
      summary: observation.title,
      keyPoints: [observation.content.slice(0, 200)],
      topics: [observation.type],
      suggestedTags: [observation.type]
    };
  }

  async autoTag(content: string): Promise<string[]> {
    const prompt = `Extract 3-5 relevant tags from the following content. Return only a JSON array of lowercase strings.

Content: ${content.slice(0, 1000)}`;

    if (this.provider === 'openai' && this.openai) {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 100
      });

      const result = JSON.parse(response.choices[0].message.content || '{"tags":[]}');
      return result.tags || [];
    }

    return [];
  }

  async detectConflicts(observations: Observation[]): Promise<{ observations: number[]; reason: string }[]> {
    if (observations.length < 2) return [];

    const prompt = `Analyze these observations for conflicts or contradictions. Return a JSON array of conflicts.

Observations:
${observations.map(o => `#${o.id}: ${o.title} - ${o.content.slice(0, 200)}`).join('\n')}

Return format:
[
  { "observations": [1, 2], "reason": "..." }
]`;

    if (this.provider === 'openai' && this.openai) {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || '{"conflicts":[]}');
      return result.conflicts || [];
    }

    return [];
  }
}
