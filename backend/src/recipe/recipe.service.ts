import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DataStore, Recipe, RecipeVersion, VersionStatus } from '../common/data.store';
import {
  CreateRecipeDto,
  CreateRecipeVersionDto,
  UpdateRecipeVersionDto,
  UpdateRecipeNameDto,
  RecommendRecipeDto,
  GenerateOptimizationDto,
} from './dto/recipe.dto';

export interface RecipeWithDetail extends Recipe {
  currentVersion?: RecipeVersion;
  versionCount: number;
  recentComplianceRate?: number;
}

export interface VersionWithStats extends RecipeVersion {
  complianceRate?: number;
  totalFeedbacks?: number;
  avgBurnTime?: number;
}

@Injectable()
export class RecipeService {
  constructor(private readonly dataStore: DataStore) {}

  private computeNextVersion(recipeId: string): string {
    const versions = this.dataStore.recipeVersions
      .filter((v) => v.recipeId === recipeId)
      .map((v) => v.version);
    let maxMajor = 0;
    let maxMinor = 0;
    versions.forEach((v) => {
      const match = v.match(/^v(\d+)\.(\d+)$/);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        if (major > maxMajor || (major === maxMajor && minor > maxMinor)) {
          maxMajor = major;
          maxMinor = minor;
        }
      }
    });
    return `v${maxMajor}.${maxMinor + 1}`;
  }

  private computeVersionCompliance(versionId: string): { rate: number; count: number; avgBurn: number } {
    const feedbacks = this.dataStore.feedbacks.filter((f) => f.recipeVersionId === versionId);
    if (feedbacks.length === 0) {
      return { rate: 0, count: 0, avgBurn: 0 };
    }
    const threshold = 0.85;
    const compliant = feedbacks.filter((f) => f.actualBurnTime / f.expectedBurnTime >= threshold).length;
    const avgBurn = feedbacks.reduce((sum, f) => sum + f.actualBurnTime, 0) / feedbacks.length;
    return {
      rate: Math.round((compliant / feedbacks.length) * 100),
      count: feedbacks.length,
      avgBurn: Math.round(avgBurn * 10) / 10,
    };
  }

  private enrichVersionWithStats(v: RecipeVersion): VersionWithStats {
    const stats = this.computeVersionCompliance(v.id);
    return {
      ...v,
      complianceRate: stats.rate,
      totalFeedbacks: stats.count,
      avgBurnTime: stats.avgBurn,
    };
  }

  private enrichRecipeWithDetail(r: Recipe): RecipeWithDetail {
    const versions = this.dataStore.recipeVersions.filter((v) => v.recipeId === r.id);
    const currentVersion = versions.find((v) => v.id === r.currentVersionId) || versions.find((v) => v.status === 'published') || versions[0];
    const publishedVersions = versions.filter((v) => v.status === 'published');
    let recentComplianceRate: number | undefined;
    if (publishedVersions.length > 0) {
      const stats = this.computeVersionCompliance(publishedVersions[publishedVersions.length - 1].id);
      if (stats.count > 0) recentComplianceRate = stats.rate;
    }
    return {
      ...r,
      currentVersion: currentVersion,
      versionCount: versions.length,
      recentComplianceRate,
    };
  }

  findAll(): RecipeWithDetail[] {
    return this.dataStore.recipes
      .map((r) => this.enrichRecipeWithDetail(r))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  findAllPublishedVersions(): VersionWithStats[] {
    return this.dataStore.recipeVersions
      .filter((v) => v.status === 'published')
      .map((v) => this.enrichVersionWithStats(v));
  }

  findOne(id: string): RecipeWithDetail {
    const recipe = this.dataStore.recipes.find((r) => r.id === id);
    if (!recipe) {
      throw new NotFoundException(`配方 ${id} 不存在`);
    }
    return this.enrichRecipeWithDetail(recipe);
  }

  findVersions(recipeId: string): VersionWithStats[] {
    const recipe = this.dataStore.recipes.find((r) => r.id === recipeId);
    if (!recipe) {
      throw new NotFoundException(`配方 ${recipeId} 不存在`);
    }
    return this.dataStore.recipeVersions
      .filter((v) => v.recipeId === recipeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((v) => this.enrichVersionWithStats(v));
  }

  findVersion(versionId: string): VersionWithStats {
    const v = this.dataStore.recipeVersions.find((x) => x.id === versionId);
    if (!v) {
      throw new NotFoundException(`配方版本 ${versionId} 不存在`);
    }
    return this.enrichVersionWithStats(v);
  }

  compareVersions(versionId1: string, versionId2: string) {
    const v1 = this.dataStore.recipeVersions.find((x) => x.id === versionId1);
    const v2 = this.dataStore.recipeVersions.find((x) => x.id === versionId2);
    if (!v1) throw new NotFoundException(`配方版本 ${versionId1} 不存在`);
    if (!v2) throw new NotFoundException(`配方版本 ${versionId2} 不存在`);
    if (v1.recipeId !== v2.recipeId) throw new BadRequestException('只能对比同一配方的不同版本');

    const fieldDiff: Record<string, { v1: any; v2: any; changed: boolean }> = {};
    const fieldsToCompare: (keyof RecipeVersion)[] = [
      'version',
      'status',
      'waxBase',
      'burnTimeEstimate',
      'description',
      'changeLog',
      'scenarios',
      'seasons',
    ];
    fieldsToCompare.forEach((f) => {
      const a = (v1 as any)[f];
      const b = (v2 as any)[f];
      fieldDiff[f as string] = {
        v1: a,
        v2: b,
        changed: JSON.stringify(a) !== JSON.stringify(b),
      };
    });

    const oilsDiff = this.diffOils(v1.essentialOils, v2.essentialOils);
    const layersDiff = this.diffLayers(v1.scentLayers, v2.scentLayers);

    return {
      version1: this.enrichVersionWithStats(v1),
      version2: this.enrichVersionWithStats(v2),
      fieldDiff,
      essentialOilsDiff: oilsDiff,
      scentLayersDiff: layersDiff,
    };
  }

  private diffOils(
    a: { name: string; percentage: number }[],
    b: { name: string; percentage: number }[],
  ) {
    const names = Array.from(new Set([...a.map((o) => o.name), ...b.map((o) => o.name)]));
    return names.map((name) => {
      const oa = a.find((x) => x.name === name);
      const ob = b.find((x) => x.name === name);
      return {
        name,
        v1: oa?.percentage ?? null,
        v2: ob?.percentage ?? null,
        changed: (oa?.percentage ?? 0) !== (ob?.percentage ?? 0),
        added: !oa && !!ob,
        removed: !!oa && !ob,
      };
    });
  }

  private diffLayers(
    a: { layer: string; note: string; description: string }[],
    b: { layer: string; note: string; description: string }[],
  ) {
    const keys = Array.from(new Set([...a.map((l) => l.layer), ...b.map((l) => l.layer)]));
    return keys.map((key) => {
      const la = a.find((x) => x.layer === key);
      const lb = b.find((x) => x.layer === key);
      return {
        layer: key,
        v1: la ? { note: la.note, description: la.description } : null,
        v2: lb ? { note: lb.note, description: lb.description } : null,
        changed: JSON.stringify(la) !== JSON.stringify(lb),
      };
    });
  }

  create(dto: CreateRecipeDto): RecipeWithDetail {
    const recipe: Recipe = {
      id: uuidv4(),
      name: dto.name,
      optimizationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.recipes.push(recipe);

    const initialVersion: RecipeVersion = {
      id: uuidv4(),
      recipeId: recipe.id,
      version: 'v1.0',
      status: 'published',
      waxBase: dto.waxBase,
      essentialOils: dto.essentialOils,
      scentLayers: dto.scentLayers,
      burnTimeEstimate: dto.burnTimeEstimate,
      scenarios: dto.scenarios,
      seasons: dto.seasons,
      description: dto.description || '',
      changeLog: dto.changeLog || '初始版本',
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.recipeVersions.push(initialVersion);
    recipe.currentVersionId = initialVersion.id;

    return this.enrichRecipeWithDetail(recipe);
  }

  createVersion(dto: CreateRecipeVersionDto): VersionWithStats {
    const recipe = this.dataStore.recipes.find((r) => r.id === dto.recipeId);
    if (!recipe) {
      throw new NotFoundException(`配方 ${dto.recipeId} 不存在`);
    }
    const version = this.computeNextVersion(dto.recipeId);
    const status: VersionStatus = dto.status || 'pending_review';
    const newVersion: RecipeVersion = {
      id: uuidv4(),
      recipeId: dto.recipeId,
      version,
      status,
      waxBase: dto.waxBase,
      essentialOils: dto.essentialOils,
      scentLayers: dto.scentLayers,
      burnTimeEstimate: dto.burnTimeEstimate,
      scenarios: dto.scenarios,
      seasons: dto.seasons,
      description: dto.description || '',
      changeLog: dto.changeLog,
      baseVersionId: dto.baseVersionId,
      sourceFeedbackId: dto.sourceFeedbackId,
      publishedAt: status === 'published' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.recipeVersions.push(newVersion);

    if (status === 'published') {
      recipe.currentVersionId = newVersion.id;
      recipe.optimizationCount += 1;
    }
    recipe.updatedAt = new Date().toISOString();

    return this.enrichVersionWithStats(newVersion);
  }

  updateVersion(versionId: string, dto: UpdateRecipeVersionDto): VersionWithStats {
    const idx = this.dataStore.recipeVersions.findIndex((v) => v.id === versionId);
    if (idx === -1) {
      throw new NotFoundException(`配方版本 ${versionId} 不存在`);
    }
    const existing = this.dataStore.recipeVersions[idx];
    const updated: RecipeVersion = {
      ...existing,
      ...dto,
      updatedAt: new Date().toISOString(),
      publishedAt: dto.status === 'published' && !existing.publishedAt ? new Date().toISOString() : existing.publishedAt,
    };
    this.dataStore.recipeVersions[idx] = updated;

    if (dto.status === 'published') {
      const recipe = this.dataStore.recipes.find((r) => r.id === existing.recipeId);
      if (recipe) {
        recipe.currentVersionId = updated.id;
        recipe.optimizationCount += 1;
        recipe.updatedAt = new Date().toISOString();
      }
    }

    return this.enrichVersionWithStats(updated);
  }

  updateRecipeName(recipeId: string, dto: UpdateRecipeNameDto): RecipeWithDetail {
    const idx = this.dataStore.recipes.findIndex((r) => r.id === recipeId);
    if (idx === -1) {
      throw new NotFoundException(`配方 ${recipeId} 不存在`);
    }
    this.dataStore.recipes[idx].name = dto.name;
    this.dataStore.recipes[idx].updatedAt = new Date().toISOString();
    return this.enrichRecipeWithDetail(this.dataStore.recipes[idx]);
  }

  reviewVersion(versionId: string, action: 'publish' | 'reject', reviewNote?: string): VersionWithStats {
    const idx = this.dataStore.recipeVersions.findIndex((v) => v.id === versionId);
    if (idx === -1) {
      throw new NotFoundException(`配方版本 ${versionId} 不存在`);
    }
    const existing = this.dataStore.recipeVersions[idx];
    let newStatus: VersionStatus;
    if (action === 'publish') {
      newStatus = 'published';
      const recipe = this.dataStore.recipes.find((r) => r.id === existing.recipeId);
      if (recipe) {
        recipe.currentVersionId = existing.id;
        recipe.optimizationCount += 1;
        recipe.updatedAt = new Date().toISOString();
      }
    } else {
      newStatus = 'archived';
    }
    const changeLogAddition = reviewNote ? `\n审核备注：${reviewNote}` : '';
    const updated: RecipeVersion = {
      ...existing,
      status: newStatus,
      publishedAt: newStatus === 'published' ? new Date().toISOString() : existing.publishedAt,
      changeLog: existing.changeLog + changeLogAddition,
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.recipeVersions[idx] = updated;
    return this.enrichVersionWithStats(updated);
  }

  remove(id: string): void {
    const idx = this.dataStore.recipes.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new NotFoundException(`配方 ${id} 不存在`);
    }
    this.dataStore.recipes.splice(idx, 1);
    this.dataStore.recipeVersions = this.dataStore.recipeVersions.filter((v) => v.recipeId !== id);
  }

  generateOptimizationFromFeedback(dto: GenerateOptimizationDto): VersionWithStats {
    const feedback = this.dataStore.feedbacks.find((f) => f.id === dto.feedbackId);
    if (!feedback) {
      throw new NotFoundException(`反馈 ${dto.feedbackId} 不存在`);
    }
    let baseVersion: RecipeVersion | undefined;
    if (feedback.recipeVersionId) {
      baseVersion = this.dataStore.recipeVersions.find((v) => v.id === feedback.recipeVersionId);
    }
    if (!baseVersion) {
      baseVersion = this.dataStore.recipeVersions
        .filter((v) => v.recipeId === feedback.recipeId && v.status === 'published')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }
    if (!baseVersion) {
      throw new BadRequestException('无法找到可用于优化的基础版本');
    }
    if (feedback.optimizationGenerated) {
      throw new BadRequestException('该反馈已生成优化版本');
    }

    const burnRatio = feedback.actualBurnTime / feedback.expectedBurnTime;
    const adjustedBurnTime = burnRatio < 0.85
      ? Math.round(baseVersion.burnTimeEstimate * (1 + (1 - burnRatio) * 0.3))
      : baseVersion.burnTimeEstimate;

    const adjustedOils = baseVersion.essentialOils.map((oil) => {
      let delta = 0;
      if (feedback.scentStrength < 3) {
        delta = 2;
      } else if (feedback.scentStrength > 4) {
        delta = -2;
      }
      return {
        name: oil.name,
        percentage: Math.max(5, Math.min(80, oil.percentage + delta)),
      };
    });

    const totalPct = adjustedOils.reduce((s, o) => s + o.percentage, 0);
    if (totalPct !== 100) {
      const scale = 100 / totalPct;
      adjustedOils.forEach((o) => {
        o.percentage = Math.round(o.percentage * scale);
      });
      const diff = 100 - adjustedOils.reduce((s, o) => s + o.percentage, 0);
      if (adjustedOils.length > 0) {
        adjustedOils[0].percentage += diff;
      }
    }

    const autoDescriptionParts: string[] = [];
    if (feedback.optimizationSuggestion) {
      autoDescriptionParts.push(`用户建议：${feedback.optimizationSuggestion}`);
    }
    if (burnRatio < 0.85) {
      autoDescriptionParts.push(`燃烧时长达标率 ${Math.round(burnRatio * 100)}%，自动上调预计燃烧时长`);
    }
    if (feedback.scentStrength < 3) {
      autoDescriptionParts.push(`香气强度评分 ${feedback.scentStrength}/5，微调精油比例`);
    }
    const description = dto.description || autoDescriptionParts.join('；') || '基于燃烧反馈自动生成的优化版本';

    const createDto: CreateRecipeVersionDto = {
      recipeId: feedback.recipeId,
      waxBase: baseVersion.waxBase,
      essentialOils: adjustedOils,
      scentLayers: baseVersion.scentLayers,
      burnTimeEstimate: adjustedBurnTime,
      scenarios: baseVersion.scenarios,
      seasons: baseVersion.seasons,
      description: baseVersion.description,
      changeLog: description,
      baseVersionId: baseVersion.id,
      sourceFeedbackId: feedback.id,
      status: 'pending_review',
    };

    feedback.optimizationGenerated = true;
    return this.createVersion(createDto);
  }

  recommend(dto: RecommendRecipeDto) {
    const moodScenarioMap: Record<string, string[]> = {
      放松减压: ['瑜伽冥想', '沐浴放松', '卧室助眠'],
      提升活力: ['工作专注', '家庭聚会'],
      浪漫温馨: ['浪漫约会', '卧室助眠'],
      专注工作: ['工作专注', '书房阅读'],
      助眠安神: ['卧室助眠', '沐浴放松'],
    };

    const publishedVersions = this.dataStore.recipeVersions.filter((v) => v.status === 'published');
    const recipeLatestPublished: Record<string, RecipeVersion> = {};
    publishedVersions.forEach((v) => {
      const existing = recipeLatestPublished[v.recipeId];
      if (!existing || new Date(v.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
        recipeLatestPublished[v.recipeId] = v;
      }
    });

    const results = Object.values(recipeLatestPublished).map((version) => {
      const recipe = this.dataStore.recipes.find((r) => r.id === version.recipeId);
      if (!recipe) return null;

      let score = 0;
      const matchReasons: string[] = [];

      if (dto.mood && moodScenarioMap[dto.mood]) {
        const matchingScenarios = version.scenarios.filter((s) => moodScenarioMap[dto.mood].includes(s));
        if (matchingScenarios.length > 0) {
          score += matchingScenarios.length * 20;
          matchReasons.push(`适用场景匹配：${matchingScenarios.join('、')}`);
        }
      }

      if (dto.season) {
        if (version.seasons.includes(dto.season) || version.seasons.includes('四季皆宜')) {
          score += 15;
          matchReasons.push(`适合${dto.season}使用`);
        }
      }

      if (dto.scentPreferences && dto.scentPreferences.length > 0) {
        const recipeNotes = version.scentLayers.map((l) => l.note);
        const recipeOils = version.essentialOils.map((e) => e.name);
        const allScentTerms = [...new Set([...recipeNotes, ...recipeOils])];
        const matching = dto.scentPreferences.filter((pref) =>
          allScentTerms.some((term) => term.includes(pref) || pref.includes(term)),
        );
        if (matching.length > 0) {
          score += matching.length * 25;
          matchReasons.push(`香调偏好匹配：${matching.join('、')}`);
        }
      }

      if (dto.occasion) {
        score += 5;
        matchReasons.push(`适合${dto.occasion}`);
      }

      const stats = this.computeVersionCompliance(version.id);

      return {
        recipe: {
          id: recipe.id,
          name: recipe.name,
        },
        version: this.enrichVersionWithStats(version),
        score,
        matchReasons,
        complianceRate: stats.count > 0 ? stats.rate : undefined,
      };
    }).filter(Boolean) as any[];

    return results
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }
}
