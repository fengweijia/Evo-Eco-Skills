const axios = require('axios');
const { loadEnvFile } = require('./env.js');

loadEnvFile();

function buildImagePrompt({ title, keyword, platform, style }) {
  return `${platform}内容配图，主题:${keyword}，标题:${title}，风格:${style}，高清，适合社交媒体封面，主体清晰`;
}

async function requestImageWithFallback({
  endpoint,
  provider,
  imageApiKey,
  modelCandidates,
  prompt,
  payloadBuilders
}) {
  const errors = [];

  for (const model of modelCandidates) {
    for (const buildPayload of payloadBuilders) {
      const payload = buildPayload(model, prompt);
      try {
        const response = await axios.post(
          endpoint,
          payload,
          {
            headers: {
              Authorization: `Bearer ${imageApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        const url = response.data?.data?.[0]?.url;
        if (url) {
          return { url, errors };
        }
      } catch (error) {
        errors.push({
          provider,
          endpoint,
          model,
          payload_keys: Object.keys(payload),
          status: error.response?.status || null,
          message: error.response?.data?.message || error.message
        });
      }
    }
  }

  return { url: '', errors };
}

async function generateImageByProvider(config, prompt) {
  if (config && config._last_image_error) {
    delete config._last_image_error;
  }
  const buildMockUrl = () => {
    let hash = 0;
    for (let i = 0; i < prompt.length; i += 1) {
      hash = (hash << 5) - hash + prompt.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    return `https://picsum.photos/seed/${seed}/1280/720`;
  };

  const provider = String(config.image?.provider || process.env.IMAGE_PROVIDER || 'mock').toLowerCase();
  const imageApiKey =
    config.image?.api_key ||
    process.env.SILICONFLOW_IMAGE_API_KEY ||
    process.env.SILICONFLOW_API_KEY ||
    process.env.IMAGE_API_KEY ||
    '';
  const imageModel = config.image?.model || process.env.IMAGE_MODEL || 'Kwai-Kolors/Kolors';
  const fallbackModels = Array.isArray(config.image?.fallback_models) && config.image.fallback_models.length > 0
    ? config.image.fallback_models
    : ['Kwai-Kolors/Kolors', 'black-forest-labs/FLUX.1-schnell'];

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

  if (provider === 'siliconflow') {
    if (!imageApiKey) {
      return buildMockUrl();
    }
    const modelCandidates = Array.from(new Set([imageModel, ...fallbackModels]));
    const result = await requestImageWithFallback({
      endpoint: 'https://api.siliconflow.cn/v1/images/generations',
      provider,
      imageApiKey,
      modelCandidates,
      prompt,
      payloadBuilders: [
        (model, text) => ({ model, prompt: text, image_size: '2048x2048' }),
        (model, text) => ({ model, prompt: text, size: '2048x2048' }),
        (model, text) => ({ model, prompt: text, image_size: '1024x1024' }),
        (model, text) => ({ model, prompt: text, size: '1024x1024' }),
        (model, text) => ({ model, prompt: text })
      ]
    });
    if (result.url) {
      return result.url;
    }
    if (result.errors.length > 0) {
      const last = result.errors[result.errors.length - 1];
      config._last_image_error = last;
    }
    return buildMockUrl();
  }

  if (provider === 'huoshan' || provider === 'volcengine' || provider === 'ark') {
    if (!imageApiKey) {
      return buildMockUrl();
    }
    const modelCandidates = Array.from(new Set([imageModel, ...fallbackModels, 'doubao-seedream-4-0-250828']));
    const result = await requestImageWithFallback({
      endpoint: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
      provider,
      imageApiKey,
      modelCandidates,
      prompt,
      payloadBuilders: [
        (model, text) => ({ model, prompt: text, size: '2048x2048' }),
        (model, text) => ({ model, prompt: text, size: '1024x1024' }),
        (model, text) => ({ model, prompt: text, size: '768x768' }),
        (model, text) => ({ model, prompt: text })
      ]
    });
    if (result.url) {
      return result.url;
    }
    if (result.errors.length > 0) {
      const last = result.errors[result.errors.length - 1];
      config._last_image_error = last;
    }
    return buildMockUrl();
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
