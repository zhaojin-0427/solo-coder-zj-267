import request from '@/utils/request';

export type OrderStatus = 'pending' | 'producing' | 'completed';

export interface Order {
  id: string;
  customerName: string;
  mood: string;
  occasion: string;
  scentPreferences: string[];
  recipeId: string;
  recipeName: string;
  recipeVersionId?: string;
  recipeVersion?: string;
  engraving: string;
  quantity: number;
  status: OrderStatus;
  createdAt: string;
}

export const orderApi = {
  findAll: (status?: string) => request.get<any, Order[]>('/orders', { params: { status } }),
  findOne: (id: string) => request.get<any, Order>(`/orders/${id}`),
  create: (data: Partial<Order>) => request.post<any, Order>('/orders', data),
  updateStatus: (id: string, status: OrderStatus) =>
    request.put<any, Order>(`/orders/${id}/status`, { status }),
  remove: (id: string) => request.delete(`/orders/${id}`),
};
