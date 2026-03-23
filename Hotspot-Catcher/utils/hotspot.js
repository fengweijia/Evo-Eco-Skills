function calculateHeatScore(item) {
  const views = Number(item.views || 0);
  const likes = Number(item.likes || 0);
  const comments = Number(item.comments || 0);
  return views + likes * 3 + comments * 5;
}

function normalizeHotspots(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item, index) => ({
    id: `${item.platform || 'unknown'}-${index + 1}`,
    platform: item.platform || 'unknown',
    title: item.title || '',
    url: item.url || '',
    heat_score: calculateHeatScore(item),
    views: Number(item.views || 0),
    likes: Number(item.likes || 0),
    comments: Number(item.comments || 0),
    keyword: item.keyword || ''
  }));
}

module.exports = {
  normalizeHotspots
};
