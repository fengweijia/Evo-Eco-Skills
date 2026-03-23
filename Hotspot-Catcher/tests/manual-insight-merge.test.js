const test = require('node:test');
const assert = require('node:assert/strict');

const { mergeInsightIntoPrompt, pickInsightForHotspot } = require('../utils/insight.js');

test('人工见解应追加到prompt中', () => {
  const prompt = mergeInsightIntoPrompt('基础提示词', '强调变现路径与风险边界');
  assert.ok(prompt.includes('基础提示词'));
  assert.ok(prompt.includes('人工见解'));
  assert.ok(prompt.includes('风险边界'));
});

test('应按关键词命中对应人工见解', () => {
  const insights = [
    { keyword: 'OPC', insight: '突出自动化和轻资产' },
    { keyword: 'AI副业', insight: '突出投入产出比' }
  ];
  const picked = pickInsightForHotspot(insights, { keyword: 'OPC', title: 'OPC 热点' });
  assert.equal(picked.insight, '突出自动化和轻资产');
});
