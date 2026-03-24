const { loadAnalysis } = require('./loader.js');
const { generateCandidates } = require('./generator.js');

async function generateDrafts(analyzed, platforms, options = {}) {
  const results = {};

  const contents = analyzed.contents || [];

  for (const platform of platforms) {
    const platformContents = contents.filter(c => c.platform === platform);

    if (platformContents.length === 0) continue;

    const candidates = generateCandidates(platformContents, platform);

    results[platform] = { candidates };
  }

  return results;
}

module.exports = { generateDrafts };