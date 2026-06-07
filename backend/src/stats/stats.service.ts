import { Injectable } from '@nestjs/common';
import { DataStore } from '../common/data.store';

@Injectable()
export class StatsService {
  constructor(private readonly dataStore: DataStore) {}

  getScentPopularity() {
    const scentCount: Record<string, number> = {};
    this.dataStore.orders.forEach((order) => {
      order.scentPreferences.forEach((s) => {
        scentCount[s] = (scentCount[s] || 0) + 1;
      });
    });
    this.dataStore.recipes.forEach((recipe) => {
      recipe.scentLayers.forEach((layer) => {
        if (!scentCount[layer.note]) {
          scentCount[layer.note] = 0;
        }
      });
    });
    const total = Object.values(scentCount).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(scentCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  getRecipeOptimization() {
    return this.dataStore.recipes
      .map((r) => ({
        recipeId: r.id,
        recipeName: r.name,
        optimizationCount: r.optimizationCount,
      }))
      .sort((a, b) => b.optimizationCount - a.optimizationCount);
  }

  getBurnTimeCompliance() {
    const feedbacks = this.dataStore.feedbacks;
    if (feedbacks.length === 0) {
      return {
        total: 0,
        compliant: 0,
        nonCompliant: 0,
        complianceRate: 0,
        details: [],
      };
    }
    const threshold = 0.85;
    const details = feedbacks.map((f) => {
      const ratio = f.actualBurnTime / f.expectedBurnTime;
      const compliant = ratio >= threshold;
      return {
        feedbackId: f.id,
        recipeId: f.recipeId,
        expected: f.expectedBurnTime,
        actual: f.actualBurnTime,
        ratio: Math.round(ratio * 100) / 100,
        compliant,
      };
    });
    const compliant = details.filter((d) => d.compliant).length;
    return {
      total: feedbacks.length,
      compliant,
      nonCompliant: feedbacks.length - compliant,
      complianceRate: Math.round((compliant / feedbacks.length) * 100),
      details,
    };
  }

  getRepurchaseDistribution() {
    const recipeCount: Record<string, { name: string; count: number }> = {};
    this.dataStore.orders.forEach((order) => {
      if (!recipeCount[order.recipeId]) {
        recipeCount[order.recipeId] = { name: order.recipeName, count: 0 };
      }
      recipeCount[order.recipeId].count += order.quantity;
    });
    const total = Object.values(recipeCount).reduce((a, b) => a + b.count, 0) || 1;
    return Object.entries(recipeCount)
      .map(([recipeId, data]) => ({
        recipeId,
        recipeName: data.name,
        orderCount: data.count,
        percentage: Math.round((data.count / total) * 100),
      }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }

  getOverview() {
    return {
      totalRecipes: this.dataStore.recipes.length,
      totalOrders: this.dataStore.orders.length,
      totalProductions: this.dataStore.productions.length,
      totalFeedbacks: this.dataStore.feedbacks.length,
      pendingOrders: this.dataStore.orders.filter((o) => o.status === 'pending').length,
      producingOrders: this.dataStore.orders.filter((o) => o.status === 'producing').length,
      completedOrders: this.dataStore.orders.filter((o) => o.status === 'completed').length,
    };
  }

  getAllStats() {
    return {
      overview: this.getOverview(),
      scentPopularity: this.getScentPopularity(),
      recipeOptimization: this.getRecipeOptimization(),
      burnTimeCompliance: this.getBurnTimeCompliance(),
      repurchaseDistribution: this.getRepurchaseDistribution(),
    };
  }
}
