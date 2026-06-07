import request from '@/utils/request';

export interface OilAmount {
  name: string;
  amount: number;
}

export interface ProductionRecord {
  id: string;
  orderId: string;
  recipeId: string;
  recipeName: string;
  recipeVersionId?: string;
  recipeVersion?: string;
  waxAmount: number;
  essentialOilAmounts: OilAmount[];
  pourTemperature: number;
  coolTime: number;
  notes: string;
  createdAt: string;
}

export const productionApi = {
  findAll: () => request.get<any, ProductionRecord[]>('/productions'),
  findOne: (id: string) => request.get<any, ProductionRecord>(`/productions/${id}`),
  findByOrder: (orderId: string) => request.get<any, ProductionRecord[]>(`/productions/order/${orderId}`),
  create: (data: Partial<ProductionRecord>) =>
    request.post<any, ProductionRecord>('/productions', data),
};
