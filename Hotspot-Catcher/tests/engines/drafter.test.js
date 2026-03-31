const { test, describe } = require('node:test');
const assert = require('node:assert');
const { generateDrafts } = require('../../src/engines/drafter/index.js');

describe('drafter engine', () => {
  test('generateDrafts should return 3 candidates per platform', async () => {
    const analyzed = {
      contents: [{
        hotspot_id: '1',
        platform: 'wechat',
        title: '测试热点',
        textified: '测试内容',
        structures: { hook: '钩子', conflict: '冲突', evidence: ['证据'], actions: ['行动'], cta: 'CTA' }
      }]
    };

    const result = await generateDrafts(analyzed, ['wechat']);
    assert.ok(result.wechat);
    assert.equal(result.wechat.candidates.length, 3);
  });

  test('each candidate should have title, body, reason', async () => {
    const analyzed = {
      contents: [{
        hotspot_id: '1',
        platform: 'wechat',
        title: '测试热点',
        textified: '测试内容',
        structures: { hook: '钩子', conflict: '冲突', evidence: ['证据'], actions: ['行动'], cta: 'CTA' }
      }]
    };

    const result = await generateDrafts(analyzed, ['wechat']);
    const candidate = result.wechat.candidates[0];
    assert.ok(candidate.title);
    assert.ok(candidate.body);
    assert.ok(candidate.reason);
  });
});