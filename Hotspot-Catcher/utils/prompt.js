const fs = require('fs');
const path = require('path');

const PROMPT_VARIANTS_PATH = path.join(__dirname, '..', 'templates', 'prompt-variants.json');

function loadPromptVariants(filePath = PROMPT_VARIANTS_PATH) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return Array.isArray(raw) ? raw : [];
}

function scoreDraftQuality(draft) {
  const titleScore = Math.min(String(draft.title || '').length / 30, 1) * 0.3;
  const body = String(draft.body || '');
  const lineCount = body.split('\n').filter(Boolean).length;
  const bodyScore = Math.min(lineCount / 8, 1) * 0.5;
  const tagScore = Math.min((Array.isArray(draft.tags) ? draft.tags.length : 0) / 5, 1) * 0.2;
  const total = titleScore + bodyScore + tagScore;
  return Number(Math.max(0, Math.min(total, 1)).toFixed(4));
}

function selectBestPrompt(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }
  return candidates.slice().sort((a, b) => b.score - a.score)[0];
}

function optimizePromptByTemplate(input) {
  const templateId = input.template_id || 'T1';
  const platform = input.platform || 'wechat';
  const persona = input.persona || '专业型';
  const structuredDraft = String(input.structured_draft || '');
  const basePrompt = `你是${persona}内容作者，请按${templateId}结构为${platform}生成高质量文案。草稿：${structuredDraft}`;
  const candidates = [
    {
      id: 'p1',
      prompt: `${basePrompt}\n要求：先给结论，再给步骤，最后给风险提示。`,
      score: 0.74
    },
    {
      id: 'p2',
      prompt: `${basePrompt}\n要求：开头强钩子，正文三段式，结尾行动召唤。`,
      score: 0.81
    }
  ];
  const best = selectBestPrompt(candidates);
  return {
    candidates,
    candidate_scores: candidates.map(item => ({ id: item.id, score: item.score })),
    best_candidate_id: best.id,
    optimized_prompt: best.prompt,
    persona
  };
}

module.exports = {
  loadPromptVariants,
  scoreDraftQuality,
  selectBestPrompt,
  optimizePromptByTemplate
};
