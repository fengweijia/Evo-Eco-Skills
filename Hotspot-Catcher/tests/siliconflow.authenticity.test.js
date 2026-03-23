const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

const { generateOpinions } = require('../utils/ai.js');
const { generateImageCandidates } = require('../utils/image.js');

test('siliconflow 文案生成应走真实API而非兜底文案', async () => {
  const originalPost = axios.post;

  axios.post = async () => ({
    data: {
      choices: [
        {
          message: {
            content: JSON.stringify([
              { id: 1, title: '激进型', content: '从供应链切入口做内容', angle: '供应链视角' },
              { id: 2, title: '稳健型', content: '从冷链标准做选题', angle: '标准化视角' },
              { id: 3, title: '实战型', content: '从选果流程做拆解', angle: '实操视角' }
            ])
          }
        }
      ]
    }
  });

  try {
    const opinions = await generateOpinions(
      { keyword: '柑橘', title: '柑橘热点' },
      { ai: { provider: 'siliconflow', api_key: 'masked-test-key', model: 'Pro/moonshotai/Kimi-K2.5' } }
    );
    assert.equal(opinions[0].title, '激进型');
  } finally {
    axios.post = originalPost;
  }
});

test('siliconflow 配图生成应返回真实URL而非picsum占位图', async () => {
  const originalPost = axios.post;

  axios.post = async () => ({
    data: {
      data: [{ url: 'https://images.example.com/citrus-style.png' }]
    }
  });

  try {
    const results = await generateImageCandidates({
      config: {
        image: { provider: 'siliconflow', api_key: 'masked-test-key', model: 'Kwai-Kolors/Kolors' }
      },
      title: '柑橘封面',
      keyword: '柑橘',
      platform: 'wechat',
      styles: ['写实摄影']
    });

    assert.equal(results[0].imageUrl, 'https://images.example.com/citrus-style.png');
  } finally {
    axios.post = originalPost;
  }
});
