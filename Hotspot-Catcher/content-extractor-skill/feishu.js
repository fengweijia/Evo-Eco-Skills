const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * 飞书多维表格列定义
 */
const SHEET_COLUMNS = [
  'ID',
  '平台',
  '关键词',
  '标题',
  '原始URL',
  '抓取内容',
  '浏览量',
  '排名',
  '抓取时间'
];

/**
 * 获取表格配置（字段定义）
 * @returns {object} 表格配置
 */
function getSheetConfig() {
  return {
    fields: SHEET_COLUMNS.map((name, index) => ({
      field_name: name,
      field_type: index === 5 ? 'text' : 'text' // 内容字段为富文本
    })),
    sheet_name: '热点分析'
  };
}

/**
 * 格式化单条记录为飞书表格行数据
 * @param {object} record - 原始记录
 * @returns {Array} 格式化后的行数据
 */
function formatRecordForSheet(record) {
  return [
    record.id || '',
    record.platform || '',
    record.keyword || '',
    record.title || '',
    record.url || '',
    record.content || '',
    record.views?.toString() || '0',
    record.rank?.toString() || '0',
    record.fetched_at || new Date().toISOString()
  ];
}

/**
 * 批量格式化记录
 * @param {Array} records - 记录数组
 * @returns {Array<Array>} 格式化后的行数据数组
 */
function formatRecordsForSheet(records) {
  return records.map(formatRecordForSheet);
}

/**
 * 检查 lark CLI 可用性
 * @returns {boolean} 是否可用
 */
async function isLarkCliAvailable() {
  try {
    await execPromise('npx @larksuite/cli --version', { stdio: 'ignore', timeout: 30000 });
    console.log('✅ lark CLI 可用');
    return true;
  } catch {
    console.warn('⚠️ lark CLI 不可用');
    return false;
  }
}

/**
 * 初始化飞书多维表格（使用 lark-sheets skill）
 * @param {string} spreadsheetToken - 表格Token (可选)
 * @param {string} sheetName - 工作表名称
 * @returns {Promise<object>} 创建结果
 */
async function initFeishuSheet(spreadsheetToken, sheetName = '热点分析') {
  const config = getSheetConfig();

  // 如果已提供 spreadsheetToken，跳过创建直接返回
  if (spreadsheetToken) {
    console.log('✅ 使用已有飞书表格:', spreadsheetToken);
    return {
      mode: 'feishu',
      spreadsheet_token: spreadsheetToken,
      sheet_name: sheetName
    };
  }

  // 如果 lark CLI 可用，创建新表格
  if (await isLarkCliAvailable()) {
    try {
      // 调用 lark-sheets +create 创建工作表
      const headers = JSON.stringify(SHEET_COLUMNS);
      const result = await execPromise(
        `npx @larksuite/cli sheets +create --title "热点分析_${sheetName}_${new Date().toISOString().slice(0,10)}" --headers '${headers}'`,
        { stdio: 'pipe', timeout: 60000 }
      );
      const data = JSON.parse(result.stdout);
      console.log('✅ 飞书表格创建成功:', data.data?.url || '');
      return {
        mode: 'feishu',
        spreadsheet_token: data.data?.spreadsheetToken || data.spreadsheetToken,
        sheet_name: sheetName
      };
    } catch (err) {
      console.warn(`⚠️ 创建飞书表格失败: ${err.message}`);
    }
  }

  // 降级：保存本地CSV文件作为备份
  console.log('⚠️ 降级为本地CSV备份');
  return {
    mode: 'local_csv',
    sheet_name: sheetName,
    config
  };
}

/**
 * 追加记录到飞书多维表格
 * @param {string} spreadsheetToken - 表格Token
 * @param {Array} records - 记录数组
 * @returns {Promise<object>} 追加结果
 */
async function appendRecords(spreadsheetToken, records) {
  const formattedRecords = formatRecordsForSheet(records);

  // 如果 lark CLI 可用，使用它追加数据
  if (await isLarkCliAvailable() && spreadsheetToken) {
    try {
      const result = await execPromise(
        `npx @larksuite/cli sheets +append --spreadsheet-token "${spreadsheetToken}" --values '${JSON.stringify(formattedRecords)}'`,
        { stdio: 'pipe', timeout: 60000 }
      );
      const data = JSON.parse(result.stdout);
      console.log('✅ 数据已添加到飞书表格');
      return {
        mode: 'feishu',
        spreadsheet_token: spreadsheetToken,
        updated_cells: data.data?.updates?.updatedCells || 0,
        count: records.length
      };
    } catch (err) {
      console.warn(`⚠️ 追加飞书数据失败: ${err.message}`);
    }
  }

  // 降级：保存到本地CSV
  const csvPath = saveToLocalCSV(formattedRecords);
  return {
    mode: 'local_csv',
    saved_path: csvPath,
    count: records.length
  };
}

/**
 * 保存到本地CSV文件（降级方案）
 * @param {Array<Array>} data - 表格数据
 * @returns {string} 保存路径
 */
function saveToLocalCSV(data) {
  const outputDir = path.join(process.cwd(), 'output', 'feishu');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const filepath = path.join(outputDir, `hotspots-${timestamp}.csv`);

  // 添加表头
  const csvContent = [
    SHEET_COLUMNS.join(','),
    ...data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  fs.writeFileSync(filepath, csvContent, 'utf-8');
  console.log(`✅ 已保存到: ${filepath}`);

  return filepath;
}

/**
 * 导出数据为飞书API可用的JSON格式
 * @param {Array} records - 记录数组
 * @returns {object} 飞书API格式的数据
 */
function exportForFeishuAPI(records) {
  return {
    data: records.map(record => ({
      fields: {
        'ID': record.id,
        '平台': record.platform,
        '关键词': record.keyword,
        '标题': record.title,
        '原始URL': record.url,
        '抓取内容': record.content,
        '浏览量': record.views,
        '排名': record.rank,
        '抓取时间': record.fetched_at
      }
    }))
  };
}

module.exports = {
  SHEET_COLUMNS,
  getSheetConfig,
  formatRecordForSheet,
  formatRecordsForSheet,
  initFeishuSheet,
  appendRecords,
  saveToLocalCSV,
  exportForFeishuAPI,
  isLarkCliAvailable
};