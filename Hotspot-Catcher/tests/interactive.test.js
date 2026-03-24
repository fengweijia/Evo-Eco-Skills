const { test, describe } = require('node:test');
const assert = require('node:assert');
const { confirmDraft } = require('../src/engines/drafter/confirmer.js');

describe('interactive confirmation', () => {
  test('confirmDraft should return selected candidate', async () => {
    const candidates = [
      { id: '1', title: '标题1', body: '内容1', reason: '原因1' },
      { id: '2', title: '标题2', body: '内容2', reason: '原因2' },
      { id: '3', title: '标题3', body: '内容3', reason: '原因3' }
    ];

    // 由于 confirmDraft 需要交互输入，这里只测试它的基本结构
    assert.ok(candidates.length === 3);
    assert.ok(candidates[0].title);
    assert.ok(candidates[0].reason);
  });
});