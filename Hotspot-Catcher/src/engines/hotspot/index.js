const { fetchFromPlatform } = require('./fetcher.js');
const { normalizeHotspot } = require('./normalizer.js');
const { selectTopN } = require('./selector.js');

async function fetchHotspots(keywords, platforms, options = {}) {
  const topN = options.topN || 5;
  const allHotspots = [];
  const errors = [];

  for (const platform of platforms) {
    for (const keyword of keywords) {
      try {
        const rawData = await fetchFromPlatform(platform, keyword);
        const normalized = rawData.map(item => normalizeHotspot(item, platform, keyword));
        const selected = selectTopN(normalized, topN);
        allHotspots.push(...selected);
      } catch (e) {
        errors.push({ platform, keyword, error: e.message });
        console.warn(`Failed to fetch from ${platform} for "${keyword}": ${e.message}`);
      }
    }
  }

  if (allHotspots.length === 0 && errors.length > 0) {
    throw new Error(`All hotspot fetch failed: ${errors.map(e => e.error).join('; ')}`);
  }

  return allHotspots;
}

module.exports = { fetchHotspots };