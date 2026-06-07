import request from '@/utils/request';

export interface Overview {
  totalRecipes: number;
  totalOrders: number;
  totalProductions: number;
  totalFeedbacks: number;
  pendingOrders: number;
  producingOrders: number;
  completedOrders: number;
}

export interface ScentPopularity {
  name: string;
  count: number;
  percentage: number;
}

export interface RecipeOptimization {
  recipeId: string;
  recipeName: string;
  optimizationCount: number;
}

export interface BurnCompliance {
  total: number;
  compliant: number;
  nonCompliant: number;
  complianceRate: number;
  details: {
    feedbackId: string;
    recipeId: string;
    expected: number;
    actual: number;
    ratio: number;
    compliant: boolean;
  }[];
}

export interface RepurchaseItem {
  recipeId: string;
  recipeName: string;
  orderCount: number;
  percentage: number;
}

export interface VersionComplianceTrend {
  recipeId: string;
  recipeName: string;
  versions: {
    version: string;
    versionId: string;
    complianceRate: number;
    feedbackCount: number;
    createdAt: string;
  }[];
}

export interface BurnTimeImprovement {
  recipeId: string;
  recipeName: string;
  comparisons: {
    fromVersion: string;
    toVersion: string;
    fromAvgBurn: number;
    toAvgBurn: number;
    improvementHours: number;
    improvementPercent: number;
  }[];
}

export interface FeedbackDrivenRelease {
  month: string;
  feedbackDrivenCount: number;
  regularCount: number;
  totalCount: number;
}

export interface AllStats {
  overview: Overview;
  scentPopularity: ScentPopularity[];
  recipeOptimization: RecipeOptimization[];
  burnTimeCompliance: BurnCompliance;
  repurchaseDistribution: RepurchaseItem[];
  versionComplianceTrend?: VersionComplianceTrend[];
  burnTimeImprovement?: BurnTimeImprovement[];
  feedbackDrivenReleases?: FeedbackDrivenRelease[];
}

export const statsApi = {
  getAll: () => request.get<any, AllStats>('/stats'),
  getOverview: () => request.get<any, Overview>('/stats/overview'),
  getScentPopularity: () => request.get<any, ScentPopularity[]>('/stats/scent-popularity'),
  getRecipeOptimization: () =>
    request.get<any, RecipeOptimization[]>('/stats/recipe-optimization'),
  getBurnTimeCompliance: () => request.get<any, BurnCompliance>('/stats/burn-time-compliance'),
  getRepurchaseDistribution: () =>
    request.get<any, RepurchaseItem[]>('/stats/repurchase-distribution'),
  getVersionComplianceTrend: () =>
    request.get<any, VersionComplianceTrend[]>('/stats/version-compliance-trend'),
  getBurnTimeImprovement: () =>
    request.get<any, BurnTimeImprovement[]>('/stats/burn-time-improvement'),
  getFeedbackDrivenReleases: () =>
    request.get<any, FeedbackDrivenRelease[]>('/stats/feedback-driven-releases'),
};
