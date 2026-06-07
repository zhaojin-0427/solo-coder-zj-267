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

export interface Recipe {
  id: string;
  name: string;
  waxBase: string;
  essentialOils: EssentialOil[];
  scentLayers: ScentLayer[];
  burnTimeEstimate: number;
  scenarios: string[];
  seasons: string[];
  description: string;
  optimizationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendResult {
  recipe: Recipe;
  score: number;
  matchReasons: string[];
}

export const recipeApi = {
  findAll: () => request.get<any, Recipe[]>('/recipes'),
  findOne: (id: string) => request.get<any, Recipe>(`/recipes/${id}`),
  create: (data: Partial<Recipe>) => request.post<any, Recipe>('/recipes', data),
  update: (id: string, data: Partial<Recipe>) => request.put<any, Recipe>(`/recipes/${id}`, data),
  remove: (id: string) => request.delete(`/recipes/${id}`),
  recommend: (params: any) => request.get<any, RecommendResult[]>('/recipes/recommend', { params }),
};
