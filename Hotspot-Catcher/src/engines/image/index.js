const { adaptImageCount } = require('./adapter.js');

async function generateImages(drafts, styles, platforms, options = {}) {
  const images = [];

  for (const platform of platforms) {
    const draft = drafts[platform];
    if (!draft || !draft.final) continue;

    const imageCount = adaptImageCount(platform);

    for (const style of styles) {
      for (let i = 0; i < imageCount; i++) {
        images.push({
          platform,
          type: i === 0 ? 'cover' : 'content',
          style,
          url: `https://picsum.photos/800/600?random=${Date.now()}-${i}`,
          prompt: `${draft.final.title} - ${style}`
        });
      }
    }
  }

  return images;
}

module.exports = { generateImages };