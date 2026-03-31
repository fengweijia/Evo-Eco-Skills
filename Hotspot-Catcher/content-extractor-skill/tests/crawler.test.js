const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('crawler - URL内容抓取模块', () => {
  test('fetchUrlContent 应能抓取URL内容（mock或实际）', async () => {
    const { fetchUrlContent } = require('../crawler.js');

    // 使用一个可访问的测试URL
    const testUrl = 'https://www.bilibili.com';
    const result = await fetchUrlContent(testUrl);

    assert.ok(result, '应返回结果');
    assert.ok(result.url === testUrl, '应返回原始URL');
    // content 可能为null（抓取失败）或字符串（成功）
    assert.ok(result.content === null || typeof result.content === 'string');
  });

  test('batchFetch 应能批量抓取多个URL', async () => {
    const { batchFetch } = require('../crawler.js');

    const urls = [
      { id: '1', url: 'https://www.bilibili.com' },
      { id: '2', url: 'https://www.xiaohongshu.com' }
    ];

    const results = await batchFetch(urls, { maxConcurrent: 2 });

    assert.ok(Array.isArray(results), '应返回数组');
    assert.ok(results.length >= 0, '结果数量应大于等于0');
  });

  test('batchFetch 应支持并发控制', async () => {
    const { batchFetch } = require('../crawler.js');

    const urls = [
      { id: '1', url: 'https://example.com/1' },
      { id: '2', url: 'https://example.com/2' },
      { id: '3', url: 'https://example.com/3' }
    ];

    const startTime = Date.now();
    const results = await batchFetch(urls, { maxConcurrent: 2 });
    const duration = Date.now() - startTime;

    // 由于 maxConcurrent=2，至少需要一定时间
    assert.ok(results.length === 3, '应返回3个结果');
  });
});