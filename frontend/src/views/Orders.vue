<template>
  <div class="orders-page">
    <div class="page-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-btn', { active: activeTab === tab.value }]"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <div v-if="activeTab === 'new'" class="order-form-section">
      <div class="section-card">
        <div class="card-title">
          <span class="step-num">1</span>
          顾客偏好
        </div>
        <div class="form-grid">
          <div class="form-item">
            <label>顾客姓名</label>
            <input v-model="orderForm.customerName" type="text" placeholder="请输入姓名" />
          </div>
          <div class="form-item">
            <label>心情</label>
            <select v-model="orderForm.mood">
              <option value="">请选择心情</option>
              <option v-for="m in moods" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div class="form-item">
            <label>场合</label>
            <select v-model="orderForm.occasion">
              <option value="">请选择场合</option>
              <option v-for="o in occasions" :key="o" :value="o">{{ o }}</option>
            </select>
          </div>
          <div class="form-item">
            <label>当前季节</label>
            <select v-model="currentSeason">
              <option v-for="s in seasons" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-item full">
            <label>香调偏好（可多选）</label>
            <div class="checkbox-group">
              <label v-for="s in scentOptions" :key="s" class="checkbox-item">
                <input type="checkbox" :value="s" v-model="orderForm.scentPreferences" />
                {{ s }}
              </label>
            </div>
          </div>
          <div class="form-item full">
            <button class="btn btn-primary w-full" @click="getRecommendations">
              🔍 智能推荐配方
            </button>
          </div>
        </div>
      </div>

      <div v-if="recommendations.length > 0" class="section-card">
        <div class="card-title">
          <span class="step-num">2</span>
          推荐配方
        </div>
        <div class="recommend-list">
          <div
            v-for="rec in recommendations"
            :key="rec.recipe.id"
            :class="['recommend-item', { selected: selectedRecipe?.id === rec.recipe.id }]"
            @click="selectRecipe(rec.recipe)"
          >
            <div class="rec-header">
              <h4>{{ rec.recipe.name }}</h4>
              <span class="match-score">匹配度 {{ rec.score }}</span>
            </div>
            <p class="rec-desc">{{ rec.recipe.description }}</p>
            <div class="rec-layers">
              <span v-for="l in rec.recipe.scentLayers" :key="l.layer" class="layer-chip">
                {{ l.layer }}·{{ l.note }}
              </span>
            </div>
            <div class="rec-meta">
              <span>🕯️ {{ rec.recipe.waxBase }}</span>
              <span>⏱️ {{ rec.recipe.burnTimeEstimate }}h</span>
            </div>
            <div v-if="rec.matchReasons.length > 0" class="match-reasons">
              <span v-for="r in rec.matchReasons" :key="r" class="match-tag">✓ {{ r }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedRecipe" class="section-card">
        <div class="card-title">
          <span class="step-num">3</span>
          定制细节
        </div>
        <div class="form-grid">
          <div class="form-item">
            <label>已选配方</label>
            <div class="selected-display">
              <span class="tag">{{ selectedRecipe.name }}</span>
              <button class="btn-xs-link" @click="selectedRecipe = null">更换</button>
            </div>
          </div>
          <div class="form-item">
            <label>数量</label>
            <div class="quantity-control">
              <button class="qty-btn" @click="orderForm.quantity > 1 && orderForm.quantity--">-</button>
              <span class="qty-num">{{ orderForm.quantity }}</span>
              <button class="qty-btn" @click="orderForm.quantity++">+</button>
            </div>
          </div>
          <div class="form-item full">
            <label>刻字标签（可选，最多20字）</label>
            <input
              v-model="orderForm.engraving"
              type="text"
              maxlength="20"
              placeholder="如：愿你被温柔以待"
            />
            <div class="form-hint">{{ orderForm.engraving.length }}/20</div>
          </div>
          <div class="form-item full">
            <button class="btn btn-primary w-full" @click="submitOrder">
              ✅ 确认下单
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="orders-list">
      <div v-if="filteredOrders.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无订单</p>
      </div>
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
      >
        <div class="order-header">
          <div>
            <h4>{{ order.customerName }} 的订单</h4>
            <p class="order-id">#{{ order.id.slice(0, 8) }}</p>
          </div>
          <span :class="['status-badge', order.status]">
            {{ statusLabels[order.status] }}
          </span>
        </div>
        <div class="order-body">
          <div class="order-row">
            <span class="order-label">配方</span>
            <span class="tag">{{ order.recipeName }}</span>
          </div>
          <div class="order-row">
            <span class="order-label">心情/场合</span>
            <span>{{ order.mood }} · {{ order.occasion }}</span>
          </div>
          <div class="order-row">
            <span class="order-label">香调偏好</span>
            <span>{{ order.scentPreferences.join('、') }}</span>
          </div>
          <div class="order-row">
            <span class="order-label">数量</span>
            <span>{{ order.quantity }} 个</span>
          </div>
          <div v-if="order.engraving" class="order-row">
            <span class="order-label">刻字</span>
            <span class="engraving">"{{ order.engraving }}"</span>
          </div>
        </div>
        <div class="order-footer">
          <span class="order-date">{{ formatDate(order.createdAt) }}</span>
          <div class="order-actions">
            <button
              v-if="order.status === 'pending'"
              class="btn btn-sm btn-primary"
              @click="updateStatus(order.id, 'producing')"
            >
              开始制作
            </button>
            <button
              v-if="order.status === 'producing'"
              class="btn btn-sm btn-primary"
              @click="updateStatus(order.id, 'completed')"
            >
              标记完成
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { orderApi, Order, OrderStatus } from '@/api/order';
import { recipeApi, Recipe, RecommendResult } from '@/api/recipe';

const moods = ['放松减压', '提升活力', '浪漫温馨', '专注工作', '助眠安神'];
const occasions = ['生日送礼', '自用日常', '节日礼物', '婚礼伴手礼', '乔迁新居'];
const seasons = ['春季', '夏季', '秋季', '冬季', '四季皆宜'];
const scentOptions = ['薰衣草', '柠檬', '雪松', '玫瑰', '檀香', '薄荷', '橙花', '佛手柑', '尤加利', '茉莉'];

const statusLabels: Record<OrderStatus, string> = {
  pending: '待制作',
  producing: '制作中',
  completed: '已完成',
};

const activeTab = ref<'new' | 'all' | 'pending' | 'producing' | 'completed'>('new');
const orders = ref<Order[]>([]);
const recommendations = ref<RecommendResult[]>([]);
const selectedRecipe = ref<Recipe | null>(null);
const currentSeason = ref(new Date().getMonth() < 3 ? '春季' : new Date().getMonth() < 6 ? '夏季' : new Date().getMonth() < 9 ? '秋季' : '冬季');

const orderForm = ref({
  customerName: '',
  mood: '',
  occasion: '',
  scentPreferences: [] as string[],
  recipeId: '',
  recipeName: '',
  engraving: '',
  quantity: 1,
});

const tabs = computed(() => [
  { label: '新建订单', value: 'new' as const, count: 0 },
  { label: '全部订单', value: 'all' as const, count: orders.value.length },
  { label: '待制作', value: 'pending' as const, count: orders.value.filter((o) => o.status === 'pending').length },
  { label: '制作中', value: 'producing' as const, count: orders.value.filter((o) => o.status === 'producing').length },
  { label: '已完成', value: 'completed' as const, count: orders.value.filter((o) => o.status === 'completed').length },
]);

const filteredOrders = computed(() => {
  if (activeTab.value === 'new' || activeTab.value === 'all') return orders.value;
  return orders.value.filter((o) => o.status === activeTab.value);
});

const loadOrders = async () => {
  orders.value = await orderApi.findAll();
};

const getRecommendations = async () => {
  if (!orderForm.value.mood && !orderForm.value.occasion && orderForm.value.scentPreferences.length === 0) {
    alert('请至少选择心情、场合或香调偏好中的一项');
    return;
  }
  recommendations.value = await recipeApi.recommend({
    mood: orderForm.value.mood || undefined,
    occasion: orderForm.value.occasion || undefined,
    scentPreferences: orderForm.value.scentPreferences.length > 0 ? orderForm.value.scentPreferences : undefined,
    season: currentSeason.value,
  });
  selectedRecipe.value = null;
};

const selectRecipe = (recipe: Recipe) => {
  selectedRecipe.value = recipe;
  orderForm.value.recipeId = recipe.id;
  orderForm.value.recipeName = recipe.name;
};

const submitOrder = async () => {
  if (!orderForm.value.customerName) {
    alert('请填写顾客姓名');
    return;
  }
  if (!selectedRecipe.value) {
    alert('请选择配方');
    return;
  }
  try {
    await orderApi.create(orderForm.value);
    alert('下单成功！');
    orderForm.value = {
      customerName: '',
      mood: '',
      occasion: '',
      scentPreferences: [],
      recipeId: '',
      recipeName: '',
      engraving: '',
      quantity: 1,
    };
    selectedRecipe.value = null;
    recommendations.value = [];
    await loadOrders();
    activeTab.value = 'pending';
  } catch (e) {
    alert('下单失败');
  }
};

const updateStatus = async (id: string, status: OrderStatus) => {
  await orderApi.updateStatus(id, status);
  await loadOrders();
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

watch(activeTab, () => {
  if (activeTab.value !== 'new') loadOrders();
});

onMounted(loadOrders);
</script>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-tabs {
  display: flex;
  gap: 4px;
  background: var(--surface);
  padding: 6px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  width: fit-content;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-light);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text);
}

