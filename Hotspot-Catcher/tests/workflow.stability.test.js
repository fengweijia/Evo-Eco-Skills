const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { generateOpinions } = require('../utils/ai.js');
const { generateImageCandidates } = require('../utils/image.js');
const { fetchHotspots } = require('../fetch.js');

test('非mock AI配置下仍能产出观点兜底', async () => {
  const opinions = await generateOpinions(
    { keyword: '柑橘', title: '柑橘上热搜了' },
    { ai: { provider: 'openai', api_key: '' } }
  );
  assert.ok(opinions.length > 0);
});

test('未知图片供应商时自动回退到可用图片链接', async () => {
  const results = await generateImageCandidates({
    config: { image: { provider: 'unknown' } },
    title: '柑橘内容封面',
    keyword: '柑橘',
    platform: 'wechat',
    styles: ['写实摄影']
  });

  assert.equal(results.length, 1);
  assert.ok(results[0].imageUrl.startsWith('https://'));
});

test('配置生态复用数据源后优先返回复用热点', async () => {
  const fixturePath = path.join(__dirname, 'fixtures-hotspots.json');
  fs.writeFileSync(
    fixturePath,
    JSON.stringify([
      {
        title: 'GitHub 柑橘热点案例',
        views: 88000,
        comments: 1200,
        platform: 'github',
        keyword: '柑橘',
        url: 'https://github.com/example/citrus-case',
        timestamp: new Date().toISOString()
      }
    ], null, 2)
  );

  try {
    const hotspots = await fetchHotspots({
      keywords: ['柑橘'],
      platforms: ['bilibili'],
      auto_filter: false,
      min_views: 0,
      reuse: {
        enabled: true,
        local_hotspots_file: fixturePath
      }
    });

    assert.equal(hotspots[0].title, 'GitHub 柑橘热点案例');
    assert.equal(hotspots[0].platform, 'github');
  } finally {
    fs.unlinkSync(fixturePath);
  }
});
