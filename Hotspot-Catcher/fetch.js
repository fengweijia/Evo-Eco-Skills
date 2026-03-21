/**
 * 热点捕手 - 热点采集器
 * 根据配置的关键词从各平台采集热点
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 配置路径
const CONFIG_PATH = path.join(__dirname, 'config.json');
const OUTPUT_DIR = path.join(__dirname, 'output', 'hotspots');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 加载配置
function loadConfig() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  return config;
}

// 模拟从各平台获取热点（实际项目中需要接入真实API）
function fetchFromPlatform(keyword, platform) {
  // 这里返回模拟数据
  const mockData = {
    bilibili: [
      { title: `${keyword}最新热门视频分析`, views: 52000, comments: 2300 },
      { title: `一人公司用${keyword}月入10万`, views: 89000, comments: 4500 },
      { title: `${keyword}是风口还是割韭菜？`, views: 34000, comments: 1200 }
    ],
    xiaohongshu: [
      { title: `${keyword}，普通人也能做`, likes: 12000, comments: 890 },
      { title: `分享我的${keyword}实战经验`, likes: 8500, comments: 560 },
      { title: `${keyword}真的能赚钱吗？`, likes: 23000, comments: 1800 }
    ],
    weibo: [
      { title: `${keyword}上热搜了`, views: 150000, comments: 8900 },
      { title: `专家解读${keyword}未来趋势`, views: 78000, comments: 3400 }
    ],
    zhihu: [
      { title: `如何看待${keyword}？`, views: 45000, comments: 2100 },
      { title: `${keyword}为什么突然火起来`, views: 32000, comments: 1500 }
    ]
  };

  const data = mockData[platform] || [];
  return data.map(item => ({
    ...item,
    platform,
    keyword,
    url: `https://${platform}.com/search?q=${encodeURIComponent(keyword)}`,
    timestamp: new Date().toISOString()
  }));
}

function normalizeReuseHotspots(items, keyword) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .filter(item => item && item.title)
    .map(item => ({
      title: item.title,
      views: Number(item.views || 0),
      likes: Number(item.likes || 0),
      comments: Number(item.comments || 0),
      platform: item.platform || 'ecosystem',
      keyword: item.keyword || keyword,
      url: item.url || '',
      timestamp: item.timestamp || new Date().toISOString()
    }));
}

async function loadReuseHotspots(config, keyword) {
  if (!config.reuse?.enabled) {
    return [];
  }

  const reuse = config.reuse;

  if (reuse.local_hotspots_file && fs.existsSync(reuse.local_hotspots_file)) {
    const raw = JSON.parse(fs.readFileSync(reuse.local_hotspots_file, 'utf-8'));
    return normalizeReuseHotspots(raw, keyword);
  }

  if (reuse.github_hotspots_url) {
    try {
      const response = await axios.get(reuse.github_hotspots_url, { timeout: 10000 });
      return normalizeReuseHotspots(response.data, keyword);
    } catch (error) {
      return [];
    }
  }

  return [];
}

// 主采集函数
async function fetchHotspots(config) {
  const allHotspots = [];
  
  console.log('📡 热点捕手 v1.0');
  console.log('================');
  console.log('🔑 监听关键词:', config.keywords.join(', '));
  console.log('🌐 目标平台:', config.platforms.join(', '));
  console.log('🔥 最低热度:', config.min_views);
  console.log('');

  for (const keyword of config.keywords) {
    const reuseHotspots = await loadReuseHotspots(config, keyword);
    if (reuseHotspots.length > 0) {
      console.log(`🔁 复用生态数据: ${reuseHotspots.length} 条`);
      allHotspots.push(...reuseHotspots);
      continue;
    }

    for (const platform of config.platforms) {
      console.log(`🔍 正在采集: [${platform}] ${keyword}`);
      const hotspots = fetchFromPlatform(keyword, platform);
      
      // 过滤低热度内容
      const filtered = config.auto_filter 
        ? hotspots.filter(h => (h.views || h.likes || 0) >= config.min_views)
        : hotspots;
      
      allHotspots.push(...filtered);
      console.log(`   ✅ 获取 ${filtered.length} 条热点`);
    }
  }
  
  // 按热度排序
  allHotspots.sort((a, b) => (b.views || b.likes || 0) - (a.views || a.likes || 0));
  
  return allHotspots;
}

// 保存结果
function saveHotspots(hotspots) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `hotspots-${timestamp}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(hotspots, null, 2));
  return filepath;
}

// 主函数
async function main() {
  try {
    const config = loadConfig();
    const hotspots = await fetchHotspots(config);
    
    console.log('');
    console.log('📊 采集完成！');
    console.log(`   总计: ${hotspots.length} 条热点`);
    
    if (hotspots.length === 0) {
      console.log('   ⚠️ 没有找到符合条件的热点，请降低 min_views 或更换关键词');
      return;
    }
    
    const outputPath = saveHotspots(hotspots);
    console.log(`   保存位置: ${outputPath}`);
    console.log('');
    console.log('🔥 TOP 10 热点:');
    hotspots.slice(0, 10).forEach((h, i) => {
      const metric = h.views ? `${h.views}播放` : `${h.likes}赞`;
      console.log(`   ${i+1}. [${h.platform}] ${h.title} (${metric})`);
    });
    
  } catch (error) {
    console.error('❌ 采集失败:', error.message);
    process.exit(1);
  }
}

// 导出供其他模块使用
module.exports = { fetchHotspots, loadConfig };

// 如果直接运行
if (require.main === module) {
  main();
}
