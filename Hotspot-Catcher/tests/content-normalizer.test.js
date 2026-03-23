const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeContents } = require('../utils/content-normalizer.js');

test('视频与图文应统一为NormalizedContent', () => {
  const items = [
    {
      source_type: 'video',
      platform: 'bilibili',
      title: '视频标题',
      transcript: '这是视频字幕',
      views: 1000,
      url: 'https://bilibili.com/video/1'
    },
    {
      source_type: 'text',
      platform: 'xiaohongshu',
      title: '图文标题',
      content: '这是图文正文',
      likes: 88,
      comments: 12,
      url: 'https://xiaohongshu.com/note/1'
    }
  ];

  const result = normalizeContents(items);
  assert.equal(result.length, 2);
  assert.equal(result[0].raw_text, '这是视频字幕');
  assert.equal(result[1].raw_text, '这是图文正文');
  assert.equal(result[0].metrics.views, 1000);
  assert.equal(result[1].metrics.likes, 88);
});
