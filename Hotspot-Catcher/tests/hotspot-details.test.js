const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeHotspots } = require('../utils/hotspot.js');

test('热点详情应包含平台标题链接与热度指数', () => {
  const input = [
    { platform: 'bilibili', title: 'OPC 热点', url: 'https://bilibili.com/x', views: 12000, comments: 300 }
  ];
  const result = normalizeHotspots(input);
  assert.equal(result[0].platform, 'bilibili');
  assert.equal(result[0].title, 'OPC 热点');
  assert.equal(result[0].url, 'https://bilibili.com/x');
  assert.equal(typeof result[0].heat_score, 'number');
  assert.ok(result[0].heat_score > 0);
});
