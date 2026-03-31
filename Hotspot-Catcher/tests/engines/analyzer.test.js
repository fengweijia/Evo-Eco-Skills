const { test, describe } = require('node:test');
const assert = require('node:assert');
const { analyzeViral } = require('../../src/engines/analyzer/index.js');

describe('analyzer engine', () => {
  test('analyzeViral should return contents with textified and structures', async () => {
    const hotspots = [
      { id: '1', platform: 'bilibili', title: '测试热点', url: 'https://x', views: 10000, raw: { content: '测试内容' } }
    ];
    const result = await analyzeViral(hotspots);
    assert.ok(Array.isArray(result.contents));
    if (result.contents.length > 0) {
      assert.ok(result.contents[0].textified);
      assert.ok(result.contents[0].structures);
    }
  });

  test('analyzeViral should save to markdown file', async () => {
    const hotspots = [
      { id: '1', platform: 'bilibili', title: '测试热点', url: 'https://x', views: 10000, raw: { content: '测试内容' } }
    ];
    const result = await analyzeViral(hotspots);
    assert.ok(result.storage_path);
  });
});