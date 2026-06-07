import { Injectable, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface Recipe {
  id: string;
  name: string;
  waxBase: string;
  essentialOils: { name: string; percentage: number }[];
  scentLayers: { layer: string; note: string; description: string }[];
  burnTimeEstimate: number;
  scenarios: string[];
  seasons: string[];
  description: string;
  optimizationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  mood: string;
  occasion: string;
  scentPreferences: string[];
  recipeId: string;
  recipeName: string;
  engraving: string;
  quantity: number;
  status: 'pending' | 'producing' | 'completed';
  createdAt: string;
}

export interface ProductionRecord {
  id: string;
  orderId: string;
  recipeId: string;
  recipeName: string;
  waxAmount: number;
  essentialOilAmounts: { name: string; amount: number }[];
  pourTemperature: number;
  coolTime: number;
  notes: string;
  createdAt: string;
}

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

@Injectable()
export class DataStore implements OnModuleInit {
  recipes: Recipe[] = [];
  orders: Order[] = [];
  productions: ProductionRecord[] = [];
  feedbacks: BurnFeedback[] = [];

  onModuleInit() {
    this.seedData();
  }

  private seedData() {
    const waxBases = ['大豆蜡', '蜂蜡', '椰子蜡', '石蜡混合', '棕榈蜡'];
    const essentialOilOptions = ['薰衣草', '柠檬', '雪松', '玫瑰', '檀香', '薄荷', '橙花', '佛手柑', '尤加利', '茉莉'];
    const scenarios = ['卧室助眠', '工作专注', '瑜伽冥想', '浪漫约会', '家庭聚会', '书房阅读', '沐浴放松'];
    const seasons = ['春季', '夏季', '秋季', '冬季', '四季皆宜'];
    const layers = ['前调', '中调', '后调'];

    const seedRecipes: Partial<Recipe>[] = [
      {
        name: '静谧森林',
        waxBase: '大豆蜡',
        essentialOils: [
          { name: '雪松', percentage: 40 },
          { name: '檀香', percentage: 35 },
          { name: '佛手柑', percentage: 25 },
        ],
        scentLayers: [
          { layer: '前调', note: '佛手柑', description: '清新柑橘气息，初闻即提神' },
          { layer: '中调', note: '雪松', description: '木质清香，沉稳而温暖' },
          { layer: '后调', note: '檀香', description: '醇厚余韵，持久安心' },
        ],
        burnTimeEstimate: 48,
        scenarios: ['书房阅读', '工作专注', '瑜伽冥想'],
        seasons: ['秋季', '冬季', '四季皆宜'],
        description: '宛如漫步于晨雾缭绕的森林，木质香调带来内心的宁静与力量。',
      },
      {
        name: '仲夏花园',
        waxBase: '椰子蜡',
        essentialOils: [
          { name: '玫瑰', percentage: 35 },
          { name: '茉莉', percentage: 30 },
          { name: '橙花', percentage: 35 },
        ],
        scentLayers: [
          { layer: '前调', note: '橙花', description: '明亮花香，活力绽放' },
          { layer: '中调', note: '玫瑰', description: '优雅浪漫，芬芳馥郁' },
          { layer: '后调', note: '茉莉', description: '清甜余味，柔缓入心' },
        ],
        burnTimeEstimate: 36,
        scenarios: ['浪漫约会', '卧室助眠', '沐浴放松'],
        seasons: ['春季', '夏季'],
        description: '百花盛开的夏日花园，花香层层叠叠，带来柔美浪漫的氛围。',
      },
      {
        name: '清晨微风',
        waxBase: '大豆蜡',
        essentialOils: [
          { name: '柠檬', percentage: 45 },
          { name: '薄荷', percentage: 30 },
          { name: '尤加利', percentage: 25 },
        ],
        scentLayers: [
          { layer: '前调', note: '柠檬', description: '明亮清爽，瞬间唤醒' },
          { layer: '中调', note: '薄荷', description: '清凉提神，思维清晰' },
          { layer: '后调', note: '尤加利', description: '草本余韵，呼吸通畅' },
        ],
        burnTimeEstimate: 32,
        scenarios: ['工作专注', '家庭聚会'],
        seasons: ['夏季', '春季'],
        description: '如同清晨第一缕阳光穿过窗帘，清新振奋，开启美好一天。',
      },
      {
        name: '薰衣草之梦',
        waxBase: '蜂蜡',
        essentialOils: [
          { name: '薰衣草', percentage: 60 },
          { name: '檀香', percentage: 25 },
          { name: '佛手柑', percentage: 15 },
        ],
        scentLayers: [
          { layer: '前调', note: '佛手柑', description: '淡淡果香，柔和过渡' },
          { layer: '中调', note: '薰衣草', description: '经典草本，舒缓放松' },
          { layer: '后调', note: '檀香', description: '温暖木质，助眠安神' },
        ],
        burnTimeEstimate: 52,
        scenarios: ['卧室助眠', '沐浴放松', '瑜伽冥想'],
        seasons: ['四季皆宜'],
        description: '普罗旺斯的薰衣草田在月光下静静绽放，带来一夜好眠。',
      },
      {
        name: '温暖壁炉',
        waxBase: '棕榈蜡',
        essentialOils: [
          { name: '檀香', percentage: 40 },
          { name: '雪松', percentage: 35 },
          { name: '玫瑰', percentage: 25 },
        ],
        scentLayers: [
          { layer: '前调', note: '玫瑰', description: '淡淡花香，温馨开场' },
          { layer: '中调', note: '雪松', description: '干燥木质，沉稳可靠' },
          { layer: '后调', note: '檀香', description: '醇厚香甜，暖意融融' },
        ],
        burnTimeEstimate: 56,
        scenarios: ['家庭聚会', '卧室助眠', '书房阅读'],
        seasons: ['秋季', '冬季'],
        description: '冬日壁炉旁的温暖时光，木质香调裹着淡淡甜意，驱散寒冷。',
      },
    ];

    seedRecipes.forEach((r) => {
      const recipe: Recipe = {
        id: uuidv4(),
        name: r.name,
        waxBase: r.waxBase,
        essentialOils: r.essentialOils,
        scentLayers: r.scentLayers,
        burnTimeEstimate: r.burnTimeEstimate,
        scenarios: r.scenarios,
        seasons: r.seasons,
        description: r.description,
        optimizationCount: Math.floor(Math.random() * 5),
        createdAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      };
      this.recipes.push(recipe);
    });

    const moods = ['放松减压', '提升活力', '浪漫温馨', '专注工作', '助眠安神'];
    const occasions = ['生日送礼', '自用日常', '节日礼物', '婚礼伴手礼', '乔迁新居'];
    const customerNames = ['张小姐', '李先生', '王女士', '陈先生', '刘小姐', '赵女士', '孙先生', '周小姐'];

    for (let i = 0; i < 12; i++) {
      const recipe = this.recipes[i % this.recipes.length];
      const order: Order = {
        id: uuidv4(),
        customerName: customerNames[i % customerNames.length],
        mood: moods[Math.floor(Math.random() * moods.length)],
        occasion: occasions[Math.floor(Math.random() * occasions.length)],
        scentPreferences: [recipe.scentLayers[1].note, recipe.scentLayers[0].note],
        recipeId: recipe.id,
        recipeName: recipe.name,
        engraving: i % 3 === 0 ? '' : ['愿你被温柔以待', '岁月静好', '心想事成', 'Happy Birthday'][i % 4],
        quantity: Math.floor(Math.random() * 3) + 1,
        status: (['pending', 'producing', 'completed'] as const)[i % 3],
        createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
      };
      this.orders.push(order);
    }

    for (let i = 0; i < 8; i++) {
      const order = this.orders[i];
      const recipe = this.recipes.find((r) => r.id === order.recipeId);
      const production: ProductionRecord = {
        id: uuidv4(),
        orderId: order.id,
        recipeId: recipe.id,
        recipeName: recipe.name,
        waxAmount: 200 + Math.floor(Math.random() * 100),
        essentialOilAmounts: recipe.essentialOils.map((eo) => ({
          name: eo.name,
          amount: Math.round((eo.percentage / 100) * 30 * 10) / 10,
        })),
        pourTemperature: 60 + Math.floor(Math.random() * 15),
        coolTime: 4 + Math.floor(Math.random() * 4),
        notes: [
          '蜡液混合均匀，表面光滑',
          '精油分散良好，香味浓郁',
          '冷却过程无裂纹',
          '第二次搅拌后气泡已消除',
        ][i % 4],
        createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
      };
      this.productions.push(production);
    }

    for (let i = 0; i < 6; i++) {
      const production = this.productions[i];
      const recipe = this.recipes.find((r) => r.id === production.recipeId);
      const variance = (Math.random() - 0.3) * 10;
      const feedback: BurnFeedback = {
        id: uuidv4(),
        productionId: production.id,
        recipeId: recipe.id,
        actualBurnTime: Math.max(10, Math.round(recipe.burnTimeEstimate + variance)),
        expectedBurnTime: recipe.burnTimeEstimate,
        scentStrength: 3 + Math.floor(Math.random() * 3),
        scentDuration: 3 + Math.floor(Math.random() * 3),
        comments: [
          '燃烧稳定，香气扩散均匀',
          '前调稍淡，中后调表现优秀',
          '整体符合预期，顾客满意',
          '燃烧时略有黑烟，需调整灯芯',
          '留香持久，房间内数小时仍有余香',
          '香调层次分明，非常满意',
        ][i],
        optimizationSuggestion: i % 2 === 0 ? '' : ['建议增加前调精油比例5%', '灯芯可选择稍细型号', '浇注温度可降低2度'][i % 3],
        createdAt: new Date(Date.now() - (i + 1) * 2 * 86400000).toISOString(),
      };
      this.feedbacks.push(feedback);
    }
  }
}
