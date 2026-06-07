import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/recipes' },
  {
    path: '/recipes',
    name: 'Recipes',
    component: () => import('@/views/Recipes.vue'),
    meta: { title: '配方库', icon: '📜' },
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/Orders.vue'),
    meta: { title: '定制下单', icon: '🛍️' },
  },
  {
    path: '/productions',
    name: 'Productions',
    component: () => import('@/views/Productions.vue'),
    meta: { title: '制作记录', icon: '🏭' },
  },
  {
    path: '/feedbacks',
    name: 'Feedbacks',
    component: () => import('@/views/Feedbacks.vue'),
    meta: { title: '燃烧反馈', icon: '🔥' },
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/views/Stats.vue'),
    meta: { title: '数据统计', icon: '📊' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
