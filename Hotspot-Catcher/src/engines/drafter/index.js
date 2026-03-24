const { loadAnalysis } = require('./loader.js');
const { generateCandidates } = require('./generator.js');

async function generateDrafts(analyzed, platforms, options = {}) {
  const results = {};
  const errors = [];

  const contents = analyzed.contents || [];

  for (const platform of platforms) {
    try {
      const platformContents = contents.filter(c => c.platform === platform);

      if (platformContents.length === 0) {
        errors.push({ platform, error: 'No content for platform' });
        continue;
      }

      const candidates = generateCandidates(platformContents, platform);
      results[platform] = { candidates };
    } catch (e) {
      errors.push({ platform, error: e.message });
      console.warn(`Failed to generate drafts for ${platform}: ${e.message}`);
    }
  }

  if (Object.keys(results).length === 0) {
    throw new Error('No drafts could be generated');
  }

  // 返回兼容格式：直接返回 results，同时在 errors 属性中包含错误信息
  results.errors = errors.length > 0 ? errors : undefined;
  return results;
}

module.exports = { generateDrafts };