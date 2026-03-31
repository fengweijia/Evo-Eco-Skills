const { fetchFromPlatform } = require('./fetcher.js');
const { normalizeHotspot } = require('./normalizer.js');
const { selectTopN } = require('./selector.js');

/**
 * 从多个平台获取热点信息
 * @param {string[]} keywords - 关键词数组
 * @param {string[]} platforms - 平台数组
 * @param {object} options - 选项
 * @param {number} options.topN - 每个关键词每个平台返回的热点数量（默认5）
 * @param {number} options.maxPerPlatform - 每个平台最多返回的热点数量（默认10）
 * @returns {Promise<Array>} 热点列表
 */
async function fetchHotspots(keywords, platforms, options = {}) {
  const topN = options.topN || 5;           // 每个关键词取前5
  const maxPerPlatform = options.maxPerPlatform || 10;  // 每个平台最多10条
  const allHotspots = [];
  const errors = [];

  console.log(`\n📡 开始抓取热点...`);
  console.log(`   关键词: ${keywords.join(', ')}`);
  console.log(`   平台: ${platforms.join(', ')}`);
  console.log(`   每关键词Top: ${topN}, 每平台上限: ${maxPerPlatform}`);

  for (const platform of platforms) {
    const platformHotspots = [];

    for (const keyword of keywords) {
      try {
        console.log(`\n   正在抓取: [${platform}] ${keyword}...`);
        const rawData = await fetchFromPlatform(platform, keyword);
        const normalized = rawData.map(item => normalizeHotspot(item, platform, keyword));

        // 默认排序: views 降序, rank 升序
        const sorted = [...normalized].sort((a, b) => {
          if (b.views !== a.views) return b.views - a.views;
          return (a.rank || 999) - (b.rank || 999);
        });

        // 取前 topN 条并设置排名
        const selected = selectTopN(sorted, topN);
        platformHotspots.push(...selected);

        console.log(`   ✅ 获取 ${selected.length} 条 (总计 ${platformHotspots.length})`);
      } catch (e) {
        errors.push({ platform, keyword, error: e.message });
        console.warn(`   ❌ 失败: ${e.message}`);
      }
    }

    // 每个平台限制最多 maxPerPlatform 条并重新设置排名
    const platformLimit = selectTopN(platformHotspots, maxPerPlatform);

    allHotspots.push(...platformLimit);
    console.log(`\n📊 [${platform}] 最终获取: ${platformLimit.length} 条`);
  }

  // 整体排序
  const finalHotspots = allHotspots.sort((a, b) => b.views - a.views);

  console.log(`\n✅ 抓取完成: 共 ${finalHotspots.length} 条热点`);

  if (finalHotspots.length === 0 && errors.length > 0) {
    throw new Error(`All hotspot fetch failed: ${errors.map(e => e.error).join('; ')}`);
  }

  return finalHotspots;
}

module.exports = { fetchHotspots };