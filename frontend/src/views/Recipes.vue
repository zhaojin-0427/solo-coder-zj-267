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
      <button class="btn btn-primary" @click="openCreateRecipe">
        <span class="btn-icon">+</span> 新建配方
      </button>
    </div>

    <div v-if="recipes.length === 0" class="empty-state">
      <div class="empty-icon">🕯️</div>
      <p>暂无配方，点击右上角新建第一个配方</p>
    </div>

    <div v-else class="recipe-grid">
      <div
        v-for="recipe in filteredRecipes"
        :key="recipe.id"
        class="recipe-card"
      >
        <div class="card-header">
          <div>
            <h3 class="recipe-name">{{ recipe.name }}</h3>
            <div class="card-meta">
              <span class="version-badge">{{ getDisplayVersion(recipe).version }}</span>
              <span class="meta-item">共 {{ recipe.versionCount || 0 }} 个版本</span>
              <span v-if="recipe.recentComplianceRate !== undefined" class="meta-item highlight">
                达标率 {{ recipe.recentComplianceRate }}%
              </span>
            </div>
          </div>
          <span v-if="recipe.recentComplianceRate !== undefined" class="rate-badge" :class="getRateClass(recipe.recentComplianceRate)">
            {{ recipe.recentComplianceRate }}%
          </span>
        </div>
        <p class="recipe-desc">{{ getDisplayVersion(recipe).description || '暂无描述' }}</p>

        <div class="recipe-section">
          <span class="section-label">🕯️ 蜡基</span>
          <span class="tag">{{ getDisplayVersion(recipe).waxBase }}</span>
        </div>

        <div class="recipe-section">
          <span class="section-label">⏱️ 预计燃烧</span>
          <span class="highlight">{{ getDisplayVersion(recipe).burnTimeEstimate }} 小时</span>
        </div>

        <div class="recipe-section layers">
          <span class="section-label">🌸 香调层次</span>
          <div class="layers-list">
            <div
              v-for="layer in getDisplayVersion(recipe).scentLayers"
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
            <span v-for="oil in getDisplayVersion(recipe).essentialOils" :key="oil.name" class="tag">
              {{ oil.name }} {{ oil.percentage }}%
            </span>
          </div>
        </div>

        <div class="recipe-section">
          <span class="section-label">🎯 适用场景</span>
          <div class="tags-wrap">
            <span v-for="s in getDisplayVersion(recipe).scenarios" :key="s" class="tag tag-light">{{ s }}</span>
          </div>
        </div>

        <div class="recipe-section">
          <span class="section-label">🌤️ 适用季节</span>
          <div class="tags-wrap">
            <span v-for="s in getDisplayVersion(recipe).seasons" :key="s" class="tag tag-season">{{ s }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn btn-sm btn-outline" @click="viewDetail(recipe)">查看详情</button>
          <button class="btn btn-sm btn-outline" @click="openVersionHistory(recipe)">版本历史</button>
          <button class="btn btn-sm btn-outline" @click="openCreateVersion(recipe)">新建版本</button>
          <button class="btn btn-sm btn-outline" @click="openEditName(recipe)">重命名</button>
          <button class="btn btn-sm btn-outline btn-danger-outline" @click="removeRecipe(recipe)">删除</button>
        </div>
      </div>
    </div>

    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ detailRecipe?.name }}
            <span v-if="detailVersion" class="version-badge-inline">{{ detailVersion.version }}</span>
            <span v-if="detailVersion" class="status-badge" :class="'status-' + detailVersion.status">
              {{ getStatusText(detailVersion.status) }}
            </span>
          </h3>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>
        <div class="modal-body" v-if="detailVersion">
          <p class="recipe-desc">{{ detailVersion.description || '暂无描述' }}</p>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">蜡基</span>
              <span>{{ detailVersion.waxBase }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">预计燃烧</span>
              <span>{{ detailVersion.burnTimeEstimate }} 小时</span>
            </div>
            <div v-if="detailVersion.complianceRate !== undefined" class="detail-item">
              <span class="detail-label">达标率</span>
              <span class="highlight">{{ detailVersion.complianceRate }}%</span>
            </div>
            <div v-if="detailVersion.totalFeedbacks !== undefined" class="detail-item">
              <span class="detail-label">反馈数</span>
              <span>{{ detailVersion.totalFeedbacks }}</span>
            </div>
            <div class="detail-item full">
              <span class="detail-label">香调层次</span>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px">
                <div v-for="l in detailVersion.scentLayers" :key="l.layer">
                  <strong>{{ l.layer }} · {{ l.note }}：</strong>{{ l.description }}
                </div>
              </div>
            </div>
            <div class="detail-item full">
              <span class="detail-label">精油配比</span>
              <div class="tags-wrap" style="margin-top: 8px">
                <span v-for="o in detailVersion.essentialOils" :key="o.name" class="tag">
                  {{ o.name }} {{ o.percentage }}%
                </span>
              </div>
            </div>
            <div class="detail-item full">
              <span class="detail-label">适用场景</span>
              <div class="tags-wrap" style="margin-top: 8px">
                <span v-for="s in detailVersion.scenarios" :key="s" class="tag tag-light">{{ s }}</span>
              </div>
            </div>
            <div class="detail-item full">
              <span class="detail-label">适用季节</span>
              <div class="tags-wrap" style="margin-top: 8px">
                <span v-for="s in detailVersion.seasons" :key="s" class="tag tag-season">{{ s }}</span>
              </div>
            </div>
            <div v-if="detailVersion.changeLog" class="detail-item full">
              <span class="detail-label">变更日志</span>
              <div class="changelog-box">{{ detailVersion.changeLog }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showVersionHistoryModal" class="modal-overlay" @click.self="closeVersionHistory">
      <div class="modal modal-xl">
        <div class="modal-header">
          <div>
            <h3>{{ historyRecipe?.name }} - 版本历史</h3>
            <p class="modal-subtitle">共 {{ versions.length }} 个版本</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center">
            <button class="btn btn-sm btn-outline" @click="openCreateVersionFromHistory">
              <span class="btn-icon">+</span> 新建版本
            </button>
            <button v-if="compareSelected.length === 2" class="btn btn-sm btn-primary" @click="openCompareModal">
              对比选中版本
            </button>
            <button v-if="compareSelected.length > 0" class="btn btn-sm btn-outline" @click="compareSelected = []">
              清除选择
            </button>
            <button class="close-btn" @click="closeVersionHistory">×</button>
          </div>
        </div>
        <div class="modal-body">
          <div v-if="versions.length === 0" class="empty-state-sm">
            <p>暂无版本记录</p>
          </div>
          <div v-else class="version-list">
            <div
              v-for="version in versions"
              :key="version.id"
              class="version-item"
              :class="{ 'version-selected': compareSelected.includes(version.id) }"
            >
              <div class="version-checkbox" @click="toggleCompareSelect(version.id)">
                <div class="checkbox-box" :class="{ checked: compareSelected.includes(version.id) }">
                  <span v-if="compareSelected.includes(version.id)">✓</span>
                </div>
              </div>
              <div class="version-main">
                <div class="version-header-row">
                  <span class="version-number">{{ version.version }}</span>
                  <span class="status-badge" :class="'status-' + version.status">
                    {{ getStatusText(version.status) }}
                  </span>
                  <span class="version-date">{{ formatDate(version.createdAt) }}</span>
                  <span v-if="version.complianceRate !== undefined" class="version-stat">
                    达标率 <strong :class="getRateClass(version.complianceRate)">{{ version.complianceRate }}%</strong>
                  </span>
                  <span v-if="version.totalFeedbacks !== undefined" class="version-stat">
                    反馈 <strong>{{ version.totalFeedbacks }}</strong>
                  </span>
                </div>
                <div v-if="version.changeLog" class="version-changelog">
                  <span class="changelog-label">变更：</span>{{ version.changeLog }}
                </div>
                <div class="version-summary">
                  <span class="tag">{{ version.waxBase }}</span>
                  <span class="tag">燃烧 {{ version.burnTimeEstimate }}h</span>
                  <span v-for="oil in version.essentialOils.slice(0, 3)" :key="oil.name" class="tag tag-light">
                    {{ oil.name }} {{ oil.percentage }}%
                  </span>
                </div>
                <div class="version-actions">
                  <button class="btn btn-xs btn-outline" @click="viewVersionDetail(version)">查看详情</button>
                  <button v-if="version.status === 'draft' || version.status === 'pending_review'" class="btn btn-xs btn-outline" @click="openEditVersion(version)">
                    编辑
                  </button>
                  <button v-if="version.status === 'pending_review'" class="btn btn-xs btn-success" @click="publishVersion(version)">
                    通过发布
                  </button>
                  <button v-if="version.status === 'pending_review'" class="btn btn-xs btn-danger-outline" @click="openRejectModal(version)">
                    拒绝归档
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCompareModal" class="modal-overlay" @click.self="closeCompareModal">
      <div class="modal modal-xxl">
        <div class="modal-header">
          <h3>版本对比</h3>
          <button class="close-btn" @click="closeCompareModal">×</button>
        </div>
        <div class="modal-body" v-if="compareV1 && compareV2">
          <div class="compare-header">
            <div class="compare-col">
              <div class="compare-version-title">
                <span class="version-number-lg">{{ compareV1.version }}</span>
                <span class="status-badge" :class="'status-' + compareV1.status">{{ getStatusText(compareV1.status) }}</span>
              </div>
              <div class="compare-version-sub">{{ formatDate(compareV1.createdAt) }}</div>
            </div>
            <div class="compare-arrow">→</div>
            <div class="compare-col">
              <div class="compare-version-title">
                <span class="version-number-lg">{{ compareV2.version }}</span>
                <span class="status-badge" :class="'status-' + compareV2.status">{{ getStatusText(compareV2.status) }}</span>
              </div>
              <div class="compare-version-sub">{{ formatDate(compareV2.createdAt) }}</div>
            </div>
          </div>

          <div class="compare-grid">
            <div class="compare-row">
              <div class="compare-label">版本号</div>
              <div class="compare-col-cell" :class="{ changed: compareV1.version !== compareV2.version }">{{ compareV1.version }}</div>
              <div class="compare-col-cell" :class="{ changed: compareV1.version !== compareV2.version }">{{ compareV2.version }}</div>
            </div>
            <div class="compare-row">
              <div class="compare-label">状态</div>
              <div class="compare-col-cell" :class="{ changed: compareV1.status !== compareV2.status }">
                <span class="status-badge" :class="'status-' + compareV1.status">{{ getStatusText(compareV1.status) }}</span>
              </div>
              <div class="compare-col-cell" :class="{ changed: compareV1.status !== compareV2.status }">
                <span class="status-badge" :class="'status-' + compareV2.status">{{ getStatusText(compareV2.status) }}</span>
              </div>
            </div>
            <div class="compare-row">
              <div class="compare-label">蜡基</div>
              <div class="compare-col-cell" :class="{ changed: compareV1.waxBase !== compareV2.waxBase }">{{ compareV1.waxBase }}</div>
              <div class="compare-col-cell" :class="{ changed: compareV1.waxBase !== compareV2.waxBase }">{{ compareV2.waxBase }}</div>
            </div>
            <div class="compare-row">
              <div class="compare-label">预计燃烧时长</div>
              <div class="compare-col-cell" :class="{ changed: compareV1.burnTimeEstimate !== compareV2.burnTimeEstimate }">{{ compareV1.burnTimeEstimate }} 小时</div>
              <div class="compare-col-cell" :class="{ changed: compareV1.burnTimeEstimate !== compareV2.burnTimeEstimate }">{{ compareV2.burnTimeEstimate }} 小时</div>
            </div>
            <div class="compare-row">
              <div class="compare-label">描述</div>
              <div class="compare-col-cell" :class="{ changed: compareV1.description !== compareV2.description }">{{ compareV1.description || '-' }}</div>
              <div class="compare-col-cell" :class="{ changed: compareV1.description !== compareV2.description }">{{ compareV2.description || '-' }}</div>
            </div>
            <div class="compare-row">
              <div class="compare-label">变更日志</div>
              <div class="compare-col-cell" :class="{ changed: compareV1.changeLog !== compareV2.changeLog }">{{ compareV1.changeLog || '-' }}</div>
              <div class="compare-col-cell" :class="{ changed: compareV1.changeLog !== compareV2.changeLog }">{{ compareV2.changeLog || '-' }}</div>
            </div>
            <div class="compare-row">
              <div class="compare-label">适用场景</div>
              <div class="compare-col-cell" :class="{ changed: JSON.stringify(compareV1.scenarios) !== JSON.stringify(compareV2.scenarios) }">
                <div class="tags-wrap">
                  <span v-for="s in compareV1.scenarios" :key="s" class="tag tag-light">{{ s }}</span>
                </div>
              </div>
              <div class="compare-col-cell" :class="{ changed: JSON.stringify(compareV1.scenarios) !== JSON.stringify(compareV2.scenarios) }">
                <div class="tags-wrap">
                  <span v-for="s in compareV2.scenarios" :key="s" class="tag tag-light">{{ s }}</span>
                </div>
              </div>
            </div>
            <div class="compare-row">
              <div class="compare-label">适用季节</div>
              <div class="compare-col-cell" :class="{ changed: JSON.stringify(compareV1.seasons) !== JSON.stringify(compareV2.seasons) }">
                <div class="tags-wrap">
                  <span v-for="s in compareV1.seasons" :key="s" class="tag tag-season">{{ s }}</span>
                </div>
              </div>
              <div class="compare-col-cell" :class="{ changed: JSON.stringify(compareV1.seasons) !== JSON.stringify(compareV2.seasons) }">
                <div class="tags-wrap">
                  <span v-for="s in compareV2.seasons" :key="s" class="tag tag-season">{{ s }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="compare-section">
            <h4>精油配比对比</h4>
            <div class="oil-compare-table">
              <div v-for="oil in mergedOils" :key="oil.name" class="oil-compare-row">
                <div class="oil-name">{{ oil.name }}</div>
                <div class="oil-col" :class="getOilDiffClass(oil.v1, oil.v2)">
                  {{ oil.v1 !== undefined ? oil.v1 + '%' : '-' }}
                  <span v-if="oil.v1 !== undefined && oil.v2 !== undefined && oil.v1 !== oil.v2" class="oil-diff" :class="oil.v2 > oil.v1 ? 'diff-up' : 'diff-down'">
                    {{ oil.v2 > oil.v1 ? '+' : '' }}{{ (oil.v2 - oil.v1).toFixed(1) }}%
                  </span>
                </div>
                <div class="oil-col" :class="getOilDiffClass(oil.v1, oil.v2)">
                  {{ oil.v2 !== undefined ? oil.v2 + '%' : '-' }}
                </div>
              </div>
            </div>
          </div>

          <div class="compare-section">
            <h4>香调层次对比</h4>
            <div class="layer-compare-table">
              <div v-for="layer in mergedLayers" :key="layer.layer" class="layer-compare-row">
                <div class="layer-name">{{ layer.layer }}</div>
                <div class="layer-col" :class="{ changed: JSON.stringify(layer.v1) !== JSON.stringify(layer.v2) }">
                  <template v-if="layer.v1">
                    <strong>{{ layer.v1.note }}</strong>
                    <p v-if="layer.v1.description">{{ layer.v1.description }}</p>
                  </template>
                  <span v-else class="text-light">-</span>
                </div>
                <div class="layer-col" :class="{ changed: JSON.stringify(layer.v1) !== JSON.stringify(layer.v2) }">
                  <template v-if="layer.v2">
                    <strong>{{ layer.v2.note }}</strong>
                    <p v-if="layer.v2.description">{{ layer.v2.description }}</p>
                  </template>
                  <span v-else class="text-light">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ formTitle }}</h3>
          <button class="close-btn" @click="closeFormModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div v-if="formMode === 'create_recipe'" class="form-item full">
              <label>配方名称</label>
              <input v-model="form.recipeName" type="text" placeholder="如：静谧森林" />
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
              <label>变更日志</label>
              <textarea v-model="form.changeLog" rows="2" placeholder="描述本次版本的变更内容..."></textarea>
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
          <button class="btn btn-outline" @click="closeFormModal">取消</button>
          <template v-if="formMode !== 'edit_version'">
            <button class="btn btn-outline" @click="submitForm('draft')">保存为草稿</button>
            <button class="btn btn-outline" @click="submitForm('pending_review')">提交审核</button>
            <button class="btn btn-primary" @click="submitForm('published')">立即发布</button>
          </template>
          <template v-else>
            <button class="btn btn-primary" @click="submitForm(null)">保存修改</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="showEditNameModal" class="modal-overlay" @click.self="closeEditNameModal">
      <div class="modal">
        <div class="modal-header">
          <h3>重命名配方</h3>
          <button class="close-btn" @click="closeEditNameModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item full">
            <label>配方名称</label>
            <input v-model="editNameValue" type="text" placeholder="输入新的配方名称" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeEditNameModal">取消</button>
          <button class="btn btn-primary" @click="saveRecipeName">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
      <div class="modal">
        <div class="modal-header">
          <h3>拒绝并归档版本</h3>
          <button class="close-btn" @click="closeRejectModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item full">
            <label>审核备注（必填）</label>
            <textarea v-model="rejectNote" rows="3" placeholder="请说明拒绝的原因..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeRejectModal">取消</button>
          <button class="btn btn-primary btn-danger" @click="confirmReject">确认拒绝</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { recipeApi, Recipe, RecipeVersion, ScentLayer, EssentialOil, VersionStatus } from '@/api/recipe';

const recipes = ref<Recipe[]>([]);
const recipeVersionCache = ref<Map<string, RecipeVersion[]>>(new Map());
const searchQuery = ref('');
const filterSeason = ref('');
const filterWax = ref('');

const waxBases = ['大豆蜡', '蜂蜡', '椰子蜡', '石蜡混合', '棕榈蜡'];
const seasons = ['春季', '夏季', '秋季', '冬季', '四季皆宜'];
const scenarios = ['卧室助眠', '工作专注', '瑜伽冥想', '浪漫约会', '家庭聚会', '书房阅读', '沐浴放松'];

const showDetailModal = ref(false);
const detailRecipe = ref<Recipe | null>(null);
const detailVersion = ref<RecipeVersion | null>(null);

const showVersionHistoryModal = ref(false);
const historyRecipe = ref<Recipe | null>(null);
const versions = ref<RecipeVersion[]>([]);
const compareSelected = ref<string[]>([]);

const showCompareModal = ref(false);
const compareV1 = ref<RecipeVersion | null>(null);
const compareV2 = ref<RecipeVersion | null>(null);

const showFormModal = ref(false);
type FormMode = 'create_recipe' | 'create_version' | 'edit_version';
const formMode = ref<FormMode>('create_recipe');
const formBaseVersion = ref<RecipeVersion | null>(null);
const editingVersionId = ref<string | null>(null);
const editingRecipeForVersion = ref<Recipe | null>(null);

const showEditNameModal = ref(false);
const editingNameRecipe = ref<Recipe | null>(null);
const editNameValue = ref('');

const showRejectModal = ref(false);
const rejectingVersion = ref<RecipeVersion | null>(null);
const rejectNote = ref('');

interface VersionForm {
  recipeName: string;
  waxBase: string;
  burnTimeEstimate: number;
  description: string;
  changeLog: string;
  scentLayers: ScentLayer[];
  essentialOils: EssentialOil[];
  scenarios: string[];
  seasons: string[];
}

const defaultForm = (): VersionForm => ({
  recipeName: '',
  waxBase: '',
  burnTimeEstimate: 24,
  description: '',
  changeLog: '',
  scentLayers: [
    { layer: '前调', note: '', description: '' },
    { layer: '中调', note: '', description: '' },
    { layer: '后调', note: '', description: '' },
  ],
  essentialOils: [{ name: '', percentage: 0 }],
  scenarios: [],
  seasons: [],
});

const form = ref<VersionForm>(defaultForm());

const oilTotal = computed(() =>
  form.value.essentialOils.reduce((sum, o) => sum + (Number(o.percentage) || 0), 0),
);

const formTitle = computed(() => {
  switch (formMode.value) {
    case 'create_recipe':
      return '新建配方';
    case 'create_version':
      return '新建版本';
    case 'edit_version':
      return '编辑版本';
    default:
      return '';
  }
});

const mergedOils = computed(() => {
  if (!compareV1.value || !compareV2.value) return [];
  const names = new Set<string>();
  compareV1.value.essentialOils.forEach((o) => names.add(o.name));
  compareV2.value.essentialOils.forEach((o) => names.add(o.name));
  return Array.from(names).map((name) => ({
    name,
    v1: compareV1.value?.essentialOils.find((o) => o.name === name)?.percentage,
    v2: compareV2.value?.essentialOils.find((o) => o.name === name)?.percentage,
  }));
});

const mergedLayers = computed(() => {
  if (!compareV1.value || !compareV2.value) return [];
  const layerNames = ['前调', '中调', '后调'];
  return layerNames.map((layer) => ({
    layer,
    v1: compareV1.value?.scentLayers.find((l) => l.layer === layer),
    v2: compareV2.value?.scentLayers.find((l) => l.layer === layer),
  }));
});

const filteredRecipes = computed(() => {
  return recipes.value.filter((r) => {
    const v = getDisplayVersion(r);
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchScent = v.scentLayers.some((l) => l.note.toLowerCase().includes(q));
      const matchDesc = (v.description || '').toLowerCase().includes(q);
      if (!matchName && !matchScent && !matchDesc) return false;
    }
    if (filterSeason.value && !v.seasons.includes(filterSeason.value) && !v.seasons.includes('四季皆宜')) {
      return false;
    }
    if (filterWax.value && v.waxBase !== filterWax.value) return false;
    return true;
  });
});

