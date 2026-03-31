const test = require('node:test');
const assert = require('node:assert/strict');

const { mergeHotspotsByProvider } = require('../workflow.js');

test('插件返回有效热点时应优先使用插件数据', () => {
  const merged = mergeHotspotsByProvider({
    fetchedHotspots: [{ title: 'fetch热点', platform: 'bilibili' }],
    pluginResult: {
      ok: true,
      data: {
        hotspots: [{ title: 'plugin热点', platform: 'external' }]
      }
    }
  });
  assert.equal(merged[0].title, 'plugin热点');
});

test('插件无有效热点时应回退fetch数据', () => {
  const merged = mergeHotspotsByProvider({
    fetchedHotspots: [{ title: 'fetch热点', platform: 'bilibili' }],
    pluginResult: {
      ok: true,
      data: {
        hotspots: []
      }
    }
  });
  assert.equal(merged[0].title, 'fetch热点');
});
