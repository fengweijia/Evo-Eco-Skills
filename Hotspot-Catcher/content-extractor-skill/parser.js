const fs = require('fs');
const path = require('path');

/**
 * 查找最新的热点JSON文件
 * @param {string} outputDir - 热点JSON文件所在目录
 * @returns {string|null} 文件路径或null
 */
function findLatestHotspotsFile(outputDir = 'output/hotspots') {
  const absolutePath = path.isAbsolute(outputDir)
    ? outputDir
    : path.join(process.cwd(), outputDir);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  const files = fs.readdirSync(absolutePath)
    .filter(f => f.startsWith('hotspots-') && f.endsWith('.json'))
    .sort()
    .reverse();

  return files[0] ? path.join(absolutePath, files[0]) : null;
}

/**
 * 解析热点JSON文件
 * @param {string} filepath - JSON文件路径
 * @returns {object} 解析后的数据
 */
function parseHotspotsFile(filepath) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
}

/**
 * 从热点数据中提取URL信息
 * @param {object} hotspotsData - 热点JSON数据
 * @returns {Array} URL信息数组
 */
function extractUrls(hotspotsData) {
  const hotspots = hotspotsData.hotspots || [];
  return hotspots.map(h => ({
    id: h.id,
    title: h.title,
    url: h.url,
    platform: h.platform,
    keyword: h.keyword,
    views: h.views,
    rank: h.rank,
    fetched_at: h.fetched_at
  }));
}

/**
 * 获取所有热点JSON文件
 * @param {string} outputDir - 目录路径
 * @returns {Array<string>} 文件路径数组
 */
function getAllHotspotsFiles(outputDir = 'output/hotspots') {
  const absolutePath = path.isAbsolute(outputDir)
    ? outputDir
    : path.join(process.cwd(), outputDir);

  if (!fs.existsSync(absolutePath)) {
    return [];
  }

  return fs.readdirSync(absolutePath)
    .filter(f => f.startsWith('hotspots-') && f.endsWith('.json'))
    .map(f => path.join(absolutePath, f))
    .sort()
    .reverse();
}

module.exports = {
  findLatestHotspotsFile,
  parseHotspotsFile,
  extractUrls,
  getAllHotspotsFiles
};