function scoreByLength(text, unit) {
  return Number(Math.max(0, Math.min(text.length / unit, 1)).toFixed(4));
}

function analyzeViralStructure(content) {
  const title = String(content.title || '');
  const text = String(content.raw_text || '');
  const lines = text.split(/[。！？\n]/).map(item => item.trim()).filter(Boolean);

  return {
    hook_sentence: title || lines[0] || '',
    problem_statement: lines[0] || text.slice(0, 80),
    conflict_point: text.includes('但是') || text.includes('却') ? '存在反差冲突' : '冲突待补充',
    proof_blocks: lines.slice(0, 3),
    action_items: ['步骤1：定义目标', '步骤2：拆解路径', '步骤3：执行复盘'],
    cta_type: 'comment',
    style_scores: {
      emotion: scoreByLength(title, 24),
      density: scoreByLength(text, 260),
      actionability: Number(Math.max(0.4, Math.min(0.9, lines.length / 6)).toFixed(4)),
      spreadability: Number(Math.max(0.3, Math.min(0.95, (title.length + text.length) / 300)).toFixed(4))
    }
  };
}

module.exports = {
  analyzeViralStructure
};