.tab-btn.active {
  background: var(--primary);
  color: #fff;
}

.tab-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.tab-btn:not(.active) .tab-count {
  background: var(--bg-warm);
  color: var(--primary);
}

.order-form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text);
}

.step-num {
  width: 28px;
  height: 28px;
  background: var(--primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item.full {
  grid-column: 1 / -1;
}

.form-item label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.form-item input,
.form-item select {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text);
  background: var(--surface);
  outline: none;
  transition: border 0.2s;
}

.form-item input:focus,
.form-item select:focus {
  border-color: var(--primary);
}

.form-hint {
  font-size: 12px;
  color: var(--text-light);
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.checkbox-item:hover {
  border-color: var(--primary);
}

.checkbox-item:has(input:checked) {
  background: var(--bg-warm);
  border-color: var(--primary);
  color: var(--primary-dark);
}

.checkbox-item input {
  accent-color: var(--primary);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
}

.w-full {
  width: 100%;
  justify-content: center;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.recommend-item {
  padding: 18px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg);
}

.recommend-item:hover {
  border-color: var(--accent);
}

.recommend-item.selected {
  border-color: var(--primary);
  background: linear-gradient(135deg, #fff9f3, #fdf0e3);
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rec-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-dark);
}

.match-score {
  background: var(--primary);
  color: #fff;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.rec-desc {
  color: var(--text-light);
  font-size: 13px;
  margin-bottom: 10px;
}

.rec-layers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.layer-chip {
  background: var(--bg-warm);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: var(--primary-dark);
}

.rec-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 10px;
}

.match-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.match-tag {
  background: #e8f0e4;
  color: var(--success);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.selected-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tag {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  color: var(--primary-dark);
  padding: 5px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.btn-xs-link {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0;
}

.qty-btn {
  width: 36px;
  height: 38px;
  border: 1px solid var(--border);
  background: var(--bg);
  font-size: 18px;
  cursor: pointer;
  color: var(--text);
}

.qty-btn:first-child {
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.qty-btn:last-child {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.qty-num {
  min-width: 50px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  font-weight: 600;
}

.orders-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 18px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
  color: var(--text-light);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.order-card {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.order-header {
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: linear-gradient(135deg, #fdf8f3, #f5ebe0);
  border-bottom: 1px solid var(--border);
}

.order-header h4 {
  font-size: 15px;
  font-weight: 600;
}

.order-id {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 2px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.producing {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.order-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 13px;
}

.order-label {
  color: var(--text-light);
  min-width: 70px;
  flex-shrink: 0;
}

.engraving {
  color: var(--primary);
  font-style: italic;
  font-family: Georgia, serif;
}

.order-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-date {
  font-size: 12px;
  color: var(--text-light);
}

.order-actions {
  display: flex;
  gap: 8px;
}
</style>
