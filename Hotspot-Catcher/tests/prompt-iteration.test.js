const test = require('node:test');
const assert = require('node:assert/strict');

const { selectBestPrompt, scoreDraftQuality, optimizePromptByTemplate } = require('../utils/prompt.js');

test('prompt迭代引擎应返回最高分版本', () => {
  const best = selectBestPrompt([
    { id: 'v1', score: 0.62 },
    { id: 'v2', score: 0.81 },
    { id: 'v3', score: 0.75 }
  ]);
  assert.equal(best.id, 'v2');
});

test('文案质量评分应返回0到1范围', () => {
  const score = scoreDraftQuality({
    title: 'OPC月入10万拆解',
    body: '结构化正文\n有步骤\n有结论',
    tags: ['OPC', '副业']
  });
  assert.ok(score >= 0 && score <= 1);
});

test('应生成至少2个候选prompt并返回最佳版本', () => {
  const result = optimizePromptByTemplate({
    template_id: 'T2',
    platform: 'wechat',
    persona: '专业型',
    structured_draft: '结构化草稿内容'
  });
  assert.ok(Array.isArray(result.candidates));
  assert.ok(result.candidates.length >= 2);
  assert.equal(typeof result.best_candidate_id, 'string');
  assert.equal(typeof result.optimized_prompt, 'string');
  assert.ok(Array.isArray(result.candidate_scores));
});
