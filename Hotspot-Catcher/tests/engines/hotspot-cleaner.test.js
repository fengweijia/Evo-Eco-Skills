const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// 加载配置
const configPath = path.join(process.cwd(), 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 待测试的模块 - 先用相对路径导入
const { fetchHotspots } = require('../../src/engines/hotspot/index.js');

// 清洗器模块 (尚未创建)
let cleaner;
try {
  cleaner = require('../../src/engines/hotspot/cleaner.js');
} catch (e) {
  // 模块不存在，稍后创建
}

describe('热点数据清洗与存储 - TDD开发', () => {

  describe('1. 清洗器模块可用性', () => {
    test('cleaner 模块应可导入', () => {
      assert.ok(cleaner, 'cleaner 模块应存在');
    });
  });

  describe('2. 热点数据清洗', () => {
    test('应能清洗标题中的特殊字符', () => {
      const dirtyTitle = '这是标题 <script>alert(1)</script> &amp; 更多内容';
      const cleaned = cleaner.cleanTitle(dirtyTitle);
      assert.ok(!cleaned.includes('<script>'), '应去除 script 标签');
      assert.ok(!cleaned.includes('&amp;'), '应转换 HTML 实体');
    });

    test('应能去除 URL 中的跟踪参数', () => {
      const dirtyUrl = 'https://example.com?utm_source=test&fbclid=abc123';
      const cleaned = cleaner.cleanUrl(dirtyUrl);
      assert.ok(!cleaned.includes('utm_source'), '应去除 utm 参数');
      assert.ok(!cleaned.includes('fbclid'), '应去除 fbclid 参数');
    });

    test('应能提取域名作为来源', () => {
      const url = 'https://www.bilibili.com/video/BV123456/';
      const domain = cleaner.extractDomain(url);
      assert.equal(domain, 'bilibili.com', '应正确提取域名');
    });

    test('应能处理缺失或无效的 URL', () => {
      const invalidUrl = '';
      const cleaned = cleaner.cleanUrl(invalidUrl);
      assert.equal(cleaned, '', '空 URL 应返回空字符串');

      const nullUrl = null;
      const cleaned2 = cleaner.cleanUrl(nullUrl);
      assert.equal(cleaned2, '', 'null URL 应返回空字符串');
    });
  });

  describe('3. 格式规范化', () => {
    test('应生成标准化的热点数据', () => {
      const rawHotspot = {
        title: '测试标题',
        url: 'https://bilibili.com/test',
        views: 10000,
        platform: 'bilibili',
        keyword: '测试'
      };

      const normalized = cleaner.normalizeForStorage(rawHotspot);

      // 验证必需字段
      assert.ok(normalized.id, '应有 id 字段');
      assert.ok(normalized.title, '应有 title 字段');
      assert.ok(normalized.url, '应有 url 字段');
      assert.ok(normalized.platform, '应有 platform 字段');
      assert.ok(normalized.keyword, '应有 keyword 字段');
      assert.ok(normalized.fetched_at, '应有 fetched_at 时间戳');
    });

    test('规范化数据应包含元数据', () => {
      const rawHotspot = {
        title: '测试标题',
        url: 'https://bilibili.com/test',
        views: 10000,
        platform: 'bilibili',
        keyword: '测试'
      };

      const normalized = cleaner.normalizeForStorage(rawHotspot);

      // 验证元数据
      assert.ok(normalized.metadata, '应包含 metadata');
      assert.ok(normalized.metadata.source, '应有来源信息');
      assert.ok(normalized.metadata.fetched_at, '应有抓取时间');
    });
  });

  describe('4. 本地存储', () => {
    test('应能保存热点数据到 JSON 文件', async () => {
      const hotspots = [
        {
          title: '测试热点1',
          url: 'https://bilibili.com/1',
          views: 10000,
          platform: 'bilibili',
          keyword: '测试'
        }
      ];

      const outputPath = await cleaner.saveToJSON(hotspots, { outputDir: path.join(process.cwd(), 'output', 'test') });

      assert.ok(fs.existsSync(outputPath), '输出文件应存在');
      assert.ok(outputPath.endsWith('.json'), '输出应为 JSON 文件');

      // 验证文件内容
      const savedData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      assert.ok(savedData.hotspots, '保存的数据应包含 hotspots 字段');
      assert.ok(Array.isArray(savedData.hotspots), 'hotspots 应为数组');
      assert.ok(savedData.hotspots.length > 0, '保存的数据不应为空');

      // 清理测试文件
      fs.unlinkSync(outputPath);
    });

    test('存储路径应包含日期和关键词', async () => {
      const hotspots = [
        {
          title: '测试热点',
          url: 'https://bilibili.com/test',
          views: 10000,
          platform: 'bilibili',
          keyword: 'OPC'
        }
      ];

      const outputPath = await cleaner.saveToJSON(hotspots);

      // 验证路径包含日期
      const date = new Date().toISOString().slice(0, 10);
      assert.ok(outputPath.includes(date), '文件名应包含日期');

      // 清理测试文件
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });
  });

  describe('5. 集成: 采集 -> 清洗 -> 存储', () => {
    test('应能完整执行采集、清洗、存储流程', async () => {
      // 1. 采集热点
      const rawHotspots = await fetchHotspots(['测试'], ['bilibili'], { topN: 2 });

      // 2. 清洗数据
      const cleanedHotspots = rawHotspots.map(h => cleaner.normalizeForStorage(h));

      // 3. 存储
      const outputPath = await cleaner.saveToJSON(cleanedHotspots);

      // 4. 验证
      assert.ok(fs.existsSync(outputPath), '输出文件应存在');

      const savedData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      assert.ok(savedData.hotspots, '应包含 hotspots 字段');
      assert.ok(savedData.hotspots.length > 0, '应保存热点数据');

      // 验证每条数据都是规范化的
      savedData.hotspots.forEach(h => {
        assert.ok(h.id, '每条数据应有 id');
        assert.ok(h.title, '每条数据应有 title');
        assert.ok(h.fetched_at, '每条数据应有 fetched_at');
      });

      console.log(`  ✓ 集成测试通过: 保存了 ${savedData.hotspots.length} 条热点到 ${path.basename(outputPath)}`);

      // 清理测试文件
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });
  });

  describe('6. 第2模块素材验证', () => {
    test('存储的数据应能被第2模块使用', async () => {
      // 1. 采集热点
      const rawHotspots = await fetchHotspots(['测试'], ['bilibili'], { topN: 1 });

      // 2. 清洗存储
      const cleanedHotspots = rawHotspots.map(h => cleaner.normalizeForStorage(h));
      const outputPath = await cleaner.saveToJSON(cleanedHotspots);

      // 3. 读取并验证可用于第2模块
      const savedData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

      // 验证第2模块需要的字段
      const content = savedData.hotspots[0];
      assert.ok(content.id, '第2模块需要 id');
      assert.ok(content.platform, '第2模块需要 platform');
      assert.ok(content.keyword, '第2模块需要 keyword');
      assert.ok(content.title, '第2模块需要 title');
      assert.ok(content.url, '第2模块需要 url');

      console.log('  ✓ 数据格式可用于第2模块爆款拆解引擎');

      // 清理测试文件
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });
  });
});
