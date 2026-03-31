const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// 加载配置
const configPath = path.join(process.cwd(), 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const { fetchHotspots } = require('../../src/engines/hotspot/index.js');
const { fetchFromPlatform, isFirecrawlAvailable, PLATFORM_SEARCH_URLS } = require('../../src/engines/hotspot/fetcher.js');
const { normalizeHotspot } = require('../../src/engines/hotspot/normalizer.js');
const { selectTopN } = require('../../src/engines/hotspot/selector.js');

describe('热点信息采集引擎 - 单元测试', () => {

  describe('1. 配置文件加载', () => {
    test('应正确加载 keywords 配置', () => {
      assert.ok(Array.isArray(config.keywords));
      assert.ok(config.keywords.length > 0);
      console.log(`  ✓ keywords: ${config.keywords.join(', ')}`);
    });

    test('应正确加载 platforms 配置', () => {
      assert.ok(Array.isArray(config.platforms));
      assert.ok(config.platforms.length > 0);
      console.log(`  ✓ platforms: ${config.platforms.join(', ')}`);
    });
  });

  describe('2. Firecrawl 可用性检测', () => {
    test('isFirecrawlAvailable 应返回路径或 null', () => {
      const result = isFirecrawlAvailable();
      // 结果可能是路径字符串或 null
      assert.ok(result === null || typeof result === 'string');
    });
  });

  describe('3. 平台 URL 映射', () => {
    test('PLATFORM_SEARCH_URLS 应包含配置的 platforms', () => {
      config.platforms.forEach(platform => {
        assert.ok(PLATFORM_SEARCH_URLS[platform], `平台 ${platform} 应有对应的搜索 URL`);
      });
      console.log(`  ✓ 所有配置平台都有对应的搜索 URL`);
    });

    test('应支持 bilibili, xiaohongshu 等主流平台', () => {
      const expectedPlatforms = ['bilibili', 'xiaohongshu', 'weibo', 'zhihu', 'douyin', 'toutiao'];
      expectedPlatforms.forEach(p => {
        assert.ok(PLATFORM_SEARCH_URLS[p], `应支持平台: ${p}`);
      });
    });
  });

  describe('4. fetchFromPlatform - 单平台抓取', () => {
    test('应能抓取 bilibili 平台的热点', async () => {
      const result = await fetchFromPlatform('bilibili', config.keywords[0]);
      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0);
      console.log(`  ✓ bilibili 抓取到 ${result.length} 条热点`);
    });

    test('应能抓取 xiaohongshu 平台的热点', async () => {
      const result = await fetchFromPlatform('xiaohongshu', config.keywords[0]);
      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0);
      console.log(`  ✓ xiaohongshu 抓取到 ${result.length} 条热点`);
    });

    test('抓取的热点应包含必要字段', async () => {
      const result = await fetchFromPlatform('bilibili', '测试');
      const hotspot = result[0];
      assert.ok(hotspot.title, '应包含 title 字段');
      assert.ok(hotspot.url, '应包含 url 字段');
      assert.ok(typeof hotspot.views === 'number', '应包含 views 数字字段');
    });
  });

  describe('5. fetchHotspots - 多关键词多平台抓取', () => {
    test('应能抓取配置中的所有关键词和平台', async () => {
      const result = await fetchHotspots(
        config.keywords,
        config.platforms,
        { topN: 3 }
      );
      assert.ok(Array.isArray(result));
      // 每个关键词 * 每个平台 * topN
      const expectedMin = Math.min(config.keywords.length, 2) * Math.min(config.platforms.length, 2) * 3;
      assert.ok(result.length >= expectedMin, `应至少获取 ${expectedMin} 条热点，实际: ${result.length}`);
      console.log(`  ✓ 获取到 ${result.length} 条热点`);
    });

    test('热点应按热度排序', async () => {
      const result = await fetchHotspots(['测试'], ['bilibili'], { topN: 5 });
      for (let i = 1; i < result.length; i++) {
        assert.ok(result[i - 1].views >= result[i].views, '热点应按 views 降序排列');
      }
      console.log('  ✓ 热点已按热度排序');
    });

    test('每个热点应有正确的排名', async () => {
      const result = await fetchHotspots(['测试'], ['bilibili'], { topN: 5 });
      result.forEach((h, i) => {
        assert.ok(typeof h.rank === 'number', 'rank 应为数字');
        assert.ok(h.rank > 0, 'rank 应大于 0');
      });
      console.log(`  ✓ 排名范围: ${result[0]?.rank} - ${result[result.length - 1]?.rank}`);
    });
  });

  describe('6. normalizeHotspot - 热点标准化', () => {
    test('应正确标准化热点数据', () => {
      const rawData = {
        title: '测试热点',
        url: 'https://example.com/1',
        views: 10000
      };
      const normalized = normalizeHotspot(rawData, 'bilibili', '测试');

      assert.equal(normalized.platform, 'bilibili');
      assert.equal(normalized.keyword, '测试');
      assert.equal(normalized.title, '测试热点');
      assert.equal(normalized.url, 'https://example.com/1');
      assert.equal(normalized.views, 10000);
      assert.ok(normalized.id, '应生成 id');
      assert.ok(normalized.raw, '应保留原始数据');
    });

    test('应处理缺失的字段', () => {
      const rawData = { title: '测试' };
      const normalized = normalizeHotspot(rawData, 'bilibili', '测试');

      assert.equal(normalized.views, 0, '缺失的 views 应默认为 0');
    });
  });

  describe('7. selectTopN - TOP N 选取', () => {
    test('应正确选取 TOP N', () => {
      const hotspots = [
        { views: 100, title: 'C' },
        { views: 300, title: 'A' },
        { views: 200, title: 'B' }
      ];
      const result = selectTopN(hotspots, 2);

      assert.equal(result.length, 2);
      assert.equal(result[0].title, 'A');
      assert.equal(result[1].title, 'B');
    });

    test('应正确设置排名', () => {
      const hotspots = [
        { views: 100, title: 'C' },
        { views: 300, title: 'A' },
        { views: 200, title: 'B' }
      ];
      const result = selectTopN(hotspots, 3);

      assert.equal(result[0].rank, 1);
      assert.equal(result[1].rank, 2);
      assert.equal(result[2].rank, 3);
    });
  });

  describe('8. 输出结构验证', () => {
    test('热点应包含统一的结构化字段', async () => {
      const result = await fetchHotspots([config.keywords[0]], [config.platforms[0]], { topN: 1 });
      const hotspot = result[0];

      // 验证必需字段
      const requiredFields = ['id', 'platform', 'keyword', 'title', 'url', 'views', 'rank', 'raw'];
      requiredFields.forEach(field => {
        assert.ok(field in hotspot, `应包含字段: ${field}`);
      });

      // 验证字段类型
      assert.equal(typeof hotspot.id, 'string');
      assert.equal(typeof hotspot.platform, 'string');
      assert.equal(typeof hotspot.keyword, 'string');
      assert.equal(typeof hotspot.title, 'string');
      assert.equal(typeof hotspot.url, 'string');
      assert.equal(typeof hotspot.views, 'number');
      assert.equal(typeof hotspot.rank, 'number');
      assert.equal(typeof hotspot.raw, 'object');

      console.log(`  ✓ 输出结构验证通过: ${JSON.stringify(Object.keys(hotspot))}`);
    });
  });

  describe('9. 错误处理', () => {
    test('未知平台应使用模拟数据', async () => {
      const result = await fetchFromPlatform('unknown_platform', '测试');
      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0);
      console.log('  ✓ 未知平台正确回退到模拟数据');
    });

    test('空关键词应能正常处理', async () => {
      const result = await fetchHotspots([''], ['bilibili'], { topN: 2 });
      assert.ok(Array.isArray(result));
      console.log('  ✓ 空关键词处理正常');
    });
  });

  describe('10. 集成测试 - 使用配置文件', () => {
    test('使用配置文件中的 keywords 和 platforms', async () => {
      const keywords = config.keywords.slice(0, 2); // 取前2个关键词
      const platforms = config.platforms.slice(0, 2); // 取前2个平台

      const result = await fetchHotspots(keywords, platforms, { topN: 3 });

      assert.ok(result.length > 0, '应返回结果');

      // 验证所有热点都来自配置的关键词和平台
      result.forEach(h => {
        assert.ok(keywords.includes(h.keyword), `关键词 ${h.keyword} 应在配置中`);
        assert.ok(platforms.includes(h.platform), `平台 ${h.platform} 应在配置中`);
      });

      console.log(`  ✓ 集成测试通过: ${result.length} 条热点 from ${keywords.join(', ')} x ${platforms.join(', ')}`);
    });
  });
});