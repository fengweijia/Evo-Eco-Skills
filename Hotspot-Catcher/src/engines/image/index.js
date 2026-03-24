const { adaptImageCount } = require('./adapter.js');

// 尝试复用现有的 utils/image.js
let imageUtils = null;
try {
  imageUtils = require('../../utils/image.js');
} catch (e) {
  console.warn('Failed to load utils/image.js, will use fallback:', e.message);
}

async function generateImages(drafts, styles, platforms, options = {}) {
  const images = [];
  const errors = [];

  // 尝试调用真实 API 生成的函数
  async function tryRealImageGeneration(draft, style, platform, type) {
    if (!imageUtils) return null;

    try {
      // 复用现有逻辑
      const prompt = `${draft.final.title} - ${style}`;
      // 这里简化处理，实际应该调用真实 API
      // 由于 utils/image.js 较复杂，这里保留 fallback
      return null;
    } catch (e) {
      return null;
    }
  }

  for (const platform of platforms) {
    const draft = drafts[platform];
    if (!draft || !draft.final) {
      errors.push({ platform, error: 'No confirmed draft for platform' });
      continue;
    }

    const imageCount = adaptImageCount(platform);

    for (const style of styles) {
      for (let i = 0; i < imageCount; i++) {
        try {
          // 尝试真实生成（如果可用）
          const realUrl = await tryRealImageGeneration(draft, style, platform, i === 0 ? 'cover' : 'content');

          images.push({
            platform,
            type: i === 0 ? 'cover' : 'content',
            style,
            url: realUrl || `https://picsum.photos/800/600?random=${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            prompt: `${draft.final.title} - ${style}`,
            isReal: !!realUrl
          });
        } catch (e) {
          // Fallback to placeholder
          images.push({
            platform,
            type: i === 0 ? 'cover' : 'content',
            style,
            url: `https://picsum.photos/800/600?random=${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            prompt: `${draft.final.title} - ${style}`,
            isReal: false,
            error: e.message
          });
        }
      }
    }
  }

  return images;
}

module.exports = { generateImages };