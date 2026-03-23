const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { loadEnvFile } = require('../utils/env.js');
const { generateImageCandidates } = require('../utils/image.js');

loadEnvFile();

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function resolveAi(config) {
  return {
    apiKey:
      config.ai?.api_key ||
      process.env.SILICONFLOW_API_KEY ||
      process.env.AI_API_KEY ||
      '',
    model: config.ai?.model || process.env.AI_MODEL || 'Pro/moonshotai/Kimi-K2.5'
  };
}

function resolveImage(config) {
  return {
    provider: String(config.image?.provider || process.env.IMAGE_PROVIDER || 'siliconflow').toLowerCase(),
    apiKey:
      config.image?.api_key ||
      process.env.SILICONFLOW_IMAGE_API_KEY ||
      process.env.SILICONFLOW_API_KEY ||
      process.env.IMAGE_API_KEY ||
      '',
    model: config.image?.model || process.env.IMAGE_MODEL || 'Kwai-Kolors/Kolors'
  };
}

async function probeChat(ai) {
  if (!ai.apiKey) {
    return { status: 'skipped', reason: 'missing_api_key' };
  }
  try {
    const response = await axios.post(
      'https://api.siliconflow.cn/v1/chat/completions',
      {
        model: ai.model,
        messages: [{ role: 'user', content: '返回ok' }]
      },
      {
        headers: {
          Authorization: `Bearer ${ai.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );
    return { status: 'ok', hasContent: Boolean(response.data?.choices?.[0]?.message?.content) };
  } catch (error) {
    return {
      status: 'error',
      http: error.response?.status || null,
      message: error.response?.data?.message || error.message,
      detail: error.response?.data || null
    };
  }
}

async function probeImage(image) {
  if (!image.apiKey) {
    return { status: 'skipped', reason: 'missing_api_key' };
  }
  try {
    const results = await generateImageCandidates({
      config: {
        image: {
          provider: image.provider,
          api_key: image.apiKey,
          model: image.model
        }
      },
      title: '探针测试图',
      keyword: '探针',
      platform: 'wechat',
      styles: ['写实摄影']
    });
    return {
      status: results[0]?.imageUrl ? 'ok' : 'error',
      hasUrl: Boolean(results[0]?.imageUrl),
      imageUrl: results[0]?.imageUrl || ''
    };
  } catch (error) {
    return {
      status: 'error',
      http: error.response?.status || null,
      message: error.response?.data?.message || error.message,
      detail: error.response?.data || null
    };
  }
}

async function main() {
  const config = readConfig();
  const ai = resolveAi(config);
  const image = resolveImage(config);

  const chat = await probeChat(ai);
  const imageResult = await probeImage(image);

  console.log(JSON.stringify({ chat, image: imageResult }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
