const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('feishu - 飞书多维表格存储模块', () => {
  test('SHEET_COLUMNS 应包含必要的列', () => {
    const { SHEET_COLUMNS } = require('../feishu.js');

    const requiredColumns = ['ID', '平台', '关键词', '标题', '原始URL', '抓取内容', '浏览量', '排名', '抓取时间'];
    requiredColumns.forEach(col => {
      assert.ok(SHEET_COLUMNS.includes(col), `应包含列: ${col}`);
    });
  });

  test('formatRecordForSheet 应正确格式化记录', () => {
    const { formatRecordForSheet } = require('../feishu.js');

    const input = {
      id: 'test-123',
      platform: 'bilibili',
      keyword: 'AI副业',
      title: '测试标题',
      url: 'https://example.com',
      content: '测试内容',
      views: 10000,
      rank: 1,
      fetched_at: '2026-03-30T10:00:00Z'
    };

    const result = formatRecordForSheet(input);

    assert.strictEqual(result[0], 'test-123');
    assert.strictEqual(result[1], 'bilibili');
    assert.strictEqual(result[2], 'AI副业');
    assert.strictEqual(result[3], '测试标题');
    assert.strictEqual(result[4], 'https://example.com');
  });

  test('getSheetConfig 应返回正确的配置结构', () => {
    const { getSheetConfig } = require('../feishu.js');

    const config = getSheetConfig();

    assert.ok(config, '应返回配置对象');
    assert.ok(Array.isArray(config.fields), 'fields 应为数组');
  });
});