const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

const { buildRuntimeConfig } = require('../workflow.js');
const { generateImageCandidates } = require('../utils/image.js');

test('未传 --keyword 时应使用config.json中的关键词列表', () => {
  const config = {
    keywords: ['OPC', '一人公司'],
    ai: { provider: 'mock' },
    image: { provider: 'mock' }
  };
  const args = { keyword: '', styles: ['写实摄影'] };

  const runtime = buildRuntimeConfig(config, args);
  assert.deepEqual(runtime.keywords, ['OPC', '一人公司']);
});

test('HUOSHAN 图片供应商应走火山接口返回真实URL', async () => {
  const originalPost = axios.post;
  let calledUrl = '';

  axios.post = async (url) => {
    calledUrl = url;
    return { data: { data: [{ url: 'https://volc.example.com/cover.png' }] } };
  };

  try {
    const results = await generateImageCandidates({
      config: {
        image: {
          provider: 'HUOSHAN',
          api_key: 'test-key',
          model: 'doubao-seedream-5-0-250821'
        }
      },
      title: 'OPC 一人公司封面',
      keyword: 'OPC',
      platform: 'wechat',
      styles: ['写实摄影']
    });

    assert.equal(results[0].imageUrl, 'https://volc.example.com/cover.png');
    assert.ok(calledUrl.includes('ark.cn-beijing.volces.com'));
  } finally {
    axios.post = originalPost;
  }
});

test('volcengine 图片供应商别名应走火山接口返回真实URL', async () => {
  const originalPost = axios.post;
  let calledUrl = '';

  axios.post = async (url) => {
    calledUrl = url;
    return { data: { data: [{ url: 'https://volc.example.com/cover-alias.png' }] } };
  };

  try {
    const results = await generateImageCandidates({
      config: {
        image: {
          provider: 'volcengine',
          api_key: 'test-key',
          model: 'doubao-seedream-5-0-250821'
        }
      },
      title: 'OPC 一人公司封面',
      keyword: 'OPC',
      platform: 'wechat',
      styles: ['写实摄影']
    });

    assert.equal(results[0].imageUrl, 'https://volc.example.com/cover-alias.png');
    assert.ok(calledUrl.includes('ark.cn-beijing.volces.com'));
  } finally {
    axios.post = originalPost;
  }
});
