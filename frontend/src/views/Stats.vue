<template>
  <div class="stats-page">
    <div class="overview-cards">
      <div class="stat-card">
        <div class="stat-icon">📜</div>
        <div class="stat-info">
          <span class="stat-num">{{ stats.overview?.totalRecipes || 0 }}</span>
          <span class="stat-label">配方总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🛍️</div>
        <div class="stat-info">
          <span class="stat-num">{{ stats.overview?.totalOrders || 0 }}</span>
          <span class="stat-label">订单总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏭</div>
        <div class="stat-info">
          <span class="stat-num">{{ stats.overview?.totalProductions || 0 }}</span>
          <span class="stat-label">制作记录</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-info">
          <span class="stat-num">{{ stats.overview?.totalFeedbacks || 0 }}</span>
          <span class="stat-label">反馈数量</span>
        </div>
      </div>
    </div>

    <div class="order-status-cards">
      <div class="status-card pending">
        <span class="status-num">{{ stats.overview?.pendingOrders || 0 }}</span>
        <span class="status-label">待制作</span>
      </div>
      <div class="status-card producing">
        <span class="status-num">{{ stats.overview?.producingOrders || 0 }}</span>
        <span class="status-label">制作中</span>
      </div>
      <div class="status-card completed">
        <span class="status-num">{{ stats.overview?.completedOrders || 0 }}</span>
        <span class="status-label">已完成</span>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-header">
          <h3>🌸 各香调受欢迎度</h3>
        </div>
        <div ref="scentChartRef" class="chart-container"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>🔄 配方优化次数</h3>
        </div>
        <div ref="optimizeChartRef" class="chart-container"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>⏱️ 燃烧时长达标率</h3>
        </div>
        <div class="compliance-display">
          <div class="compliance-ring">
            <svg viewBox="0 0 120 120" class="ring-svg">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#f5ebe0" stroke-width="10" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                :stroke="complianceColor"
                stroke-width="10"
                stroke-linecap="round"
                stroke-dasharray="314"
                :stroke-dashoffset="complianceOffset"
                transform="rotate(-90 60 60)"
                class="ring-progress"
              />
            </svg>
            <div class="ring-center">
              <span class="ring-num">{{ stats.burnTimeCompliance?.complianceRate || 0 }}%</span>
              <span class="ring-label">达标率</span>
            </div>
          </div>
          <div class="compliance-details">
            <div class="detail-row">
              <span class="dot pass"></span>
              <span>达标</span>
              <span class="num">{{ stats.burnTimeCompliance?.compliant || 0 }}</span>
            </div>
            <div class="detail-row">
              <span class="dot fail"></span>
              <span>未达标</span>
              <span class="num">{{ stats.burnTimeCompliance?.nonCompliant || 0 }}</span>
            </div>
            <div class="detail-row total">
              <span></span>
              <span>总计</span>
              <span class="num">{{ stats.burnTimeCompliance?.total || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>📦 复购香型分布</h3>
        </div>
        <div ref="repurchaseChartRef" class="chart-container"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>📈 各配方版本燃烧达标率趋势</h3>
        </div>
        <div ref="versionTrendChartRef" class="chart-container"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>⚡ 优化前后燃烧时长差异</h3>
        </div>
        <div ref="burnImproveChartRef" class="chart-container"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>🔔 反馈驱动的版本发布数量</h3>
        </div>
        <div ref="releaseChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { statsApi, AllStats } from '@/api/stats';
import * as echarts from 'echarts';

const stats = ref<AllStats>({
  overview: {
    totalRecipes: 0,
    totalOrders: 0,
    totalProductions: 0,
    totalFeedbacks: 0,
    pendingOrders: 0,
    producingOrders: 0,
    completedOrders: 0,
  },
  scentPopularity: [],
  recipeOptimization: [],
  burnTimeCompliance: {
    total: 0,
    compliant: 0,
    nonCompliant: 0,
    complianceRate: 0,
    details: [],
  },
  repurchaseDistribution: [],
  versionComplianceTrend: [],
  burnTimeImprovement: [],
  feedbackDrivenReleases: [],
});

const scentChartRef = ref<HTMLElement>();
const optimizeChartRef = ref<HTMLElement>();
const repurchaseChartRef = ref<HTMLElement>();
const versionTrendChartRef = ref<HTMLElement>();
const burnImproveChartRef = ref<HTMLElement>();
const releaseChartRef = ref<HTMLElement>();

let scentChart: echarts.ECharts | null = null;
let optimizeChart: echarts.ECharts | null = null;
let repurchaseChart: echarts.ECharts | null = null;
let versionTrendChart: echarts.ECharts | null = null;
let burnImproveChart: echarts.ECharts | null = null;
let releaseChart: echarts.ECharts | null = null;

const complianceColor = computed(() => {
  const rate = stats.value.burnTimeCompliance?.complianceRate || 0;
  if (rate >= 80) return '#6b8e5a';
  if (rate >= 60) return '#d4a04a';
  return '#c25a4a';
});

const complianceOffset = computed(() => {
  const rate = stats.value.burnTimeCompliance?.complianceRate || 0;
  return 314 - (314 * rate) / 100;
});

const initCharts = () => {
  const warmColors = ['#8b5a3c', '#a67855', '#d4a574', '#e8c9a0', '#c9a87c', '#b8956e', '#6b4423', '#d4a04a'];

  if (scentChartRef.value) {
    scentChart = echarts.init(scentChartRef.value);
  }
  if (optimizeChartRef.value) {
    optimizeChart = echarts.init(optimizeChartRef.value);
  }
  if (repurchaseChartRef.value) {
    repurchaseChart = echarts.init(repurchaseChartRef.value);
  }
  if (versionTrendChartRef.value) {
    versionTrendChart = echarts.init(versionTrendChartRef.value);
  }
  if (burnImproveChartRef.value) {
    burnImproveChart = echarts.init(burnImproveChartRef.value);
  }
  if (releaseChartRef.value) {
    releaseChart = echarts.init(releaseChartRef.value);
  }
};

const updateCharts = () => {
  const warmColors = ['#8b5a3c', '#a67855', '#d4a574', '#e8c9a0', '#c9a87c', '#b8956e', '#6b4423', '#d4a04a'];

  if (scentChart && stats.value.scentPopularity.length > 0) {
    scentChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}次 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { fontSize: 12, color: '#3d2c1e' },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          data: stats.value.scentPopularity.map((s, i) => ({
            name: s.name,
            value: s.count,
            itemStyle: { color: warmColors[i % warmColors.length] },
          })),
        },
      ],
    });
  }

  if (optimizeChart && stats.value.recipeOptimization.length > 0) {
    optimizeChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: stats.value.recipeOptimization.map((r) => r.recipeName),
        axisLabel: { rotate: 30, fontSize: 11, color: '#3d2c1e' },
        axisLine: { lineStyle: { color: '#e8ddd0' } },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#6b5a4a' },
        splitLine: { lineStyle: { color: '#f5ebe0' } },
      },
      series: [
        {
          type: 'bar',
          data: stats.value.recipeOptimization.map((r, i) => ({
            value: r.optimizationCount,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: warmColors[i % warmColors.length] },
                { offset: 1, color: warmColors[(i + 2) % warmColors.length] },
              ]),
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: '50%',
        },
      ],
    });
  }

  if (repurchaseChart && stats.value.repurchaseDistribution.length > 0) {
    repurchaseChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}个 ({d}%)',
      },
      series: [
        {
          type: 'pie',
          radius: '65%',
          center: ['50%', '50%'],
          roseType: 'radius',
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11,
            color: '#3d2c1e',
          },
          labelLine: { lineStyle: { color: '#d4a574' } },
          data: stats.value.repurchaseDistribution.map((r, i) => ({
            name: r.recipeName,
            value: r.orderCount,
            itemStyle: { color: warmColors[i % warmColors.length] },
          })),
        },
      ],
    });
  }

  const versionTrendData = (stats.value.versionComplianceTrend || []).filter(
    (r) => r.versions && r.versions.length >= 2
  );
  if (versionTrendChart && versionTrendData.length > 0) {
    const allVersions = Array.from(
      new Set(versionTrendData.flatMap((r) => r.versions.map((v) => v.version)))
    ).sort();

    const series = versionTrendData.map((recipe, idx) => ({
      name: recipe.recipeName,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: warmColors[idx % warmColors.length] },
      lineStyle: { width: 2, color: warmColors[idx % warmColors.length] },
      label: {
        show: true,
        formatter: '{c}%',
        fontSize: 10,
        color: '#3d2c1e',
      },
      data: allVersions.map((ver) => {
        const found = recipe.versions.find((v) => v.version === ver);
        return found ? found.complianceRate : null;
      }),
    }));

    const tooltipMap: Record<string, Record<string, { rate: number; count: number }>> = {};
    versionTrendData.forEach((recipe) => {
      tooltipMap[recipe.recipeName] = {};
      recipe.versions.forEach((v) => {
        tooltipMap[recipe.recipeName][v.version] = {
          rate: v.complianceRate,
          count: v.feedbackCount,
        };
      });
    });

    versionTrendChart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let html = `<div style="font-weight:600;margin-bottom:6px;">${params[0].axisValue}</div>`;
          params.forEach((p: any) => {
            if (p.value != null) {
              const info = tooltipMap[p.seriesName]?.[p.axisValue];
              html += `<div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};"></span>
                <span>${p.seriesName}</span>
                <span style="margin-left:auto;font-weight:600;">${p.value}%</span>
              </div>`;
              if (info) {
                html += `<div style="font-size:11px;color:#6b5a4a;padding-left:16px;">反馈数: ${info.count}</div>`;
              }
            }
          });
          return html;
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { fontSize: 11, color: '#3d2c1e' },
      },
      grid: { left: '3%', right: '4%', bottom: '60px', top: '10px', containLabel: true },
      xAxis: {
        type: 'category',
        data: allVersions,
        axisLabel: { fontSize: 11, color: '#3d2c1e' },
        axisLine: { lineStyle: { color: '#e8ddd0' } },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { formatter: '{value}%', color: '#6b5a4a' },
        splitLine: { lineStyle: { color: '#f5ebe0' } },
      },
      series,
    });
  }

  const burnImproveData = stats.value.burnTimeImprovement || [];
  const burnImproveCategories: string[] = [];
  const burnImproveFromData: number[] = [];
  const burnImproveToData: number[] = [];
  const burnImproveMarks: any[] = [];

  burnImproveData.forEach((recipe) => {
    recipe.comparisons.forEach((comp, idx) => {
      const catIdx = burnImproveCategories.length;
      burnImproveCategories.push(`${recipe.recipeName} ${comp.fromVersion}→${comp.toVersion}`);
      burnImproveFromData.push(comp.fromAvgBurn);
      burnImproveToData.push(comp.toAvgBurn);
      burnImproveMarks.push({
        coord: [catIdx, Math.max(comp.fromAvgBurn, comp.toAvgBurn)],
        value:
          (comp.improvementHours > 0 ? '+' : '') +
          comp.improvementHours.toFixed(1) +
          'h',
        itemStyle: {
          color: comp.improvementHours >= 0 ? '#6b8e5a' : '#c25a4a',
        },
        label: {
          show: true,
          position: 'top',
          distance: 5,
          fontSize: 11,
          fontWeight: 'bold',
          color: comp.improvementHours >= 0 ? '#6b8e5a' : '#c25a4a',
        },
      });
    });
  });

  if (burnImproveChart && burnImproveCategories.length > 0) {
    burnImproveChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const catIdx = params[0].dataIndex;
          let html = `<div style="font-weight:600;margin-bottom:6px;">${burnImproveCategories[catIdx]}</div>`;
          params.forEach((p: any) => {
            html += `<div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color};"></span>
              <span>${p.seriesName}</span>
              <span style="margin-left:auto;font-weight:600;">${p.value}h</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: ['优化前', '优化后'],
        bottom: 0,
        textStyle: { fontSize: 11, color: '#3d2c1e' },
      },
      grid: { left: '3%', right: '4%', bottom: '50px', top: '30px', containLabel: true },
      xAxis: {
        type: 'category',
        data: burnImproveCategories,
        axisLabel: { rotate: 25, fontSize: 10, color: '#3d2c1e' },
        axisLine: { lineStyle: { color: '#e8ddd0' } },
      },
      yAxis: {
        type: 'value',
        name: '小时',
        nameTextStyle: { color: '#6b5a4a', fontSize: 11 },
        axisLabel: { formatter: '{value}h', color: '#6b5a4a' },
        splitLine: { lineStyle: { color: '#f5ebe0' } },
      },
      series: [
        {
          name: '优化前',
          type: 'bar',
          data: burnImproveFromData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#a67855' },
              { offset: 1, color: '#8b5a3c' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '35%',
          barGap: '10%',
        },
        {
          name: '优化后',
          type: 'bar',
          data: burnImproveToData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#d4a574' },
              { offset: 1, color: '#c9a87c' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '35%',
          markPoint: {
            symbol: 'pin',
            symbolSize: 0,
            data: burnImproveMarks,
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => {
              const catIdx = params.dataIndex;
              const marks = burnImproveData.flatMap((r) => r.comparisons);
              const comp = marks[catIdx];
              if (!comp) return '';
              const sign = comp.improvementHours > 0 ? '+' : '';
              return sign + comp.improvementHours.toFixed(1) + 'h';
            },
            color: (params: any) => {
              const marks = burnImproveData.flatMap((r) => r.comparisons);
              const comp = marks[params.dataIndex];
              return comp && comp.improvementHours >= 0 ? '#6b8e5a' : '#c25a4a';
            },
            fontSize: 11,
            fontWeight: 'bold',
          },
        },
      ],
    });
  }

  const releaseData = stats.value.feedbackDrivenReleases || [];
  if (releaseChart && releaseData.length > 0) {
    releaseChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const catIdx = params[0].dataIndex;
          const row = releaseData[catIdx];
          let html = `<div style="font-weight:600;margin-bottom:6px;">${row.month}</div>`;
          params.forEach((p: any) => {
            html += `<div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color};"></span>
              <span>${p.seriesName}</span>
              <span style="margin-left:auto;font-weight:600;">${p.value}</span>
            </div>`;
          });
          html += `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;font-weight:600;">总计: ${row.totalCount}</div>`;
          return html;
        },
      },
      legend: {
        data: ['反馈驱动发布', '普通发布'],
        bottom: 0,
        textStyle: { fontSize: 11, color: '#3d2c1e' },
      },
      grid: { left: '3%', right: '4%', bottom: '50px', top: '10px', containLabel: true },
      xAxis: {
        type: 'category',
        data: releaseData.map((r) => r.month),
        axisLabel: { fontSize: 11, color: '#3d2c1e' },
        axisLine: { lineStyle: { color: '#e8ddd0' } },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#6b5a4a' },
        splitLine: { lineStyle: { color: '#f5ebe0' } },
      },
      series: [
        {
          name: '反馈驱动发布',
          type: 'bar',
          stack: 'total',
          data: releaseData.map((r) => r.feedbackDrivenCount),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#8fbc6a' },
              { offset: 1, color: '#6b8e5a' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '50%',
        },
        {
          name: '普通发布',
          type: 'bar',
          stack: 'total',
          data: releaseData.map((r) => r.regularCount),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#a67855' },
              { offset: 1, color: '#6b4423' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '50%',
        },
      ],
    });
  }
};

