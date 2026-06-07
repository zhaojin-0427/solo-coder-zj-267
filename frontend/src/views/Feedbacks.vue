<template>
  <div class="feedbacks-page">
    <div class="page-header">
      <p class="page-desc">记录燃烧表现，收集反馈，持续优化配方</p>
      <button class="btn btn-primary" @click="showCreateModal = true">
        <span class="btn-icon">+</span> 新增反馈
      </button>
    </div>

    <div v-if="feedbacks.length === 0" class="empty-state">
      <div class="empty-icon">🔥</div>
      <p>暂无燃烧反馈</p>
    </div>

    <div v-else class="feedback-list">
      <div
        v-for="f in feedbacks"
        :key="f.id"
        class="feedback-card"
      >
        <div class="card-header">
          <div>
            <h3>{{ getRecipeName(f.recipeId) }}</h3>
            <p class="sub">制作批次 #{{ f.productionId.slice(0, 8) }}</p>
          </div>
          <span :class="['compliance-badge', isCompliant(f) ? 'pass' : 'fail']">
            {{ isCompliant(f) ? '达标' : '未达标' }}
          </span>
        </div>

        <div class="burn-time-compare">
          <div class="time-item">
            <span class="time-label">预计</span>
            <span class="time-value">{{ f.expectedBurnTime }}h</span>
          </div>
          <div class="time-arrow">→</div>
          <div class="time-item">
            <span class="time-label">实际</span>
            <span :class="['time-value', f.actualBurnTime < f.expectedBurnTime * 0.85 ? 'text-danger' : '']">
              {{ f.actualBurnTime }}h
            </span>
          </div>
          <div class="time-item">
            <span class="time-label">达标率</span>
            <span :class="['time-value rate', isCompliant(f) ? 'text-success' : 'text-danger']">
              {{ Math.round((f.actualBurnTime / f.expectedBurnTime) * 100) }}%
            </span>
          </div>
        </div>

        <div class="ratings">
          <div class="rating">
            <span class="rating-label">香气强度</span>
            <div class="stars">
              <span v-for="i in 5" :key="i" :class="['star', i <= f.scentStrength ? 'on' : '']">★</span>
            </div>
            <span class="rating-num">{{ f.scentStrength }}/5</span>
          </div>
          <div class="rating">
            <span class="rating-label">留香时长</span>
            <div class="stars">
              <span v-for="i in 5" :key="i" :class="['star', i <= f.scentDuration ? 'on' : '']">★</span>
            </div>
            <span class="rating-num">{{ f.scentDuration }}/5</span>
          </div>
        </div>

        <div v-if="f.comments" class="comments">
          <span class="section-icon">💬</span>
          <p>{{ f.comments }}</p>
        </div>

        <div v-if="f.optimizationSuggestion" class="suggestion">
          <span class="section-icon">💡</span>
          <div>
            <span class="sug-label">优化建议：</span>
            {{ f.optimizationSuggestion }}
          </div>
        </div>

        <div class="card-footer">
          <span class="date">{{ formatDate(f.createdAt) }}</span>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新增燃烧反馈</h3>
          <button class="close-btn" @click="showCreateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-item full">
              <label>关联制作记录</label>
              <select v-model="form.productionId" @change="onProductionChange">
                <option value="">请选择制作记录</option>
                <option v-for="p in productions" :key="p.id" :value="p.id">
                  {{ p.recipeName }} - {{ formatDate(p.createdAt) }} (#{{ p.id.slice(0, 8) }})
                </option>
              </select>
            </div>

            <div class="form-item">
              <label>预计燃烧时长 (h)</label>
              <input v-model.number="form.expectedBurnTime" type="number" min="0" />
            </div>
            <div class="form-item">
              <label>实际燃烧时长 (h)</label>
              <input v-model.number="form.actualBurnTime" type="number" min="0" />
            </div>

            <div class="form-item">
              <label>香气强度 (1-5)</label>
              <div class="star-input">
                <button
                  v-for="i in 5"
                  :key="i"
                  type="button"
                  :class="['star-btn', i <= form.scentStrength ? 'on' : '']"
                  @click="form.scentStrength = i"
                >★</button>
              </div>
            </div>
            <div class="form-item">
              <label>留香时长 (1-5)</label>
              <div class="star-input">
                <button
                  v-for="i in 5"
                  :key="i"
                  type="button"
                  :class="['star-btn', i <= form.scentDuration ? 'on' : '']"
                  @click="form.scentDuration = i"
                >★</button>
              </div>
            </div>

            <div class="form-item full">
              <label>燃烧评价</label>
              <textarea v-model="form.comments" rows="2" placeholder="描述燃烧过程中的表现..."></textarea>
            </div>

            <div class="form-item full">
              <label>优化建议（可选）</label>
              <textarea v-model="form.optimizationSuggestion" rows="2" placeholder="针对配方或工艺的改进建议..."></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showCreateModal = false">取消</button>
          <button class="btn btn-primary" @click="submit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { feedbackApi, BurnFeedback } from '@/api/feedback';
import { productionApi, ProductionRecord } from '@/api/production';
import { recipeApi, Recipe } from '@/api/recipe';

const feedbacks = ref<BurnFeedback[]>([]);
const productions = ref<ProductionRecord[]>([]);
const recipes = ref<Recipe[]>([]);
const showCreateModal = ref(false);

const defaultForm = () => ({
  productionId: '',
  recipeId: '',
  actualBurnTime: 0,
  expectedBurnTime: 0,
  scentStrength: 4,
  scentDuration: 4,
  comments: '',
  optimizationSuggestion: '',
});

const form = ref(defaultForm());

const loadData = async () => {
  feedbacks.value = await feedbackApi.findAll();
  productions.value = await productionApi.findAll();
  recipes.value = await recipeApi.findAll();
};

const getRecipeName = (recipeId: string) => {
  return recipes.value.find((r) => r.id === recipeId)?.name || '未知配方';
};

const isCompliant = (f: BurnFeedback) => {
  return f.actualBurnTime / f.expectedBurnTime >= 0.85;
};

const onProductionChange = () => {
  const prod = productions.value.find((p) => p.id === form.value.productionId);
  if (prod) {
    form.value.recipeId = prod.recipeId;
    const recipe = recipes.value.find((r) => r.id === prod.recipeId);
    if (recipe) {
      form.value.expectedBurnTime = recipe.burnTimeEstimate;
    }
  }
};

const submit = async () => {
  if (!form.value.productionId || !form.value.recipeId) {
    alert('请选择制作记录');
    return;
  }
  if (!form.value.actualBurnTime || !form.value.expectedBurnTime) {
    alert('请填写燃烧时长');
    return;
  }
  try {
    await feedbackApi.create(form.value);
    showCreateModal.value = false;
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
</script>

<style scoped>
.feedbacks-page {
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

.feedback-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 18px;
}

.feedback-card {
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
  background: linear-gradient(135deg, #fff0e8, #fbe0cc);
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

.compliance-badge {
  padding: 4px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.compliance-badge.pass {
  background: #dcfce7;
  color: #166534;
}

.compliance-badge.fail {
  background: #fee2e2;
  color: #991b1b;
}

.burn-time-compare {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: space-around;
  border-bottom: 1px solid var(--border);
}

.time-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.time-label {
  font-size: 12px;
  color: var(--text-light);
}

.time-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-dark);
}

.time-value.rate {
  font-size: 18px;
}

.time-arrow {
  color: var(--accent);
  font-size: 20px;
}

.text-danger {
  color: var(--danger);
}

.text-success {
  color: var(--success);
}

.ratings {
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-bottom: 1px solid var(--border);
}

.rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-label {
  font-size: 13px;
  color: var(--text-light);
  min-width: 70px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 18px;
  color: var(--border);
}

.star.on {
  color: #f59e0b;
}

.rating-num {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
}

.comments,
.suggestion {
  padding: 14px 20px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  border-bottom: 1px solid var(--border);
}

.section-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.comments p {
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
}

.suggestion {
  background: #fffbeb;
}

.sug-label {
  font-weight: 600;
  color: var(--warning);
  font-size: 13px;
}

.suggestion div {
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
}

.card-footer {
  padding: 12px 20px;
}

.date {
  font-size: 12px;
  color: var(--text-light);
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
  max-width: 560px;
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

.star-input {
  display: flex;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--border);
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.star-btn.on {
  color: #f59e0b;
}
</style>
