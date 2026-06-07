<template>
  <div class="recipes-page">
    <div class="page-header">
      <div class="filter-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索配方名称、香调..."
          class="search-input"
        />
        <select v-model="filterSeason" class="filter-select">
          <option value="">全部季节</option>
          <option v-for="s in seasons" :key="s" :value="s">{{ s }}</option>
        </select>
        <select v-model="filterWax" class="filter-select">
          <option value="">全部蜡基</option>
          <option v-for="w in waxBases" :key="w" :value="w">{{ w }}</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="showCreateModal = true">
        <span class="btn-icon">+</span> 新建配方
      </button>
    </div>

    <div class="recipe-grid">
      <div
        v-for="recipe in filteredRecipes"
        :key="recipe.id"
        class="recipe-card"
      >
        <div class="card-header">
          <h3 class="recipe-name">{{ recipe.name }}</h3>
          <span class="optimize-badge">优化 {{ recipe.optimizationCount }} 次</span>
        </div>
        <p class="recipe-desc">{{ recipe.description }}</p>

        <div class="recipe-section">
          <span class="section-label">🕯️ 蜡基</span>
          <span class="tag">{{ recipe.waxBase }}</span>
        </div>

        <div class="recipe-section">
          <span class="section-label">⏱️ 预计燃烧</span>
          <span class="highlight">{{ recipe.burnTimeEstimate }} 小时</span>
        </div>

        <div class="recipe-section layers">
          <span class="section-label">🌸 香调层次</span>
          <div class="layers-list">
            <div
              v-for="layer in recipe.scentLayers"
              :key="layer.layer"
              class="layer-item"
            >
              <span class="layer-name">{{ layer.layer }}</span>
              <span class="layer-note">{{ layer.note }}</span>
            </div>
          </div>
        </div>

        <div class="recipe-section">
          <span class="section-label">🧪 精油配比</span>
          <div class="oils-list">
            <span v-for="oil in recipe.essentialOils" :key="oil.name" class="tag">
              {{ oil.name }} {{ oil.percentage }}%
            </span>
          </div>
        </div>

        <div class="recipe-section">
          <span class="section-label">🎯 适用场景</span>
          <div class="tags-wrap">
            <span v-for="s in recipe.scenarios" :key="s" class="tag tag-light">{{ s }}</span>
          </div>
        </div>

        <div class="recipe-section">
          <span class="section-label">🌤️ 适用季节</span>
          <div class="tags-wrap">
            <span v-for="s in recipe.seasons" :key="s" class="tag tag-season">{{ s }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn btn-sm btn-outline" @click="viewDetail(recipe)">查看详情</button>
          <button class="btn btn-sm btn-outline" @click="editRecipe(recipe)">编辑</button>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal || editingRecipe" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ editingRecipe ? '编辑配方' : '新建配方' }}</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-item full">
              <label>配方名称</label>
              <input v-model="form.name" type="text" placeholder="如：静谧森林" />
            </div>

            <div class="form-item">
              <label>蜡基类型</label>
              <select v-model="form.waxBase">
                <option value="">请选择蜡基</option>
                <option v-for="w in waxBases" :key="w" :value="w">{{ w }}</option>
              </select>
            </div>

            <div class="form-item">
              <label>预计燃烧时长（小时）</label>
              <input v-model.number="form.burnTimeEstimate" type="number" min="1" />
            </div>

            <div class="form-item full">
              <label>配方描述</label>
              <textarea v-model="form.description" rows="2" placeholder="描述这款香薰的意境..."></textarea>
            </div>

            <div class="form-item full">
              <div class="sub-section">
                <label>香调层次</label>
                <button class="btn btn-xs btn-outline" @click="addLayer">+ 添加层次</button>
              </div>
              <div v-for="(layer, idx) in form.scentLayers" :key="idx" class="nested-form">
                <select v-model="layer.layer">
                  <option value="前调">前调</option>
                  <option value="中调">中调</option>
                  <option value="后调">后调</option>
                </select>
                <input v-model="layer.note" placeholder="香调名称" />
                <input v-model="layer.description" placeholder="描述" style="flex: 2" />
                <button class="btn-danger-sm" @click="form.scentLayers.splice(idx, 1)">×</button>
              </div>
            </div>

            <div class="form-item full">
              <div class="sub-section">
                <label>精油配比（总和应为100%）</label>
                <button class="btn btn-xs btn-outline" @click="addOil">+ 添加精油</button>
              </div>
              <div v-for="(oil, idx) in form.essentialOils" :key="idx" class="nested-form">
                <input v-model="oil.name" placeholder="精油名称" style="flex: 1" />
                <input v-model.number="oil.percentage" type="number" placeholder="比例%" style="width: 100px" min="0" max="100" />
                <button class="btn-danger-sm" @click="form.essentialOils.splice(idx, 1)">×</button>
              </div>
              <div class="form-hint">
                当前总和：<span :class="{ 'text-danger': oilTotal !== 100 }">{{ oilTotal }}%</span>
              </div>
            </div>

            <div class="form-item full">
              <label>适用场景（可多选）</label>
              <div class="checkbox-group">
                <label v-for="s in scenarios" :key="s" class="checkbox-item">
                  <input type="checkbox" :value="s" v-model="form.scenarios" />
                  {{ s }}
                </label>
              </div>
            </div>

            <div class="form-item full">
              <label>适用季节（可多选）</label>
              <div class="checkbox-group">
                <label v-for="s in seasons" :key="s" class="checkbox-item">
                  <input type="checkbox" :value="s" v-model="form.seasons" />
                  {{ s }}
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveRecipe">保存</button>
        </div>
      </div>
    </div>

    <div v-if="viewingRecipe" class="modal-overlay" @click.self="viewingRecipe = null">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ viewingRecipe.name }}</h3>
          <button class="close-btn" @click="viewingRecipe = null">×</button>
        </div>
        <div class="modal-body">
          <p class="recipe-desc">{{ viewingRecipe.description }}</p>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">蜡基</span>
              <span>{{ viewingRecipe.waxBase }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">预计燃烧</span>
              <span>{{ viewingRecipe.burnTimeEstimate }} 小时</span>
            </div>
            <div class="detail-item full">
              <span class="detail-label">香调层次</span>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px">
                <div v-for="l in viewingRecipe.scentLayers" :key="l.layer">
                  <strong>{{ l.layer }} · {{ l.note }}：</strong>{{ l.description }}
                </div>
              </div>
            </div>
            <div class="detail-item full">
              <span class="detail-label">精油配比</span>
              <div class="tags-wrap" style="margin-top: 8px">
                <span v-for="o in viewingRecipe.essentialOils" :key="o.name" class="tag">
                  {{ o.name }} {{ o.percentage }}%
                </span>
              </div>
            </div>
            <div class="detail-item full">
              <span class="detail-label">适用场景</span>
              <div class="tags-wrap" style="margin-top: 8px">
                <span v-for="s in viewingRecipe.scenarios" :key="s" class="tag tag-light">{{ s }}</span>
              </div>
            </div>
            <div class="detail-item full">
              <span class="detail-label">适用季节</span>
              <div class="tags-wrap" style="margin-top: 8px">
                <span v-for="s in viewingRecipe.seasons" :key="s" class="tag tag-season">{{ s }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { recipeApi, Recipe, ScentLayer, EssentialOil } from '@/api/recipe';

const recipes = ref<Recipe[]>([]);
const searchQuery = ref('');
const filterSeason = ref('');
const filterWax = ref('');
const showCreateModal = ref(false);
const editingRecipe = ref<Recipe | null>(null);
const viewingRecipe = ref<Recipe | null>(null);

const waxBases = ['大豆蜡', '蜂蜡', '椰子蜡', '石蜡混合', '棕榈蜡'];
const seasons = ['春季', '夏季', '秋季', '冬季', '四季皆宜'];
const scenarios = ['卧室助眠', '工作专注', '瑜伽冥想', '浪漫约会', '家庭聚会', '书房阅读', '沐浴放松'];

const defaultForm = () => ({
  name: '',
  waxBase: '',
  burnTimeEstimate: 24,
  description: '',
  scentLayers: [
    { layer: '前调', note: '', description: '' },
    { layer: '中调', note: '', description: '' },
    { layer: '后调', note: '', description: '' },
  ] as ScentLayer[],
  essentialOils: [{ name: '', percentage: 0 }] as EssentialOil[],
  scenarios: [] as string[],
  seasons: [] as string[],
});

const form = ref(defaultForm());

const oilTotal = computed(() =>
  form.value.essentialOils.reduce((sum, o) => sum + (Number(o.percentage) || 0), 0),
);

const filteredRecipes = computed(() => {
  return recipes.value.filter((r) => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchScent = r.scentLayers.some((l) => l.note.toLowerCase().includes(q));
      if (!matchName && !matchScent) return false;
    }
    if (filterSeason.value && !r.seasons.includes(filterSeason.value) && !r.seasons.includes('四季皆宜')) {
      return false;
    }
    if (filterWax.value && r.waxBase !== filterWax.value) return false;
    return true;
  });
});

