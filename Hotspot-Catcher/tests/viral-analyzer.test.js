const test = require('node:test');
const assert = require('node:assert/strict');

const { analyzeViralStructure } = require('../utils/viral-analyzer.js');

test('应提取爆款结构字段与风格评分', () => {
  const analysis = analyzeViralStructure({
    title: 'OPC月入10万',
    raw_text: '痛点：流量难。误区：盲目投放。但是通过拆解案例可提升转化。步骤1、步骤2、步骤3。'
  });

  assert.equal(typeof analysis.hook_sentence, 'string');
  assert.equal(typeof analysis.problem_statement, 'string');
  assert.ok(Array.isArray(analysis.proof_blocks));
  assert.ok(Array.isArray(analysis.action_items));
  assert.equal(typeof analysis.style_scores.spreadability, 'number');
});
