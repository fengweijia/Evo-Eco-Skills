const test = require('node:test');
const assert = require('node:assert/strict');

const { buildRunReport } = require('../workflow.js');

test('运行报告应包含热点详情人工见解与prompt迭代信息', () => {
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
    outputs: {
      wechatPath: '/tmp/wechat.md',
      xhsPath: '/tmp/xhs.md',
      imageManifestPath: '/tmp/images.json',
      wechatDraft: { title: 'A', body: 'B\nC\nD', tags: ['x'] },
      xhsDraft: { title: 'E', body: 'F\nG\nH', tags: ['y'] }
    }
  });

  assert.ok(Array.isArray(report.hotspots));
  assert.equal(report.manual_insight_applied, true);
  assert.equal(typeof report.prompt_iteration.best_prompt_id, 'string');
});
