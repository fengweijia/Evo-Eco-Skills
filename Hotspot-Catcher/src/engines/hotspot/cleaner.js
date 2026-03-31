const fs = require('fs');
const path = require('path');
const { URL } = require('url');

/**
 * 热点数据清洗与格式化模块
 */

/**
 * 清洗标题中的特殊字符和 HTML 标签
 * @param {string} title - 原始标题
 * @returns {string} 清洗后的标题
 */
function cleanTitle(title) {
  if (!title) return '';

  let cleaned = title.toString();

  // 去除 HTML 标签
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // 转换 HTML 实体
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // 去除多余空白
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 去除特殊字符（保留中文、英文、数字、常用标点）
  cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s,.!?;:。！？、；：""''（）【】《》\-_]/g, '');

  return cleaned.trim();
}

/**
 * 清洗 URL，去除跟踪参数
 * @param {string} url - 原始 URL
 * @returns {string} 清洗后的 URL
 */
function cleanUrl(url) {
  if (!url) return '';

  try {
    const urlObj = new URL(url);

    // 需要去除的跟踪参数
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'dclid',
      'ref', 'source', 'from', '_ga',
      'share', 'share_id', 'utm_share'
    ];

    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    // 移除空的 search 部分
    return urlObj.toString().replace(/\?$/, '');
  } catch (e) {
    // 如果不是有效的 URL，返回原始值
    return url;
  }
}

/**
 * 从 URL 中提取域名
 * @param {string} url - URL 字符串
 * @returns {string} 域名
 */
function extractDomain(url) {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
}

/**
 * 规范化热点数据为统一格式
 * @param {Object} hotspot - 原始热点数据
 * @returns {Object} 规范化后的热点数据
 */
function normalizeForStorage(hotspot) {
  return {
    // 唯一标识
    id: hotspot.id || generateId(),

    // 核心内容
    title: cleanTitle(hotspot.title || ''),
    url: cleanUrl(hotspot.url || ''),

    // 来源信息
    platform: hotspot.platform || 'unknown',
    keyword: hotspot.keyword || '',

    // 热度数据
    views: parseInt(hotspot.views) || 0,
    rank: parseInt(hotspot.rank) || 0,

    // 元数据
    metadata: {
      source: extractDomain(hotspot.url || ''),
      fetched_at: new Date().toISOString(),
      original_data: hotspot.raw || null
    },

    // 时间戳（便于排序）
    fetched_at: new Date().toISOString()
  };
}

/**
 * 生成唯一 ID
 * @returns {string} 唯一标识
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 保存热点数据到 JSON 文件
 * @param {Array} hotspots - 热点数组
 * @param {Object} options - 选项
 * @returns {Promise<string>} 保存的文件路径
 */
async function saveToJSON(hotspots, options = {}) {
  const outputDir = options.outputDir || path.join(process.cwd(), 'output', 'hotspots');
  const keyword = options.keyword || 'mixed';

  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 生成文件名：hotspots-日期-关键词.json
  const date = new Date().toISOString().slice(0, 10);
  const safeKeyword = keyword.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
  const filename = `hotspots-${date}-${safeKeyword}.json`;
  const filepath = path.join(outputDir, filename);

  // 准备输出数据
  const outputData = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    count: hotspots.length,
    keyword,
    hotspots: hotspots.map(h => normalizeForStorage(h))
  };

  // 写入文件
  fs.writeFileSync(filepath, JSON.stringify(outputData, null, 2), 'utf-8');

  console.log(`  💾 已保存 ${hotspots.length} 条热点到 ${filepath}`);

  return filepath;
}

/**
 * 从 JSON 文件加载热点数据
 * @param {string} filepath - JSON 文件路径
 * @returns {Array} 热点数组
 */
function loadFromJSON(filepath) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`文件不存在: ${filepath}`);
  }

  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

  if (data.hotspots) {
    return data.hotspots;
  }

  return data;
}

module.exports = {
  cleanTitle,
  cleanUrl,
  extractDomain,
  normalizeForStorage,
  saveToJSON,
  loadFromJSON,
  generateId
};
