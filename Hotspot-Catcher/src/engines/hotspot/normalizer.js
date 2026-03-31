function normalizeHotspot(item, platform, keyword) {
  return {
    id: `${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    platform,
    keyword,
    title: item.title,
    url: item.url,
    views: item.views || 0,
    rank: 0,
    raw: item
  };
}

module.exports = { normalizeHotspot };