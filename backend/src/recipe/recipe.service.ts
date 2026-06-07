import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DataStore, Recipe } from '../common/data.store';
import { CreateRecipeDto, UpdateRecipeDto, RecommendRecipeDto } from './dto/recipe.dto';

@Injectable()
export class RecipeService {
  constructor(private readonly dataStore: DataStore) {}

  findAll(): Recipe[] {
    return this.dataStore.recipes.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  findOne(id: string): Recipe {
    const recipe = this.dataStore.recipes.find((r) => r.id === id);
    if (!recipe) {
      throw new NotFoundException(`配方 ${id} 不存在`);
    }
    return recipe;
  }

  create(dto: CreateRecipeDto): Recipe {
    const recipe: Recipe = {
      id: uuidv4(),
      ...dto,
      description: dto.description || '',
      optimizationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.dataStore.recipes.push(recipe);
    return recipe;
  }

  update(id: string, dto: UpdateRecipeDto): Recipe {
    const idx = this.dataStore.recipes.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new NotFoundException(`配方 ${id} 不存在`);
    }
    const updated = {
      ...this.dataStore.recipes[idx],
      ...dto,
      updatedAt: new Date().toISOString(),
      optimizationCount: this.dataStore.recipes[idx].optimizationCount + 1,
    };
    this.dataStore.recipes[idx] = updated;
    return updated;
  }

  remove(id: string): void {
    const idx = this.dataStore.recipes.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new NotFoundException(`配方 ${id} 不存在`);
    }
    this.dataStore.recipes.splice(idx, 1);
  }

  recommend(dto: RecommendRecipeDto): { recipe: Recipe; score: number; matchReasons: string[] }[] {
    const moodScenarioMap: Record<string, string[]> = {
      放松减压: ['瑜伽冥想', '沐浴放松', '卧室助眠'],
      提升活力: ['工作专注', '家庭聚会'],
      浪漫温馨: ['浪漫约会', '卧室助眠'],
      专注工作: ['工作专注', '书房阅读'],
      助眠安神: ['卧室助眠', '沐浴放松'],
    };

    const results = this.dataStore.recipes.map((recipe) => {
      let score = 0;
      const matchReasons: string[] = [];

      if (dto.mood && moodScenarioMap[dto.mood]) {
        const matchingScenarios = recipe.scenarios.filter((s) =>
          moodScenarioMap[dto.mood].includes(s),
        );
        if (matchingScenarios.length > 0) {
          score += matchingScenarios.length * 20;
          matchReasons.push(`适用场景匹配：${matchingScenarios.join('、')}`);
        }
      }

      if (dto.season) {
        if (recipe.seasons.includes(dto.season) || recipe.seasons.includes('四季皆宜')) {
          score += 15;
          matchReasons.push(`适合${dto.season}使用`);
        }
      }

      if (dto.scentPreferences && dto.scentPreferences.length > 0) {
        const recipeNotes = recipe.scentLayers.map((l) => l.note);
        const recipeOils = recipe.essentialOils.map((e) => e.name);
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

      return { recipe, score, matchReasons };
    });

    return results
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }
}
