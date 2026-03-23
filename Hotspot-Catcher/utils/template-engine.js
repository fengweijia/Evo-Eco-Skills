const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'viral-structures.json');

function loadTemplates(filePath = TEMPLATE_PATH) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return Array.isArray(raw) ? raw : [];
}

function scoreTemplate(template, analysis, platform) {
  const actionability = Number(analysis?.style_scores?.actionability || 0);
  const spreadability = Number(analysis?.style_scores?.spreadability || 0);
  let score = (actionability + spreadability) / 2;
  if (Array.isArray(template.platform_hint) && template.platform_hint.includes(platform)) {
    score += 0.12;
  }
  if (platform === 'xiaohongshu' && ['T1', 'T4'].includes(template.id)) {
    score += 0.1;
  }
  if (platform === 'wechat' && ['T2', 'T5'].includes(template.id)) {
    score += 0.1;
  }
  return Number(Math.max(0, Math.min(score, 1)).toFixed(4));
}

function selectTemplate(analysis, platform, templates = loadTemplates()) {
  if (!templates.length) {
    return { selected: { id: 'T1', name: '问题-方案型' }, candidates: [] };
  }
  const candidates = templates.map(item => ({
    id: item.id,
    name: item.name,
    score: scoreTemplate(item, analysis, platform)
  })).sort((a, b) => b.score - a.score);
  return { selected: candidates[0], candidates };
}

function buildTemplateDraft({ analysis, platform, topic }) {
  const { selected, candidates } = selectTemplate(analysis, platform);
  const structuredDraft = [
    `主题：${topic}`,
    `钩子：${analysis?.hook_sentence || '抓住注意力'}`,
    `问题：${analysis?.problem_statement || '拆解关键问题'}`,
    `冲突：${analysis?.conflict_point || '给出反差'}`,
    `行动：${(analysis?.action_items || []).join('；') || '给出执行步骤'}`
  ].join('\n');
  return {
    template_id: selected.id,
    slot_values: {
      topic: topic || '',
      hook_sentence: analysis?.hook_sentence || '',
      problem_statement: analysis?.problem_statement || ''
    },
    structured_draft: structuredDraft,
    template_candidates: candidates,
    selection_reason: `rule+platform:${platform}`
  };
}

module.exports = {
  loadTemplates,
  selectTemplate,
  buildTemplateDraft
};
