import request from '@/utils/request';

export interface EssentialOil {
  name: string;
  percentage: number;
}

export interface ScentLayer {
  layer: string;
  note: string;
  description: string;
}

export type VersionStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export interface RecipeVersion {
  id: string;
  recipeId: string;
  version: string;
  status: VersionStatus;
  waxBase: string;
  essentialOils: EssentialOil[];
  scentLayers: ScentLayer[];
  burnTimeEstimate: number;
  scenarios: string[];
  seasons: string[];
  description: string;
  changeLog: string;
  baseVersionId?: string;
  sourceFeedbackId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  complianceRate?: number;
  totalFeedbacks?: number;
  avgBurnTime?: number;
}

export interface Recipe {
  id: string;
  name: string;
  currentVersionId?: string;
  optimizationCount: number;
  createdAt: string;
  updatedAt: string;
  currentVersion?: RecipeVersion;
  versionCount?: number;
  recentComplianceRate?: number;
}

export interface RecommendResult {
  recipe: { id: string; name: string };
  version: RecipeVersion;
  score: number;
  matchReasons: string[];
  complianceRate?: number;
}

export interface VersionDiff {
  version1Id: string;
  version2Id: string;
  fields: {
    field: string;
    value1: any;
    value2: any;
  }[];
}

export const recipeApi = {
  findAll: () => request.get<any, Recipe[]>('/recipes'),
  findAllPublishedVersions: () => request.get<any, RecipeVersion[]>('/recipes/versions/published'),
  findOne: (id: string) => request.get<any, Recipe>(`/recipes/${id}`),
  findVersions: (recipeId: string) => request.get<any, RecipeVersion[]>(`/recipes/${recipeId}/versions`),
  findVersion: (versionId: string) => request.get<any, RecipeVersion>(`/recipes/versions/${versionId}`),
  compareVersions: (v1: string, v2: string) => request.get<any, VersionDiff>(`/recipes/versions/compare/${v1}/${v2}`),
  create: (data: Partial<Recipe>) => request.post<any, Recipe>('/recipes', data),
  createVersion: (data: Partial<RecipeVersion>) => request.post<any, RecipeVersion>('/recipes/versions', data),
  updateVersion: (versionId: string, data: Partial<RecipeVersion>) =>
    request.put<any, RecipeVersion>(`/recipes/versions/${versionId}`, data),
  reviewVersion: (versionId: string, action: string, reviewNote?: string) =>
    request.put<any, RecipeVersion>(`/recipes/versions/${versionId}/review`, { action, reviewNote }),
  updateRecipeName: (recipeId: string, name: string) =>
    request.put<any, Recipe>(`/recipes/${recipeId}/name`, { name }),
  remove: (id: string) => request.delete(`/recipes/${id}`),
  recommend: (params: any) => request.get<any, RecommendResult[]>('/recipes/recommend', { params }),
  optimizeFromFeedback: (feedbackId: string, description?: string) =>
    request.post<any, RecipeVersion>('/recipes/optimize-from-feedback', { feedbackId, description }),
};
