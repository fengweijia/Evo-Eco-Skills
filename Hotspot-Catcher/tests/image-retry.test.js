const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

const { generateImageCandidates } = require('../utils/image.js');

test('siliconflow模型400时应自动回退到可生成模型', async () => {
  const originalPost = axios.post;
  const calls = [];

  axios.post = async (url, body) => {
    calls.push({ url, body });
    if (body.model !== 'Kwai-Kolors/Kolors') {
      const error = new Error('Request failed with status code 400');
      error.response = { status: 400, data: { message: 'model does not support generation' } };
      throw error;
    }
    return { data: { data: [{ url: 'https://images.example.com/retried.png' }] } };
  };

  try {
    const results = await generateImageCandidates({
      config: {
        image: {
          provider: 'siliconflow',
          api_key: 'test-key',
          model: 'Qwen/Qwen-Image-Edit-2509'
        }
      },
      title: '测试封面',
      keyword: 'OPC',
      platform: 'wechat',
      styles: ['写实摄影']
    });

    assert.equal(results[0].imageUrl, 'https://images.example.com/retried.png');
    assert.ok(calls.length >= 2);
    assert.equal(calls[0].body.model, 'Qwen/Qwen-Image-Edit-2509');
    assert.ok(calls.some(item => item.body.model === 'Kwai-Kolors/Kolors'));
  } finally {
    axios.post = originalPost;
  }
});

test('图片接口提示最小像素要求时应自动升级到2048尺寸重试', async () => {
  const originalPost = axios.post;
  const calls = [];

  axios.post = async (url, body) => {
    calls.push(body);
    const size = body.image_size || body.size || '';
    if (size === '2048x2048') {
      return { data: { data: [{ url: 'https://images.example.com/2048.png' }] } };
    }
    const error = new Error('Request failed with status code 400');
    error.response = {
      status: 400,
      data: {
        error: { message: 'image size must be at least 3686400 pixels' }
      }
    };
    throw error;
  };

  try {
    const results = await generateImageCandidates({
      config: {
        image: {
          provider: 'siliconflow',
          api_key: 'test-key',
          model: 'Qwen/Qwen-Image-Edit-2509'
        }
      },
      title: '尺寸升级测试',
      keyword: 'OPC',
      platform: 'wechat',
      styles: ['写实摄影']
    });
    assert.equal(results[0].imageUrl, 'https://images.example.com/2048.png');
    assert.ok(calls.some(item => item.image_size === '2048x2048' || item.size === '2048x2048'));
  } finally {
    axios.post = originalPost;
  }
});

test('图片接口失败时应透出结构化错误码与明确信息', async () => {
  const originalPost = axios.post;
  axios.post = async () => {
    const error = new Error('Request failed with status code 404');
    error.response = {
      status: 404,
      data: {
        error: {
          code: 'ModelNotOpen',
          message: 'Your account has not activated the model'
        }
      }
    };
    throw error;
  };

  try {
    const config = {
      image: {
        provider: 'volcengine',
        api_key: 'test-key',
        model: 'doubao-seedream-4-0-250828',
        fallback_models: []
      }
    };
    const results = await generateImageCandidates({
      config,
      title: '错误透出测试',
      keyword: 'OPC',
      platform: 'wechat',
      styles: ['写实摄影']
    });
    assert.ok(results[0].imageUrl.includes('picsum.photos'));
    assert.equal(config._last_image_error.code, 'ModelNotOpen');
    assert.equal(config._last_image_error.message, 'Your account has not activated the model');
  } finally {
    axios.post = originalPost;
  }
});
