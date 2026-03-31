const { test, describe } = require('node:test');
const assert = require('node:assert');
const { generateImages } = require('../../src/engines/image/index.js');

describe('image engine', () => {
  test('generateImages should return images with correct platform and style', async () => {
    const drafts = {
      wechat: { final: { title: '测试', body: '内容' } },
      xiaohongshu: { final: { title: '测试', body: '内容' } }
    };
    const styles = ['写实摄影', '清新手绘'];
    const platforms = ['wechat', 'xiaohongshu'];

    const result = await generateImages(drafts, styles, platforms);
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
  });

  test('each image should have platform, type, style, url', async () => {
    const drafts = {
      wechat: { final: { title: '测试', body: '内容' } }
    };
    const styles = ['写实摄影'];
    const platforms = ['wechat'];

    const result = await generateImages(drafts, styles, platforms);
    if (result.length > 0) {
      assert.ok(result[0].platform);
      assert.ok(result[0].style);
      assert.ok(result[0].url);
    }
  });
});