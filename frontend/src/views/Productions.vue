<template>
  <div class="productions-page">
    <div class="page-header">
      <p class="page-desc">记录每一支蜡烛的制作过程，追踪工艺参数</p>
      <button class="btn btn-primary" @click="openModal">
        <span class="btn-icon">+</span> 新增制作记录
      </button>
    </div>

    <div v-if="productions.length === 0" class="empty-state">
      <div class="empty-icon">🏭</div>
      <p>暂无制作记录</p>
    </div>

    <div v-else class="production-list">
      <div
        v-for="p in productions"
        :key="p.id"
        class="production-card"
      >
        <div class="card-header">
          <div>
            <h3>{{ p.recipeName }}</h3>
            <p class="sub">关联订单 #{{ p.orderId.slice(0, 8) }}</p>
          </div>
          <span class="date-badge">{{ formatDate(p.createdAt) }}</span>
        </div>

        <div class="card-body">
          <div class="stat-row">
            <div class="stat">
              <span class="stat-label">蜡用量</span>
              <span class="stat-value">{{ p.waxAmount }}g</span>
            </div>
            <div class="stat">
              <span class="stat-label">浇注温度</span>
              <span class="stat-value">{{ p.pourTemperature }}°C</span>
            </div>
            <div class="stat">
              <span class="stat-label">冷却时间</span>
              <span class="stat-value">{{ p.coolTime }}h</span>
            </div>
          </div>

          <div class="section">
            <span class="section-label">🧪 精油用量</span>
            <div class="oils">
              <span v-for="oil in p.essentialOilAmounts" :key="oil.name" class="oil-tag">
                {{ oil.name }} · {{ oil.amount }}g
              </span>
            </div>
          </div>

          <div v-if="p.notes" class="section">
            <span class="section-label">📝 备注</span>
            <p class="notes">{{ p.notes }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>新增制作记录</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-item full">
              <label>关联订单</label>
              <select v-model="selectedOrderId" @change="onOrderChange">
                <option value="">请选择待制作订单</option>
                <option v-for="o in pendingOrders" :key="o.id" :value="o.id">
                  {{ o.customerName }} - {{ o.recipeName }} (#{{ o.id.slice(0, 8) }})
                </option>
              </select>
            </div>

            <div class="form-item full">
              <label>配方</label>
              <div v-if="selectedRecipe" class="selected-display">
                <span class="tag">{{ selectedRecipe.name }}</span>
                <span class="text-light">蜡基：{{ selectedRecipe.waxBase }}</span>
              </div>
              <span v-else class="text-light">请先选择订单</span>
            </div>

            <div class="form-item">
              <label>蜡用量 (g)</label>
              <input v-model.number="form.waxAmount" type="number" min="0" />
            </div>
            <div class="form-item">
              <label>浇注温度 (°C)</label>
              <input v-model.number="form.pourTemperature" type="number" min="0" />
            </div>
            <div class="form-item">
              <label>冷却时间 (h)</label>
              <input v-model.number="form.coolTime" type="number" min="0" />
            </div>

            <div class="form-item full">
              <div class="sub-section">
                <label>精油用量</label>
                <button class="btn btn-xs btn-outline" @click="addOil">+ 添加</button>
              </div>
              <div v-for="(oil, idx) in form.essentialOilAmounts" :key="idx" class="nested-form">
                <input v-model="oil.name" placeholder="精油名称" style="flex: 1" />
                <input v-model.number="oil.amount" type="number" placeholder="用量g" style="width: 100px" min="0" />
                <button class="btn-danger-sm" @click="form.essentialOilAmounts.splice(idx, 1)">×</button>
              </div>
            </div>

            <div class="form-item full">
              <label>备注</label>
              <textarea v-model="form.notes" rows="2" placeholder="制作过程中的备注..."></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="submit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { productionApi, ProductionRecord, OilAmount } from '@/api/production';
import { orderApi, Order } from '@/api/order';
import { recipeApi, Recipe } from '@/api/recipe';

const productions = ref<ProductionRecord[]>([]);
const pendingOrders = ref<Order[]>([]);
const recipes = ref<Recipe[]>([]);
const showCreateModal = ref(false);
const selectedRecipe = ref<Recipe | null>(null);
const selectedOrderId = ref('');

const defaultForm = () => ({
  orderId: '',
  recipeId: '',
  recipeName: '',
  waxAmount: 200,
  essentialOilAmounts: [{ name: '', amount: 0 }] as OilAmount[],
  pourTemperature: 65,
  coolTime: 6,
  notes: '',
});

const form = ref(defaultForm());

const openModal = () => {
  selectedOrderId.value = '';
  selectedRecipe.value = null;
  form.value = defaultForm();
  showCreateModal.value = true;
};

const closeModal = () => {
  showCreateModal.value = false;
  selectedOrderId.value = '';
  selectedRecipe.value = null;
  form.value = defaultForm();
};

const loadData = async () => {
  productions.value = await productionApi.findAll();
  pendingOrders.value = (await orderApi.findAll()).filter(
    (o) => o.status === 'pending' || o.status === 'producing',
  );
  recipes.value = await recipeApi.findAll();
};

const onOrderChange = () => {
  if (!selectedOrderId.value) {
    selectedRecipe.value = null;
    form.value.orderId = '';
    form.value.recipeId = '';
    form.value.recipeName = '';
    return;
  }
  const order = pendingOrders.value.find((o) => o.id === selectedOrderId.value);
  if (order) {
    form.value.orderId = order.id;
    form.value.recipeId = order.recipeId;
    form.value.recipeName = order.recipeName;
    const recipe = recipes.value.find((r) => r.id === order.recipeId);
    if (recipe) {
      selectedRecipe.value = recipe;
      form.value.recipeId = recipe.id;
      form.value.recipeName = recipe.name;
      form.value.essentialOilAmounts = recipe.essentialOils.map((eo) => ({
        name: eo.name,
        amount: Math.round((eo.percentage / 100) * 30 * 10) / 10,
      }));
    } else {
      selectedRecipe.value = null;
    }
  }
};

const addOil = () => {
  form.value.essentialOilAmounts.push({ name: '', amount: 0 });
};

const submit = async () => {
  if (!form.value.orderId) {
    alert('请选择关联订单');
    return;
  }
  if (!form.value.recipeId) {
    alert('配方信息未找到，请重新选择订单');
    return;
  }
  try {
    await productionApi.create(form.value);
    showCreateModal.value = false;
    selectedOrderId.value = '';
    selectedRecipe.value = null;
    form.value = defaultForm();
    await loadData();
  } catch (e) {
    alert('保存失败');
  }
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

onMounted(loadData);

watch(selectedOrderId, () => {
  onOrderChange();
});
</script>

<style scoped>
.productions-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.page-desc {
  color: var(--text-light);
  font-size: 14px;
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

.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.btn-outline:hover {
  background: var(--bg-warm);
  border-color: var(--primary);
}

.btn-xs {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-icon {
  font-size: 16px;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-light);
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.production-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 18px;
}

.production-card {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.card-header {
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: linear-gradient(135deg, #fff5eb, #fbe8d3);
  border-bottom: 1px solid var(--border);
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-dark);
}

.sub {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
}

.date-badge {
  background: var(--surface);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: var(--text-light);
  border: 1px solid var(--border);
}

.card-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--bg);
  border-radius: var(--radius-sm);
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: var(--text-light);
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-dark);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 13px;
  color: var(--text-light);
  font-weight: 500;
}

.oils {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.oil-tag {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  color: var(--primary-dark);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.notes {
  padding: 10px 14px;
  background: var(--bg);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(61, 44, 30, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal {
  background: var(--surface);
  border-radius: var(--radius);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-light);
  cursor: pointer;
}

.close-btn:hover {
  color: var(--text);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
.form-item select,
.form-item textarea {
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
.form-item select:focus,
.form-item textarea:focus {
  border-color: var(--primary);
}

.selected-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
}

.tag {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  color: var(--primary-dark);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.text-light {
  color: var(--text-light);
  font-size: 13px;
}

.sub-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.nested-form {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.nested-form input {
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  outline: none;
}

.btn-danger-sm {
  background: #fde8e4;
  color: var(--danger);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}
</style>