function getDisplayVersion(recipe: Recipe): RecipeVersion {
  if (recipe.currentVersion) {
    return recipe.currentVersion;
  }
  const cached = recipeVersionCache.value.get(recipe.id);
  if (cached && cached.length > 0) {
    return cached[0];
  }
  return {
    id: '',
    recipeId: recipe.id,
    version: '-',
    status: 'draft' as VersionStatus,
    waxBase: '-',
    essentialOils: [],
    scentLayers: [],
    burnTimeEstimate: 0,
    scenarios: [],
    seasons: [],
    description: '',
    changeLog: '',
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
}

function getStatusText(status: VersionStatus): string {
  const map: Record<VersionStatus, string> = {
    draft: '草稿',
    pending_review: '待审核',
    published: '已发布',
    archived: '已归档',
  };
  return map[status] || status;
}

function getRateClass(rate: number): string {
  if (rate >= 80) return 'rate-good';
  if (rate >= 60) return 'rate-medium';
  return 'rate-poor';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getOilDiffClass(v1: number | undefined, v2: number | undefined): string {
  if (v1 === undefined || v2 === undefined) return 'oil-changed';
  if (v1 === v2) return '';
  return 'oil-changed';
}

const loadData = async () => {
  recipes.value = await recipeApi.findAll();
};

function addLayer() {
  form.value.scentLayers.push({ layer: '前调', note: '', description: '' });
}

function addOil() {
  form.value.essentialOils.push({ name: '', percentage: 0 });
}

function viewDetail(recipe: Recipe) {
  detailRecipe.value = recipe;
  detailVersion.value = getDisplayVersion(recipe);
  showDetailModal.value = true;
}

function viewVersionDetail(version: RecipeVersion) {
  detailRecipe.value = historyRecipe.value;
  detailVersion.value = version;
  showDetailModal.value = true;
}

function closeDetailModal() {
  showDetailModal.value = false;
  detailRecipe.value = null;
  detailVersion.value = null;
}

async function openVersionHistory(recipe: Recipe) {
  historyRecipe.value = recipe;
  compareSelected.value = [];
  try {
    versions.value = await recipeApi.findVersions(recipe.id);
    recipeVersionCache.value.set(recipe.id, versions.value);
  } catch (e) {
    versions.value = [];
  }
  showVersionHistoryModal.value = true;
}

function closeVersionHistory() {
  showVersionHistoryModal.value = false;
  historyRecipe.value = null;
  versions.value = [];
  compareSelected.value = [];
}

function toggleCompareSelect(versionId: string) {
  const idx = compareSelected.value.indexOf(versionId);
  if (idx >= 0) {
    compareSelected.value.splice(idx, 1);
  } else if (compareSelected.value.length < 2) {
    compareSelected.value.push(versionId);
  }
}

function openCompareModal() {
  if (compareSelected.value.length !== 2) return;
  const v1 = versions.value.find((v) => v.id === compareSelected.value[0]);
  const v2 = versions.value.find((v) => v.id === compareSelected.value[1]);
  if (!v1 || !v2) return;
  compareV1.value = v1;
  compareV2.value = v2;
  showCompareModal.value = true;
}

function closeCompareModal() {
  showCompareModal.value = false;
  compareV1.value = null;
  compareV2.value = null;
}

function openCreateRecipe() {
  formMode.value = 'create_recipe';
  formBaseVersion.value = null;
  editingVersionId.value = null;
  editingRecipeForVersion.value = null;
  form.value = defaultForm();
  showFormModal.value = true;
}

function openCreateVersion(recipe: Recipe) {
  formMode.value = 'create_version';
  editingRecipeForVersion.value = recipe;
  editingVersionId.value = null;
  const base = getDisplayVersion(recipe);
  formBaseVersion.value = base.id ? base : null;
  form.value = {
    recipeName: recipe.name,
    waxBase: base.waxBase || '',
    burnTimeEstimate: base.burnTimeEstimate || 24,
    description: base.description || '',
    changeLog: '',
    scentLayers: JSON.parse(JSON.stringify(base.scentLayers || [])),
    essentialOils: JSON.parse(JSON.stringify(base.essentialOils || [])),
    scenarios: [...(base.scenarios || [])],
    seasons: [...(base.seasons || [])],
  };
  if (form.value.scentLayers.length === 0) {
    form.value.scentLayers = [
      { layer: '前调', note: '', description: '' },
      { layer: '中调', note: '', description: '' },
      { layer: '后调', note: '', description: '' },
    ];
  }
  if (form.value.essentialOils.length === 0) {
    form.value.essentialOils = [{ name: '', percentage: 0 }];
  }
  showFormModal.value = true;
}

function openCreateVersionFromHistory() {
  if (!historyRecipe.value) return;
  const published = versions.value.filter((v) => v.status === 'published');
  const latest = published.length > 0 ? published[0] : versions.value[0];
  formMode.value = 'create_version';
  editingRecipeForVersion.value = historyRecipe.value;
  editingVersionId.value = null;
  formBaseVersion.value = latest || null;
  if (latest) {
    form.value = {
      recipeName: historyRecipe.value.name,
      waxBase: latest.waxBase || '',
      burnTimeEstimate: latest.burnTimeEstimate || 24,
      description: latest.description || '',
      changeLog: '',
      scentLayers: JSON.parse(JSON.stringify(latest.scentLayers || [])),
      essentialOils: JSON.parse(JSON.stringify(latest.essentialOils || [])),
      scenarios: [...(latest.scenarios || [])],
      seasons: [...(latest.seasons || [])],
    };
  } else {
    form.value = defaultForm();
    form.value.recipeName = historyRecipe.value.name;
  }
  showFormModal.value = true;
}

function openEditVersion(version: RecipeVersion) {
  formMode.value = 'edit_version';
  editingVersionId.value = version.id;
  formBaseVersion.value = null;
  const recipe = historyRecipe.value || recipes.value.find((r) => r.id === version.recipeId);
  editingRecipeForVersion.value = recipe || null;
  form.value = {
    recipeName: recipe?.name || '',
    waxBase: version.waxBase,
    burnTimeEstimate: version.burnTimeEstimate,
    description: version.description,
    changeLog: version.changeLog,
    scentLayers: JSON.parse(JSON.stringify(version.scentLayers)),
    essentialOils: JSON.parse(JSON.stringify(version.essentialOils)),
    scenarios: [...version.scenarios],
    seasons: [...version.seasons],
  };
  showFormModal.value = true;
}

function closeFormModal() {
  showFormModal.value = false;
  formMode.value = 'create_recipe';
  formBaseVersion.value = null;
  editingVersionId.value = null;
  editingRecipeForVersion.value = null;
  form.value = defaultForm();
}

async function submitForm(status: VersionStatus | null) {
  if (formMode.value === 'create_recipe' && !form.value.recipeName) {
    alert('请填写配方名称');
    return;
  }
  if (!form.value.waxBase) {
    alert('请选择蜡基类型');
    return;
  }
  try {
    if (formMode.value === 'create_recipe') {
      await recipeApi.create({
        name: form.value.recipeName,
        waxBase: form.value.waxBase,
        burnTimeEstimate: form.value.burnTimeEstimate,
        description: form.value.description,
        changeLog: form.value.changeLog || '初始版本',
        scentLayers: form.value.scentLayers,
        essentialOils: form.value.essentialOils,
        scenarios: form.value.scenarios,
        seasons: form.value.seasons,
        status: status || 'draft',
      });
    } else if (formMode.value === 'create_version') {
      if (!editingRecipeForVersion.value) return;
      await recipeApi.createVersion({
        recipeId: editingRecipeForVersion.value.id,
        status: status || 'draft',
        waxBase: form.value.waxBase,
        burnTimeEstimate: form.value.burnTimeEstimate,
        description: form.value.description,
        changeLog: form.value.changeLog,
        scentLayers: form.value.scentLayers,
        essentialOils: form.value.essentialOils,
        scenarios: form.value.scenarios,
        seasons: form.value.seasons,
        baseVersionId: formBaseVersion.value?.id,
      });
    } else if (formMode.value === 'edit_version') {
      if (!editingVersionId.value) return;
      await recipeApi.updateVersion(editingVersionId.value, {
        waxBase: form.value.waxBase,
        burnTimeEstimate: form.value.burnTimeEstimate,
        description: form.value.description,
        changeLog: form.value.changeLog,
        scentLayers: form.value.scentLayers,
        essentialOils: form.value.essentialOils,
        scenarios: form.value.scenarios,
        seasons: form.value.seasons,
      });
    }
    await loadData();
    if (showVersionHistoryModal.value && historyRecipe.value) {
      versions.value = await recipeApi.findVersions(historyRecipe.value.id);
      recipeVersionCache.value.set(historyRecipe.value.id, versions.value);
    }
    closeFormModal();
  } catch (e) {
    alert('保存失败');
  }
}

function openEditName(recipe: Recipe) {
  editingNameRecipe.value = recipe;
  editNameValue.value = recipe.name;
  showEditNameModal.value = true;
}

function closeEditNameModal() {
  showEditNameModal.value = false;
  editingNameRecipe.value = null;
  editNameValue.value = '';
}

async function saveRecipeName() {
  if (!editingNameRecipe.value || !editNameValue.value.trim()) {
    alert('请输入配方名称');
    return;
  }
  try {
    await recipeApi.updateRecipeName(editingNameRecipe.value.id, editNameValue.value.trim());
    await loadData();
    closeEditNameModal();
  } catch (e) {
    alert('保存失败');
  }
}

async function removeRecipe(recipe: Recipe) {
  if (!confirm(`确定要删除配方"${recipe.name}"吗？所有版本都将被删除。`)) return;
  try {
    await recipeApi.remove(recipe.id);
    recipeVersionCache.value.delete(recipe.id);
    await loadData();
  } catch (e) {
    alert('删除失败');
  }
}

async function publishVersion(version: RecipeVersion) {
  if (!confirm('确定要通过审核并发布此版本吗？')) return;
  try {
    await recipeApi.reviewVersion(version.id, 'publish');
    if (historyRecipe.value) {
      versions.value = await recipeApi.findVersions(historyRecipe.value.id);
      recipeVersionCache.value.set(historyRecipe.value.id, versions.value);
    }
    await loadData();
  } catch (e) {
    alert('操作失败');
  }
}

function openRejectModal(version: RecipeVersion) {
  rejectingVersion.value = version;
  rejectNote.value = '';
  showRejectModal.value = true;
}

function closeRejectModal() {
  showRejectModal.value = false;
  rejectingVersion.value = null;
  rejectNote.value = '';
}

async function confirmReject() {
  if (!rejectingVersion.value) return;
  if (!rejectNote.value.trim()) {
    alert('请填写审核备注');
    return;
  }
  try {
    await recipeApi.reviewVersion(rejectingVersion.value.id, 'reject', rejectNote.value.trim());
    if (historyRecipe.value) {
      versions.value = await recipeApi.findVersions(historyRecipe.value.id);
      recipeVersionCache.value.set(historyRecipe.value.id, versions.value);
    }
    await loadData();
    closeRejectModal();
  } catch (e) {
    alert('操作失败');
  }
}

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
  color: var(--primary);
}

.btn-danger {
  background: var(--danger);
  color: #fff;
}

.btn-danger:hover {
  background: #a64838;
}

.btn-danger-outline {
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
}

.btn-danger-outline:hover {
  background: #fde8e4;
}

.btn-success {
  background: var(--success);
  color: #fff;
}

.btn-success:hover {
  background: #557745;
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

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-light);
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}

