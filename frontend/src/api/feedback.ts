import request from '@/utils/request';

export interface BurnFeedback {
  id: string;
  productionId: string;
  recipeId: string;
  actualBurnTime: number;
  expectedBurnTime: number;
  scentStrength: number;
  scentDuration: number;
  comments: string;
  optimizationSuggestion: string;
  createdAt: string;
}

export const feedbackApi = {
  findAll: () => request.get<any, BurnFeedback[]>('/feedbacks'),
  findOne: (id: string) => request.get<any, BurnFeedback>(`/feedbacks/${id}`),
  findByRecipe: (recipeId: string) => request.get<any, BurnFeedback[]>(`/feedbacks/recipe/${recipeId}`),
  create: (data: Partial<BurnFeedback>) => request.post<any, BurnFeedback>('/feedbacks', data),
};
