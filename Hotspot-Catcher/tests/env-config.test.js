const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

const { generateOpinions } = require('../utils/ai.js');
const { generateImageCandidates } = require('../utils/image.js');

test('AI key为空时应回退读取环境变量', async () => {
  const originalPost = axios.post;
  const originalEnv = process.env.SILICONFLOW_API_KEY;
  process.env.SILICONFLOW_API_KEY = 'env-ai-key';

  let authHeader = '';
  axios.post = async (url, body, options) => {
    authHeader = options?.headers?.Authorization || '';
    return {
      data: {
        choices: [{ message: { content: '[{"id":1,"title":"A","content":"B","angle":"C"}]' } }]
      }
    };
  };

  try {
    const opinions = await generateOpinions(
      { keyword: '柑橘', title: '柑橘热点' },
      { ai: { provider: 'siliconflow', api_key: '', model: 'Pro/moonshotai/Kimi-K2.5' } }
    );
    assert.equal(opinions[0].title, 'A');
    assert.equal(authHeader, 'Bearer env-ai-key');
  } finally {
    axios.post = originalPost;
    process.env.SILICONFLOW_API_KEY = originalEnv;
  }
});

test('图片key为空时应回退读取环境变量', async () => {
  const originalPost = axios.post;
  const originalEnv = process.env.SILICONFLOW_IMAGE_API_KEY;
  process.env.SILICONFLOW_IMAGE_API_KEY = 'env-image-key';

  let authHeader = '';
  axios.post = async (url, body, options) => {
    authHeader = options?.headers?.Authorization || '';
    return { data: { data: [{ url: 'https://images.example.com/from-env.png' }] } };
  };

  try {
    const results = await generateImageCandidates({
      config: {
        image: { provider: 'siliconflow', api_key: '', model: 'Kwai-Kolors/Kolors' }
      },
      title: '柑橘封面',
      keyword: '柑橘',
      platform: 'wechat',
      styles: ['写实摄影']
    });
    assert.equal(results[0].imageUrl, 'https://images.example.com/from-env.png');
    assert.equal(authHeader, 'Bearer env-image-key');
  } finally {
    axios.post = originalPost;
    process.env.SILICONFLOW_IMAGE_API_KEY = originalEnv;
  }
});