.empty-state-sm {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-light);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
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

.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.version-badge {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  color: var(--primary-dark);
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.version-badge-inline {
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  color: var(--primary-dark);
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  margin-left: 10px;
}

.meta-item {
  font-size: 12px;
  color: var(--text-light);
}

.highlight {
  color: var(--primary);
  font-weight: 600;
}

.rate-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.rate-good {
  background: #e8f0e4;
  color: var(--success);
}

.rate-medium {
  background: #fdf4e0;
  color: var(--warning);
}

.rate-poor {
  background: #fde8e4;
  color: var(--danger);
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
  flex-wrap: wrap;
}

.status-badge {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
}

.status-draft {
  background: #f0ebe5;
  color: #6b5a4a;
}

.status-pending_review {
  background: #fdf4e0;
  color: var(--warning);
}

.status-published {
  background: #e8f0e4;
  color: var(--success);
}

.status-archived {
  background: #fde8e4;
  color: var(--danger);
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

.modal-xl {
  max-width: 960px;
}

.modal-xxl {
  max-width: 1100px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.modal-subtitle {
  font-size: 13px;
  color: var(--text-light);
  margin-top: 4px;
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
  flex-wrap: wrap;
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

.text-light {
  color: var(--text-light);
  font-size: 13px;
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

.changelog-box {
  margin-top: 8px;
  padding: 12px 14px;
  background: var(--bg-warm);
  border-radius: var(--radius-sm);
  font-size: 13px;
  line-height: 1.6;
  border-left: 3px solid var(--accent);
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--bg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.version-item:hover {
  border-color: var(--primary);
}

.version-selected {
  background: var(--bg-warm);
  border-color: var(--primary);
}

.version-checkbox {
  flex-shrink: 0;
  padding-top: 4px;
  cursor: pointer;
}

.checkbox-box {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  background: var(--surface);
  transition: all 0.2s;
}

.checkbox-box.checked {
  background: var(--primary);
  border-color: var(--primary);
}

.version-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.version-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.version-number {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-dark);
}

.version-date {
  font-size: 12px;
  color: var(--text-light);
}

.version-stat {
  font-size: 12px;
  color: var(--text-light);
}

.version-stat strong {
  color: var(--text);
  font-weight: 600;
}

.version-changelog {
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
}

.changelog-label {
  font-weight: 500;
  color: var(--primary);
}

.version-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.version-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.compare-header {
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.compare-col {
  text-align: center;
}

.compare-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--primary);
  font-weight: bold;
}

.compare-version-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.version-number-lg {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-dark);
}

.compare-version-sub {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
}

.compare-grid {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.compare-row {
  display: grid;
  grid-template-columns: 140px 1fr 1fr;
  border-bottom: 1px solid var(--border);
}

.compare-row:last-child {
  border-bottom: none;
}

.compare-label {
  padding: 12px 16px;
  background: var(--bg-warm);
  font-size: 13px;
  font-weight: 500;
  color: var(--primary-dark);
  display: flex;
  align-items: center;
}

.compare-col-cell {
  padding: 12px 16px;
  font-size: 13px;
  display: flex;
  align-items: flex-start;
  min-height: 44px;
}

.compare-col-cell.changed {
  background: #fef9e8;
}

.compare-section {
  margin-top: 24px;
}

.compare-section h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary-dark);
  margin-bottom: 12px;
}

.oil-compare-table,
.layer-compare-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.oil-compare-row,
.layer-compare-row {
  display: grid;
  grid-template-columns: 140px 1fr 1fr;
  border-bottom: 1px solid var(--border);
}

.oil-compare-row:last-child,
.layer-compare-row:last-child {
  border-bottom: none;
}

.oil-name,
.layer-name {
  padding: 12px 16px;
  background: var(--bg-warm);
  font-size: 13px;
  font-weight: 500;
  color: var(--primary-dark);
  display: flex;
  align-items: center;
}

.oil-col,
.layer-col {
  padding: 12px 16px;
  font-size: 13px;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.oil-col.oil-changed,
.layer-col.changed {
  background: #fef9e8;
}

.oil-diff {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
}

.diff-up {
  color: var(--success);
  background: #e8f0e4;
}

.diff-down {
  color: var(--danger);
  background: #fde8e4;
}

.layer-col p {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-light);
  line-height: 1.5;
}

.layer-col strong {
  color: var(--primary-dark);
}
</style>