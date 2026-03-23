import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityScore } from './entities/quality-score.entity';
import { ContentItem } from '../content/entities/content-item.entity';

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(QualityScore)
    private readonly scoreRepo: Repository<QualityScore>,
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
  ) {}

  async scoreContent(orgId: string, contentItemId: string) {
    const item = await this.contentRepo.findOne({
      where: { id: contentItemId, organizationId: orgId },
      relations: ['relatedLinks', 'steps'],
    });
    if (!item) throw new NotFoundException('Content item not found');

    const text = this.extractText(item.body);
    const issues: { type: string; severity: string; message: string; field?: string }[] = [];

    // Readability metrics
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = Math.max(sentences.length, 1);
    const avgSentenceLength = wordCount / sentenceCount;
    const syllableCount = words.reduce((sum, w) => sum + this.countSyllables(w), 0);

    // Flesch-Kincaid Grade Level
    const fleschKincaidGrade =
      0.39 * (wordCount / sentenceCount) +
      11.8 * (syllableCount / Math.max(wordCount, 1)) -
      15.59;

    // Readability score (0-100, higher is better)
    const readingEase =
      206.835 -
      1.015 * (wordCount / sentenceCount) -
      84.6 * (syllableCount / Math.max(wordCount, 1));
    const readabilityScore = Math.max(0, Math.min(100, readingEase));

    // Structure checks (DITA best practices)
    let structureScore = 100;

    if (!item.shortDescription || item.shortDescription.trim().length === 0) {
      issues.push({
        type: 'structure',
        severity: 'warning',
        message: 'Missing short description',
        field: 'shortDescription',
      });
      structureScore -= 20;
    }

    if (wordCount < 50) {
      issues.push({
        type: 'structure',
        severity: 'info',
        message: 'Content is very short (< 50 words)',
        field: 'body',
      });
      structureScore -= 10;
    }

    if (avgSentenceLength > 25) {
      issues.push({
        type: 'readability',
        severity: 'warning',
        message: `Average sentence length is high (${avgSentenceLength.toFixed(1)} words)`,
      });
    }

    const prolog = item.prolog || {};
    if (!prolog['author']) {
      issues.push({
        type: 'structure',
        severity: 'info',
        message: 'Missing prolog author',
        field: 'prolog.author',
      });
      structureScore -= 5;
    }
    if (!prolog['audience']) {
      issues.push({
        type: 'structure',
        severity: 'info',
        message: 'Missing prolog audience',
        field: 'prolog.audience',
      });
      structureScore -= 5;
    }

    // Completeness for task types
    let completenessScore = 100;
    if ((item.type === 'task' || item.type === 'troubleshooting') && (!item.steps || item.steps.length === 0)) {
      issues.push({
        type: 'completeness',
        severity: 'error',
        message: 'Task/troubleshooting content has no steps',
        field: 'steps',
      });
      completenessScore -= 30;
    }

    // Broken link detection
    let brokenLinks = 0;
    if (item.relatedLinks) {
      for (const link of item.relatedLinks) {
        const target = await this.contentRepo.findOne({
          where: { id: link.targetItemId, organizationId: orgId },
        });
        if (!target) {
          brokenLinks++;
          issues.push({
            type: 'link',
            severity: 'error',
            message: `Broken link to ${link.targetItemId}`,
            field: 'relatedLinks',
          });
        }
      }
    }
    if (brokenLinks > 0) {
      completenessScore -= brokenLinks * 10;
    }

    structureScore = Math.max(0, structureScore);
    completenessScore = Math.max(0, completenessScore);

    const overallScore = Math.round(
      readabilityScore * 0.3 +
        structureScore * 0.35 +
        completenessScore * 0.35,
    );

    // Delete previous score, save new one
    await this.scoreRepo.delete({ contentItemId, organizationId: orgId });

    const score = this.scoreRepo.create({
      organizationId: orgId,
      contentItemId,
      overallScore,
      readabilityScore: Math.round(readabilityScore * 100) / 100,
      fleschKincaidGrade: Math.round(fleschKincaidGrade * 100) / 100,
      wordCount,
      avgSentenceLength: Math.round(avgSentenceLength * 100) / 100,
      structureScore,
      completenessScore,
      brokenLinks,
      issues,
    });

    return this.scoreRepo.save(score);
  }

  async getScore(orgId: string, contentItemId: string) {
    const score = await this.scoreRepo.findOne({
      where: { contentItemId, organizationId: orgId },
    });
    if (!score) throw new NotFoundException('No quality score found. Run scoring first.');
    return score;
  }

  async getOrgScores(orgId: string) {
    return this.scoreRepo.find({
      where: { organizationId: orgId },
      order: { overallScore: 'ASC' },
    });
  }

  async getOrgQualityStats(orgId: string) {
    const scores = await this.scoreRepo.find({
      where: { organizationId: orgId },
    });

    if (scores.length === 0) {
      return { totalScored: 0, avgScore: 0, avgReadability: 0, totalBrokenLinks: 0, totalIssues: 0 };
    }

    const avgScore = scores.reduce((s, q) => s + q.overallScore, 0) / scores.length;
    const avgReadability = scores.reduce((s, q) => s + q.readabilityScore, 0) / scores.length;
    const totalBrokenLinks = scores.reduce((s, q) => s + q.brokenLinks, 0);
    const totalIssues = scores.reduce((s, q) => s + q.issues.length, 0);

    return {
      totalScored: scores.length,
      avgScore: Math.round(avgScore),
      avgReadability: Math.round(avgReadability),
      totalBrokenLinks,
      totalIssues,
    };
  }

  async scoreAllContent(orgId: string) {
    const items = await this.contentRepo.find({
      where: { organizationId: orgId },
      select: ['id'],
    });

    const results: { contentItemId: string; overallScore: number }[] = [];
    for (const item of items) {
      const score = await this.scoreContent(orgId, item.id);
      results.push({ contentItemId: item.id, overallScore: score.overallScore });
    }
    return { scored: results.length, results };
  }

  private extractText(body: Record<string, unknown>): string {
    if (!body) return '';
    const jsonStr = JSON.stringify(body);
    // Strip JSON structure, extract text nodes
    return jsonStr
      .replace(/"[^"]*?":/g, ' ')
      .replace(/[{}\[\]",]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private countSyllables(word: string): number {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (w.length <= 3) return 1;
    const vowels = w.match(/[aeiouy]+/g);
    let count = vowels ? vowels.length : 1;
    if (w.endsWith('e')) count--;
    if (w.endsWith('le') && w.length > 3) count++;
    return Math.max(count, 1);
  }
}
