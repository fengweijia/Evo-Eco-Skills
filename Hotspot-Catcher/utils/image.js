const axios = require('axios');

function buildImagePrompt({ title, keyword, platform, style }) {
  return `${platform}内容配图，主题:${keyword}，标题:${title}，风格:${style}，高清，适合社交媒体封面，主体清晰`;
}

async function generateImageByProvider(config, prompt) {
  const buildMockUrl = () => {
    let hash = 0;
    for (let i = 0; i < prompt.length; i += 1) {
      hash = (hash << 5) - hash + prompt.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    return `https://picsum.photos/seed/${seed}/1280/720`;
  };

  const provider = config.image?.provider || 'mock';

  if (provider === 'mock') {
    return buildMockUrl();
  }

  if (provider === 'deepai') {
    if (!config.image?.api_key) {
      return buildMockUrl();
    }
    try {
      const response = await axios.post(
        'https://api.deepai.org/api/text2img',
        { text: prompt },
        { headers: { 'Api-Key': config.image.api_key } }
      );
      return response.data?.output_url || buildMockUrl();
    } catch (error) {
      return buildMockUrl();
    }
  }

  return buildMockUrl();
}

async function generateImageCandidates({ config, title, keyword, platform, styles }) {
  const results = [];
  for (const style of styles) {
    const prompt = buildImagePrompt({ title, keyword, platform, style });
    const imageUrl = await generateImageByProvider(config, prompt);
    results.push({ style, prompt, imageUrl });
  }
  return results;
}

module.exports = {
  generateImageCandidates
};
