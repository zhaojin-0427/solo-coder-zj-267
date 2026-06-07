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
    this.dataStore.recipeVersions.forEach((version) => {
      version.scentLayers.forEach((layer) => {
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

  getVersionComplianceTrend() {
    const threshold = 0.85;
    const publishedVersions = this.dataStore.recipeVersions.filter((v) => v.status === 'published');

    const recipeMap = new Map<string, { recipeId: string; recipeName: string; versions: any[] }>();

    this.dataStore.recipes.forEach((r) => {
      recipeMap.set(r.id, {
        recipeId: r.id,
        recipeName: r.name,
        versions: [],
      });
    });

    publishedVersions.forEach((v) => {
      const versionFeedbacks = this.dataStore.feedbacks.filter((f) => f.recipeVersionId === v.id);
      const feedbackCount = versionFeedbacks.length;
      let complianceRate = 0;
      if (feedbackCount > 0) {
        const compliantCount = versionFeedbacks.filter(
          (f) => f.actualBurnTime / f.expectedBurnTime >= threshold,
        ).length;
        complianceRate = Math.round((compliantCount / feedbackCount) * 100);
      }

      const recipeData = recipeMap.get(v.recipeId);
      if (recipeData) {
        recipeData.versions.push({
          version: v.version,
          versionId: v.id,
          complianceRate,
          feedbackCount,
          createdAt: v.createdAt,
        });
      }
    });

    const result = Array.from(recipeMap.values())
      .filter((r) => r.versions.length > 0)
      .map((r) => ({
        ...r,
        versions: r.versions.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
      }));

    return result;
  }

  getBurnTimeImprovement() {
    const result: any[] = [];
    const publishedVersions = this.dataStore.recipeVersions.filter((v) => v.status === 'published');

    this.dataStore.recipes.forEach((recipe) => {
      const recipeVersions = publishedVersions
        .filter((v) => v.recipeId === recipe.id)
        .sort((a, b) => {
          const parseVersion = (ver: string) => {
            const match = ver.match(/v(\d+)\.(\d+)/);
            if (match) {
              return parseInt(match[1]) * 1000 + parseInt(match[2]);
            }
            return 0;
          };
          return parseVersion(a.version) - parseVersion(b.version);
        });

      const versionsWithFeedback = recipeVersions.filter((v) => {
        const fb = this.dataStore.feedbacks.filter((f) => f.recipeVersionId === v.id);
        return fb.length > 0;
      });

      if (versionsWithFeedback.length < 2) {
        return;
      }

      const comparisons: any[] = [];
      for (let i = 0; i < versionsWithFeedback.length - 1; i++) {
        const fromVersion = versionsWithFeedback[i];
        const toVersion = versionsWithFeedback[i + 1];

        const fromFeedbacks = this.dataStore.feedbacks.filter(
          (f) => f.recipeVersionId === fromVersion.id,
        );
        const toFeedbacks = this.dataStore.feedbacks.filter(
          (f) => f.recipeVersionId === toVersion.id,
        );

        const fromAvgBurn =
          fromFeedbacks.reduce((sum, f) => sum + f.actualBurnTime, 0) / fromFeedbacks.length;
        const toAvgBurn =
          toFeedbacks.reduce((sum, f) => sum + f.actualBurnTime, 0) / toFeedbacks.length;

        const improvementHours = toAvgBurn - fromAvgBurn;
        const improvementPercent =
          fromAvgBurn > 0 ? Math.round((improvementHours / fromAvgBurn) * 100) : 0;

        comparisons.push({
          fromVersion: fromVersion.version,
          toVersion: toVersion.version,
          fromAvgBurn: Math.round(fromAvgBurn * 100) / 100,
          toAvgBurn: Math.round(toAvgBurn * 100) / 100,
          improvementHours: Math.round(improvementHours * 100) / 100,
          improvementPercent,
        });
      }

      if (comparisons.length > 0) {
        result.push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          comparisons,
        });
      }
    });

    return result;
  }

  getFeedbackDrivenReleases() {
    const publishedVersions = this.dataStore.recipeVersions.filter((v) => v.status === 'published');

    const monthMap = new Map<string, { feedbackDrivenCount: number; regularCount: number }>();

    publishedVersions.forEach((v) => {
      const date = v.publishedAt || v.createdAt;
      const d = new Date(date);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(month)) {
        monthMap.set(month, { feedbackDrivenCount: 0, regularCount: 0 });
      }

      const entry = monthMap.get(month)!;
      if (v.sourceFeedbackId) {
        entry.feedbackDrivenCount++;
      } else {
        entry.regularCount++;
      }
    });

    const result = Array.from(monthMap.entries())
      .map(([month, counts]) => ({
        month,
        feedbackDrivenCount: counts.feedbackDrivenCount,
        regularCount: counts.regularCount,
        totalCount: counts.feedbackDrivenCount + counts.regularCount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return result;
  }

  getAllStats() {
    return {
      overview: this.getOverview(),
      scentPopularity: this.getScentPopularity(),
      recipeOptimization: this.getRecipeOptimization(),
      burnTimeCompliance: this.getBurnTimeCompliance(),
      repurchaseDistribution: this.getRepurchaseDistribution(),
      versionComplianceTrend: this.getVersionComplianceTrend(),
      burnTimeImprovement: this.getBurnTimeImprovement(),
      feedbackDrivenReleases: this.getFeedbackDrivenReleases(),
    };
  }
}
