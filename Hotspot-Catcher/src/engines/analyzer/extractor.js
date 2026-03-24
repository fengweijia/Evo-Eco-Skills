function extractStructure(text, hotspot) {
  const textStr = String(text);
  return {
    hook: textStr.slice(0, 50),
    conflict: textStr.includes('但是') ? '存在反差冲突' : '待分析',
    evidence: textStr.split(/[,。]/).filter(s => s.trim()).slice(0, 3),
    actions: ['步骤1', '步骤2', '步骤3'],
    cta: '欢迎评论讨论'
  };
}

module.exports = { extractStructure };