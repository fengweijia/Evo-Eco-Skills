const test = require('node:test');
const assert = require('node:assert/strict');

const { buildTemplateDraft } = require('../utils/template-engine.js');

test('应按结构评分选择模板并输出结构化草稿', () => {
  const draft = buildTemplateDraft({
    analysis: {
      hook_sentence: '开头钩子',
      problem_statement: '问题定义',
      conflict_point: '冲突点',
      proof_blocks: ['证据1'],
      action_items: ['动作1'],
      cta_type: 'comment',
      style_scores: { actionability: 0.92, spreadability: 0.66 }
    },
    platform: 'xiaohongshu',
    topic: 'OPC'
  });

  assert.equal(typeof draft.template_id, 'string');
  assert.equal(typeof draft.structured_draft, 'string');
  assert.equal(typeof draft.selection_reason, 'string');
});
