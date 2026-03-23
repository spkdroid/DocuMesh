import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ContentEmbedding } from './entities/content-embedding.entity';
import { TranslationMemory } from './entities/translation-memory.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import {
  AiCompletionDto,
  AiAction,
  CreateTranslationMemoryDto,
  TranslationLookupDto,
} from './dto/ai.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiEndpoint: string;
  private readonly aiApiKey: string;
  private readonly aiModel: string;
  private readonly embeddingModel: string;

  constructor(
    @InjectRepository(ContentEmbedding)
    private readonly embeddingRepo: Repository<ContentEmbedding>,
    @InjectRepository(TranslationMemory)
    private readonly tmRepo: Repository<TranslationMemory>,
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
    private readonly config: ConfigService,
  ) {
    this.aiEndpoint = this.config.get<string>('AI_ENDPOINT', 'https://api.openai.com/v1');
    this.aiApiKey = this.config.get<string>('AI_API_KEY', '');
    this.aiModel = this.config.get<string>('AI_MODEL', 'gpt-4o-mini');
    this.embeddingModel = this.config.get<string>('AI_EMBEDDING_MODEL', 'text-embedding-3-small');
  }

  // === AI Completion ===

  async complete(orgId: string, dto: AiCompletionDto) {
    const systemPrompts: Record<AiAction, string> = {
      [AiAction.COMPLETE]:
        'You are a technical writer. Complete the text naturally, maintaining the same tone and style. Return only the completed text.',
      [AiAction.REWRITE]:
        `You are a technical writer. Rewrite the following text for ${dto.audience || 'a general'} audience. Make it clear and concise. Return only the rewritten text.`,
      [AiAction.SUMMARIZE]:
        'You are a technical writer. Summarize the text in 1-2 sentences. Return only the summary.',
      [AiAction.GENERATE_SHORTDESC]:
        'You are a technical writer. Generate a short description (1-2 sentences) for this content. Return only the description.',
      [AiAction.GENERATE_PROLOG]:
        'You are a technical writer. Generate JSON prolog metadata with fields: author, audience, category, keywords (array). Return valid JSON only.',
    };

    const response = await this.callChatApi(
      systemPrompts[dto.action],
      dto.text,
    );

    return { action: dto.action, result: response };
  }

  // === Embedding & Semantic Search ===

  async embedContent(orgId: string, contentItemId: string) {
    const item = await this.contentRepo.findOne({
      where: { id: contentItemId, organizationId: orgId },
    });
    if (!item) throw new NotFoundException('Content item not found');

    const text = `${item.title}\n${item.shortDescription}\n${this.extractText(item.body)}`;
    const embedding = await this.getEmbedding(text);

    await this.embeddingRepo.delete({ contentItemId, organizationId: orgId });

    const record = this.embeddingRepo.create({
      organizationId: orgId,
      contentItemId,
      title: item.title,
      textContent: text.substring(0, 5000),
      embedding,
      modelName: this.embeddingModel,
    });
    return this.embeddingRepo.save(record);
  }

  async embedAllContent(orgId: string) {
    const items = await this.contentRepo.find({
      where: { organizationId: orgId },
      select: ['id'],
    });

    let embedded = 0;
    for (const item of items) {
      try {
        await this.embedContent(orgId, item.id);
        embedded++;
      } catch (e) {
        this.logger.warn(`Failed to embed ${item.id}: ${e}`);
      }
    }
    return { total: items.length, embedded };
  }

  async semanticSearch(orgId: string, query: string, limit = 10) {
    const queryEmbedding = await this.getEmbedding(query);

    const allEmbeddings = await this.embeddingRepo.find({
      where: { organizationId: orgId },
    });

    // Compute cosine similarity
    const results = allEmbeddings
      .map((e) => ({
        contentItemId: e.contentItemId,
        title: e.title,
        score: this.cosineSimilarity(queryEmbedding, e.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  async findSimilar(orgId: string, contentItemId: string, limit = 5) {
    const source = await this.embeddingRepo.findOne({
      where: { contentItemId, organizationId: orgId },
    });
    if (!source) {
      throw new NotFoundException('Content not embedded. Run embedding first.');
    }

    const allEmbeddings = await this.embeddingRepo.find({
      where: { organizationId: orgId },
    });

    return allEmbeddings
      .filter((e) => e.contentItemId !== contentItemId)
      .map((e) => ({
        contentItemId: e.contentItemId,
        title: e.title,
        score: this.cosineSimilarity(source.embedding, e.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // === Auto-Tagging ===

  async autoTag(orgId: string, contentItemId: string) {
    const item = await this.contentRepo.findOne({
      where: { id: contentItemId, organizationId: orgId },
    });
    if (!item) throw new NotFoundException('Content item not found');

    const text = `${item.title}\n${item.shortDescription}\n${this.extractText(item.body)}`;

    const response = await this.callChatApi(
      'You are a content classifier. Analyze the text and suggest taxonomy tags. Return a JSON array of objects: [{tag: string, confidence: number}]. Confidence is 0-100. Return only valid JSON array.',
      text,
    );

    try {
      const tags = JSON.parse(response);
      return { contentItemId, suggestedTags: tags };
    } catch {
      return { contentItemId, suggestedTags: [], raw: response };
    }
  }

  // === Translation Memory ===

  async addTranslationMemory(orgId: string, userId: string, dto: CreateTranslationMemoryDto) {
    const tm = this.tmRepo.create({
      organizationId: orgId,
      sourceLocale: dto.sourceLocale,
      targetLocale: dto.targetLocale,
      sourceText: dto.sourceText,
      targetText: dto.targetText,
      contentItemId: dto.contentItemId || null,
      matchScore: 100,
      createdBy: userId,
    });
    return this.tmRepo.save(tm);
  }

  async lookupTranslation(orgId: string, dto: TranslationLookupDto) {
    const minScore = dto.minScore || 70;

    // Exact match first
    const exact = await this.tmRepo.findOne({
      where: {
        organizationId: orgId,
        sourceLocale: dto.sourceLocale,
        targetLocale: dto.targetLocale,
        sourceText: dto.sourceText,
      },
    });
    if (exact) {
      return [{ ...exact, matchScore: 100 }];
    }

    // Fuzzy match via trigram-like search
    const all = await this.tmRepo.find({
      where: {
        organizationId: orgId,
        sourceLocale: dto.sourceLocale,
        targetLocale: dto.targetLocale,
      },
    });

    return all
      .map((tm) => ({
        ...tm,
        matchScore: this.fuzzyScore(dto.sourceText, tm.sourceText),
      }))
      .filter((tm) => tm.matchScore >= minScore)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  async getTranslationMemories(orgId: string, sourceLocale?: string, targetLocale?: string) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (sourceLocale) where.sourceLocale = sourceLocale;
    if (targetLocale) where.targetLocale = targetLocale;
    return this.tmRepo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
  }

  async deleteTranslationMemory(orgId: string, id: string) {
    const tm = await this.tmRepo.findOne({ where: { id, organizationId: orgId } });
    if (!tm) throw new NotFoundException('Translation memory entry not found');
    await this.tmRepo.remove(tm);
    return { deleted: true };
  }

  // === Private helpers ===

  private async callChatApi(systemPrompt: string, userMessage: string): Promise<string> {
    if (!this.aiApiKey) {
      return '[AI not configured — set AI_API_KEY environment variable]';
    }

    try {
      const response = await fetch(`${this.aiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.aiApiKey}`,
        },
        body: JSON.stringify({
          model: this.aiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      this.logger.error(`AI API call failed: ${err}`);
      return '[AI request failed]';
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    if (!this.aiApiKey) {
      // Return a zero-vector placeholder if no API key configured
      return new Array(1536).fill(0);
    }

    try {
      const response = await fetch(`${this.aiEndpoint}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.aiApiKey}`,
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text.substring(0, 8000),
        }),
      });

      const data = (await response.json()) as {
        data?: { embedding?: number[] }[];
      };
      return data.data?.[0]?.embedding || new Array(1536).fill(0);
    } catch (err) {
      this.logger.error(`Embedding API call failed: ${err}`);
      return new Array(1536).fill(0);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : Math.round((dotProduct / denom) * 10000) / 10000;
  }

  private fuzzyScore(a: string, b: string): number {
    const aNorm = a.toLowerCase().trim();
    const bNorm = b.toLowerCase().trim();
    if (aNorm === bNorm) return 100;

    const aWords = new Set(aNorm.split(/\s+/));
    const bWords = new Set(bNorm.split(/\s+/));
    const intersection = [...aWords].filter((w) => bWords.has(w)).length;
    const union = new Set([...aWords, ...bWords]).size;
    return Math.round((intersection / union) * 100);
  }

  private extractText(body: Record<string, unknown>): string {
    if (!body) return '';
    return JSON.stringify(body)
      .replace(/"[^"]*?":/g, ' ')
      .replace(/[{}\[\]",]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
