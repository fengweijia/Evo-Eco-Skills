const { test, describe } = require('node:test');
const assert = require('node:assert');
const { PluginRuntime } = require('../src/plugins/runtime.js');

describe('plugins runtime', () => {
  test('PluginRuntime should load builtin engine by default', async () => {
    const runtime = new PluginRuntime({
      plugins: { hotspot: { provider: 'builtin' } }
    });
    const engine = await runtime.loadEngine('hotspot');
    assert.ok(engine);
    assert.ok(engine.fetchHotspots);
  });

  test('PluginRuntime should fallback to builtin when external unavailable', async () => {
    const runtime = new PluginRuntime({
      plugins: { hotspot: { provider: 'external', external: { path: '/invalid/path' } } }
    });
    const engine = await runtime.loadEngine('hotspot');
    assert.ok(engine);
  });
});