const loadData = async () => {
  recipes.value = await recipeApi.findAll();
};

const addLayer = () => {
  form.value.scentLayers.push({ layer: '前调', note: '', description: '' });
};

const addOil = () => {
  form.value.essentialOils.push({ name: '', percentage: 0 });
};

const viewDetail = (recipe: Recipe) => {
  viewingRecipe.value = recipe;
};

const editRecipe = (recipe: Recipe) => {
  editingRecipe.value = recipe;
  form.value = {
    name: recipe.name,
    waxBase: recipe.waxBase,
    burnTimeEstimate: recipe.burnTimeEstimate,
    description: recipe.description,
    scentLayers: JSON.parse(JSON.stringify(recipe.scentLayers)),
    essentialOils: JSON.parse(JSON.stringify(recipe.essentialOils)),
    scenarios: [...recipe.scenarios],
    seasons: [...recipe.seasons],
  };
};

const closeModal = () => {
  showCreateModal.value = false;
  editingRecipe.value = null;
  form.value = defaultForm();
};

const saveRecipe = async () => {
  if (!form.value.name || !form.value.waxBase) {
    alert('请填写配方名称和蜡基类型');
    return;
  }
  try {
    if (editingRecipe.value) {
      await recipeApi.update(editingRecipe.value.id, form.value);
    } else {
      await recipeApi.create(form.value);
    }
    await loadData();
    closeModal();
  } catch (e) {
    alert('保存失败');
  }
};

