const { test, describe } = require('node:test');
const assert = require('node:assert');
const { fetchHotspots } = require('../../src/engines/hotspot/index.js');

describe('hotspot engine', () => {
  test('fetchHotspots should return array with TOP5 hotspots', async () => {
    const result = await fetchHotspots(['柑橘'], ['bilibili']);
    assert.ok(Array.isArray(result));
    assert.ok(result.length <= 5);
  });

  test('each hotspot should have platform, title, url, rank', async () => {
    const result = await fetchHotspots(['柑橘'], ['bilibili']);
    if (result.length > 0) {
      assert.ok(result[0].platform);
      assert.ok(result[0].title);
      assert.ok(result[0].url);
      assert.ok(typeof result[0].rank === 'number');
    }
  });
});