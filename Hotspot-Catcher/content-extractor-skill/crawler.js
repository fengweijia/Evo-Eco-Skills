const { exec, execSync } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * 检查 Firecrawl 是否可用
 * @returns {string|null} Firecrawl 路径或 null
 */
function isFirecrawlAvailable() {
  const possiblePaths = [
    'npx firecrawl',
    'firecrawl',
    '/usr/local/bin/firecrawl',
    '/usr/bin/firecrawl',
    `${process.env.HOME}/.npm-global/bin/firecrawl`
  ];

  for (const cmd of possiblePaths) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore', timeout: 10000 });
      console.log(`✅ Firecrawl 检测成功: ${cmd}`);
      return cmd;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * 使用 Firecrawl 抓取单个 URL 内容
 * @param {string} url - 要抓取的 URL
 * @param {object} options - 选项
 * @returns {Promise<object>} 抓取结果
 */
async function fetchUrlContent(url, options = {}) {
  const limit = options.limit || 5;
  const timeout = options.timeout || 30000;

  // 先检查 firecrawl 是否可用
  const firecrawlPath = isFirecrawlAvailable();

  if (!firecrawlPath) {
    console.warn('⚠️ Firecrawl 不可用，使用模拟数据');
    return {
      url,
      content: null,
      error: 'Firecrawl not available',
      useMock: true
    };
  }

  try {
    const { stdout } = await execPromise(
      `${firecrawlPath} crawl "${url}" --limit ${limit} --json`,
      { timeout }
    );
    return parseFirecrawlOutput(stdout, url);
  } catch (err) {
    console.warn(`⚠️ Firecrawl 抓取失败: ${err.message}`);
    return {
      url,
      content: null,
      error: err.message,
      useMock: false
    };
  }
}

/**
 * 批量抓取多个 URL
 * @param {Array} urls - URL 对象数组 [{id, url, ...}]
 * @param {object} options - 选项
 * @returns {Promise<Array>} 抓取结果数组
 */
async function batchFetch(urls, options = {}) {
  const maxConcurrent = options.maxConcurrent || 3;
  const results = [];

  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(item => fetchUrlContent(item.url, options))
    );

    // 合并 id 信息
    batchResults.forEach((result, idx) => {
      results.push({
        id: batch[idx].id,
        ...result
      });
    });

    // 显示进度
    console.log(`📥 抓取进度: ${Math.min(i + maxConcurrent, urls.length)}/${urls.length}`);
  }

  return results;
}

/**
 * 解析 Firecrawl 输出
 * @param {string} stdout - 命令输出
 * @param {string} originalUrl - 原始URL
 * @returns {object} 解析后的结果
 */
function parseFirecrawlOutput(stdout, originalUrl) {
  try {
    const data = JSON.parse(stdout);
    return {
      url: originalUrl,
      content: data.content?.markdown || data.content?.text || data.text || '',
      metadata: data.metadata || {},
      success: true
    };
  } catch {
    return {
      url: originalUrl,
      content: stdout,
      metadata: {},
      success: true
    };
  }
}

/**
 * 获取 mock 内容（用于测试或 firecrawl 不可用时）
 * @param {object} urlItem - URL对象
 * @returns {object} mock结果
 */
function getMockContent(urlItem) {
  return {
    id: urlItem.id,
    url: urlItem.url,
    content: `# ${urlItem.title}\n\n这是关于 "${urlItem.title}" 的内容摘要。\n\n## 核心要点\n- 热点话题：${urlItem.keyword}\n- 平台：${urlItem.platform}\n- 排名：${urlItem.rank}`,
    metadata: {
      title: urlItem.title,
      platform: urlItem.platform
    },
    useMock: true
  };
}

module.exports = {
  isFirecrawlAvailable,
  fetchUrlContent,
  batchFetch,
  parseFirecrawlOutput,
  getMockContent
};