onMounted(loadData);
</script>

<style scoped>
.recipes-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-size: 14px;
  color: var(--text);
  outline: none;
  transition: border 0.2s;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.search-input:focus,
.filter-select:focus {
  border-color: var(--primary);
}

.filter-select {
  min-width: 140px;
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
  color: var(--primary);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-xs {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-icon {
  font-size: 16px;
  font-weight: bold;
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.recipe-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.recipe-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.recipe-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-dark);
}

.optimize-badge {
  background: var(--bg-warm);
  color: var(--primary);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
}

.recipe-desc {
  color: var(--text-light);
  font-size: 13px;
  line-height: 1.6;
}

.recipe-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.section-label {
  font-size: 13px;
  color: var(--text-light);
  min-width: 80px;
  flex-shrink: 0;
}

.highlight {
  color: var(--primary);
  font-weight: 600;
  font-size: 14px;
}

.layers-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.layer-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.layer-name {
  color: var(--primary);
  font-weight: 500;
  min-width: 36px;
}

.layer-note {
  color: var(--text);
}

.oils-list,
.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.tag {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  color: var(--primary-dark);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tag-light {
  background: var(--bg-warm);
  color: var(--text);
}

.tag-season {
  background: #e8f0e4;
  color: var(--success);
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border);
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

.modal-lg {
  max-width: 780px;
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
  line-height: 1;
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

.nested-form input,
.nested-form select {
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

.form-hint {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
}

.text-danger {
  color: var(--danger);
  font-weight: 600;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 12px;
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

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 12px;
  color: var(--text-light);
  font-weight: 500;
}
</style>