const loadData = async () => {
  stats.value = await statsApi.getAll();
  await nextTick();
  initCharts();
  updateCharts();
};

const handleResize = () => {
  scentChart?.resize();
  optimizeChart?.resize();
  repurchaseChart?.resize();
  versionTrendChart?.resize();
  burnImproveChart?.resize();
  releaseChart?.resize();
};

onMounted(() => {
  loadData();
  window.addEventListener('resize', handleResize);
});
</script>

<style scoped>
.stats-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 36px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-dark);
}

.stat-label {
  font-size: 13px;
  color: var(--text-light);
}

.order-status-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.status-card {
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.status-card.pending {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}

.status-card.producing {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
}

.status-card.completed {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
}

.status-num {
  font-size: 36px;
  font-weight: 700;
  color: var(--text);
}

.status-label {
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.chart-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.chart-header {
  margin-bottom: 16px;
}

.chart-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.chart-container {
  width: 100%;
  height: 280px;
}

.compliance-display {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 10px 0;
}

.compliance-ring {
  position: relative;
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}

.ring-svg {
  width: 100%;
  height: 100%;
}

.ring-progress {
  transition: stroke-dashoffset 0.8s ease;
}

.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-num {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-dark);
}

.ring-label {
  font-size: 13px;
  color: var(--text-light);
}

.compliance-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text);
}

.detail-row .num {
  margin-left: auto;
  font-weight: 600;
  font-size: 18px;
  color: var(--primary-dark);
}

.detail-row.total {
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.pass {
  background: var(--success);
}

.dot.fail {
  background: var(--danger);
}

@media (max-width: 900px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
