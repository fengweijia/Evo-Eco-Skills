const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// 注意：由于模块尚未创建，此测试将失败
// 先写测试，再实现模块

describe('parser - 热点JSON解析器', () => {
  test('应能找到最新的热点JSON文件', () => {
    // 导入尚未创建但预期存在的模块
    const { findLatestHotspotsFile } = require('../parser.js');
    const file = findLatestHotspotsFile();
    assert.ok(file, '应返回文件路径');
    assert.ok(file.includes('hotspots-'), '文件名应包含 hotspots-');
    assert.ok(file.endsWith('.json'), '应返回 JSON 文件');
  });

  test('应能解析热点JSON文件', () => {
    const { findLatestHotspotsFile, parseHotspotsFile } = require('../parser.js');
    const file = findLatestHotspotsFile();
    const data = parseHotspotsFile(file);

    assert.ok(data, '应返回数据对象');
    assert.ok(data.version, '应包含 version 字段');
    assert.ok(data.hotspots, '应包含 hotspots 数组');
    assert.ok(Array.isArray(data.hotspots), 'hotspots 应为数组');
  });

  test('应能从热点数据中提取URL信息', () => {
    const { findLatestHotspotsFile, parseHotspotsFile, extractUrls } = require('../parser.js');
    const file = findLatestHotspotsFile();
    const data = parseHotspotsFile(file);
    const urls = extractUrls(data);

    assert.ok(Array.isArray(urls), '应返回数组');
    assert.ok(urls.length > 0, '应包含至少一个URL');

    const first = urls[0];
    assert.ok(first.id, '每条记录应包含 id');
    assert.ok(first.title, '每条记录应包含 title');
    assert.ok(first.url, '每条记录应包含 url');
    assert.ok(first.platform, '每条记录应包含 platform');
  });

  test('应能处理不存在的目录', () => {
    const { findLatestHotspotsFile } = require('../parser.js');
    const file = findLatestHotspotsFile('/nonexistent/directory');
    assert.strictEqual(file, null, '不存在的目录应返回 null');
  });
});