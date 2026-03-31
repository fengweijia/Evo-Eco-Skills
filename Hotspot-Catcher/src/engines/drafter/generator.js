function generateCandidates(contents, platform) {
  const candidates = [];
  const template = platform === 'wechat'
    ? { titlePrefix: '深度', bodyPrefix: '今天来聊聊' }
    : { titlePrefix: '必看', bodyPrefix: '姐妹们' };

  for (let i = 1; i <= 3; i++) {
    candidates.push({
      id: `${platform}-${i}`,
      title: `${template.titlePrefix}：${contents[0]?.title || '热点'}-${i}`,
      body: `${template.bodyPrefix}，${contents[0]?.structures?.hook || '值得关注'}...`,
      reason: i === 1 ? '数据详实，案例丰富' : i === 2 ? '步骤清晰，易于实操' : '痛点明确，警示性强'
    });
  }

  return candidates;
}

module.exports = { generateCandidates };