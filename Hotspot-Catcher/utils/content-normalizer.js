function normalizeContent(item) {
  const sourceType = item.source_type || (item.transcript ? 'video' : 'text');
  const rawText = sourceType === 'video' ? String(item.transcript || item.content || item.title || '') : String(item.content || item.transcript || item.title || '');
  return {
    source_type: sourceType,
    platform: item.platform || 'unknown',
    title: item.title || '',
    raw_text: rawText,
    metrics: {
      views: Number(item.views || 0),
      likes: Number(item.likes || 0),
      comments: Number(item.comments || 0),
      shares: Number(item.shares || 0)
    },
    topic_tags: Array.isArray(item.topic_tags) ? item.topic_tags : [],
    url: item.url || ''
  };
}

function normalizeContents(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map(normalizeContent);
}

module.exports = {
  normalizeContent,
  normalizeContents
};
