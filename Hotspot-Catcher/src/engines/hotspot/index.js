const { fetchFromPlatform } = require('./fetcher.js');
const { normalizeHotspot } = require('./normalizer.js');
const { selectTopN } = require('./selector.js');

async function fetchHotspots(keywords, platforms, options = {}) {
  const topN = options.topN || 5;
  const allHotspots = [];

  for (const platform of platforms) {
    for (const keyword of keywords) {
      const rawData = await fetchFromPlatform(platform, keyword);
      const normalized = rawData.map(item => normalizeHotspot(item, platform, keyword));
      const selected = selectTopN(normalized, topN);
      allHotspots.push(...selected);
    }
  }

  return allHotspots;
}

module.exports = { fetchHotspots };