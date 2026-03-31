const test = require('node:test');
const assert = require('node:assert/strict');

const { buildRunReport } = require('../workflow.js');

test('报告应包含病毒模板流水线关键字段', () => {
  const report = buildRunReport({
    config: {
      ai: { provider: 'siliconflow' },
      image: { provider: 'volcengine' },
      _manual_insight: '强调风险边界'
    },
    keyword: 'OPC',
    hotspot: { title: 'OPC 热点', platform: 'bilibili', views: 10000, comments: 100, keyword: 'OPC' },
    opinion: { title: '机会型', angle: '增长' },
    styles: ['写实摄影'],
    hotspots: [{ title: 'OPC 热点', platform: 'bilibili', url: 'https://a', views: 10000, keyword: 'OPC' }],
    normalizedContents: [{ source_type: 'text', platform: 'bilibili', title: 'OPC 热点', raw_text: '正文', metrics: { views: 1, likes: 1, comments: 1, shares: 0 }, topic_tags: [], url: 'https://a' }],
    viralAnalysis: { hook_sentence: '钩子', style_scores: { spreadability: 0.8 } },
    templateDraft: { template_id: 'T2', template_candidates: [{ id: 'T2', score: 0.8 }], selection_reason: 'rule+platform:wechat' },
    optimizedPrompt: { best_candidate_id: 'p2', candidate_scores: [{ id: 'p1', score: 0.7 }], optimized_prompt: '优化提示词' },
    pluginTraces: [{ trace_id: 'trace_1', provider: 'builtin', fallback_used: false }],
    outputs: {
      wechatPath: '/tmp/wechat.md',
      xhsPath: '/tmp/xhs.md',
      imageManifestPath: '/tmp/images.json',
      wechatDraft: { title: 'A', body: 'B\nC\nD', tags: ['x'] },
      xhsDraft: { title: 'E', body: 'F\nG\nH', tags: ['y'] }
    }
  });

  assert.equal(report.selected_template_id, 'T2');
  assert.ok(Array.isArray(report.plugin_traces));
  assert.ok(Array.isArray(report.prompt_iteration.candidate_scores));
  assert.equal(typeof report.prompt_iteration.optimized_prompt, 'string');
  assert.ok(report.kpi_snapshot);
});
