const test = require('node:test');
const assert = require('node:assert/strict');

const { createPluginsRuntime } = require('../utils/plugins-runtime.js');

test('外部provider失败时应自动回退builtin并保留trace', async () => {
  const runtime = createPluginsRuntime({
    hotspot: { provider: 'external' }
  });
  const result = await runtime.call('hotspot.search', { keywords: ['OPC'], platforms: ['bilibili'] });
  assert.equal(result.ok, true);
  assert.equal(typeof result.trace_id, 'string');
  assert.equal(result.trace.fallback_used, true);
});

test('外部provider返回非法schema时应标记E_SCHEMA_INVALID并回退', async () => {
  const runtime = createPluginsRuntime(
    { hotspot: { provider: 'external' } },
    {
      externalHandlers: {
        'hotspot.search': async () => ({ ok: true, bad: true })
      }
    }
  );
  const result = await runtime.call('hotspot.search', { keywords: ['OPC'], platforms: ['bilibili'] });
  assert.equal(result.ok, true);
  assert.equal(result.trace.fallback_used, true);
  assert.equal(result.trace.error_code, 'E_SCHEMA_INVALID');
});
