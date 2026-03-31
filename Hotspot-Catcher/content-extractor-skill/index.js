/**
 * Content Extractor Skill - 热点内容提取与分析引擎
 *
 * 输入: 热点抓取引擎的JSON文件 (output/hotspots/hotspots-*.json)
 * 输出:
 *   1. 飞书多维表格/CVS文件存储
 *   2. 爆款结构化拆解结果
 *   3. 更新的Prompt版本（迭代优化）
 */

const { findLatestHotspotsFile, parseHotspotsFile, extractUrls } = require('./parser');
const { batchFetch, getMockContent } = require('./crawler');
const { initFeishuSheet, appendRecords, SHEET_COLUMNS, formatRecordsForSheet, saveToLocalCSV } = require('./feishu');
const { loadPrompt, getAvailablePrompts, analyzeContent, updatePromptVersion, saveAnalysisResults } = require('./analyzer');

/**
 * 运行内容提取与分析流程
 * @param {object} options - 配置选项
 * @returns {Promise<object>} 执行结果
 */
async function runContentExtractor(options = {}) {
  console.log('🚀 内容提取与分析引擎启动\n');

  const defaultOptions = {
    hotspotsDir: options.hotspotsDir || 'output/hotspots',
    feishuToken: options.feishuToken || process.env.FEISHU_SPREADSHEET_TOKEN,
    aiApiKey: options.aiApiKey || process.env.SILICONFLOW_API_KEY,
    aiModel: options.aiModel || 'Pro/MiniMaxAI/MiniMax-M2.5',
    promptTemplate: options.promptTemplate || 'default.md',
    maxConcurrent: options.maxConcurrent || 3,
    useMockContent: options.useMockContent !== false
  };

  // ========== 步骤1: 读取热点JSON文件 ==========
  console.log('📄 步骤1: 读取热点JSON文件...');
  const jsonFile = findLatestHotspotsFile(defaultOptions.hotspotsDir);

  if (!jsonFile) {
    throw new Error(`未找到热点JSON文件，请先运行热点抓取引擎。目录: ${defaultOptions.hotspotsDir}`);
  }

  const hotspotsData = parseHotspotsFile(jsonFile);
  const urls = extractUrls(hotspotsData);
  console.log(`   ✓ 读取到 ${urls.length} 个热点链接`);
  console.log(`   📁 文件: ${jsonFile}\n`);

  // ========== 步骤2: 抓取URL内容 ==========
  console.log('🔥 步骤2: 抓取URL内容...');
  console.log(`   当前prompt模板: ${defaultOptions.promptTemplate}`);

  let fetchedContents;
  try {
    fetchedContents = await batchFetch(urls, {
      maxConcurrent: defaultOptions.maxConcurrent,
      timeout: 30000
    });
  } catch (err) {
    console.warn(`   ⚠️ 抓取失败: ${err.message}，使用模拟数据`);
    if (defaultOptions.useMockContent) {
      fetchedContents = urls.map(url => getMockContent(url));
    }
  }

  // 合并内容
  const enriched = urls.map((url, i) => ({
    ...url,
    content: fetchedContents[i]?.content || (defaultOptions.useMockContent ? getMockContent(url).content : '')
  }));

  console.log(`   ✓ 成功获取 ${enriched.filter(e => e.content).length} 条内容\n`);

  // ========== 步骤3: 存储到飞书/本地 ==========
  console.log('📊 步骤3: 存储数据...');

  let storageResult;
  if (defaultOptions.feishuToken) {
    try {
      storageResult = await initFeishuSheet(defaultOptions.feishuToken);
      const writeResult = await appendRecords(defaultOptions.feishuToken, enriched);
      console.log(`   ✓ 已保存到飞书多维表格: ${writeResult.saved_path || 'unknown'}`);
    } catch (err) {
      console.warn(`   ⚠️ 飞书保存失败: ${err.message}，使用本地CSV`);
      const csvPath = saveToLocalCSV(formatRecordsForSheet(enriched));
      storageResult = { mode: 'local_csv', path: csvPath };
    }
  } else {
    // 默认保存到本地CSV
    const csvPath = saveToLocalCSV(formatRecordsForSheet(enriched));
    storageResult = { mode: 'local_csv', path: csvPath };
    console.log(`   ✓ 已保存到本地CSV: ${csvPath}`);
  }

  // ========== 步骤4: 爆款结构化拆解 ==========
  console.log('\n🔍 步骤4: 爆款结构化拆解...');
  console.log(`   使用AI模型: ${defaultOptions.aiModel}`);

  // 查找可用的prompts
  const availablePrompts = getAvailablePrompts();
  console.log(`   可用模板数量: ${availablePrompts.length}`);

  const analyses = [];
  const writeMethods = []; // 收集新的写作方法论

  for (let i = 0; i < Math.min(enriched.length, 5); i++) { // 限制分析数量
    const item = enriched[i];
    if (!item.content || item.content.length < 10) continue;

    console.log(`   分析 ${i + 1}/${Math.min(enriched.length, 5)}: ${item.title.substring(0, 20)}...`);

    const analysis = await analyzeContent(item.content, {
      aiApiKey: defaultOptions.aiApiKey,
      aiModel: defaultOptions.aiModel,
      promptPath: defaultOptions.promptTemplate
    });

    analyses.push({
      ...item,
      structures: analysis,
      analyzed_at: new Date().toISOString()
    });

    // 收集值得迭代的洞察
    if (analysis.hook && analysis.actions?.length > 0) {
      writeMethods.push({
        platform: item.platform,
        hook: analysis.hook,
        actions: analysis.actions,
        cta: analysis.cta
      });
    }
  }

  // 保存分析结果
  const analysisPath = saveAnalysisResults(analyses);
  console.log(`   ✓ 分析结果已保存: ${analysisPath}`);
  console.log(`   ✓ 完成 ${analyses.length} 条内容分析\n`);

  // ========== 步骤5: Prompt迭代优化 ==========
  console.log('✨ 步骤5: Prompt迭代优化...');

  let versionInfo = null;
  if (writeMethods.length > 0 && defaultOptions.aiApiKey) {
    // 提取新的写作方法论并更新prompt
    const newInsight = writeMethods.map(wm =>
      `【${wm.platform}平台】钩子创新: "${wm.hook}" | 行动点: ${wm.actions?.join(', ')} | CTA: ${wm.cta}`
    ).join('\n');

    versionInfo = await updatePromptVersion('insights', writeMethods[0].hook, newInsight);
    console.log(`   ✓ Prompt已迭代更新: v${versionInfo.version}`);
    console.log(`   📁 版本文件: ${versionInfo.path}`);
  } else {
    console.log('   ⏭️ 跳过Prompt迭代（无新洞察或无API Key）');
  }

  // ========== 返回结果 ==========
  return {
    success: true,
    summary: {
      total_hotspots: urls.length,
      analyzed: analyses.length,
      storage: storageResult.mode,
      storage_path: storageResult.path,
      analysis_path: analysisPath
    },
    results: analyses,
    available_prompts: availablePrompts,
    version_info: versionInfo || null
  };
}

/**
 * CLI 入口
 */
async function main() {
  const args = process.argv.slice(2);

  const options = {
    hotspotsDir: args.find(a => a.startsWith('--dir='))?.replace('--dir=', ''),
    feishuToken: args.find(a => a.startsWith('--feishu='))?.replace('--feishu=', ''),
    aiModel: args.find(a => a.startsWith('--model='))?.replace('--model=', ''),
    promptTemplate: args.find(a => a.startsWith('--prompt='))?.replace('--prompt=', ''),
    useMockContent: !args.includes('--no-mock')
  };

  try {
    const result = await runContentExtractor(options);

    console.log('\n' + '='.repeat(50));
    console.log('✅ 内容提取与分析完成！');
    console.log('='.repeat(50));
    console.log(`📊 总热点: ${result.summary.total_hotspots}`);
    console.log(`🔍 已分析: ${result.summary.analyzed}`);
    console.log(`💾 存储模式: ${result.summary.storage}`);
    console.log(`📁 存储路径: ${result.summary.storage_path}`);
    console.log(`📋 分析报告: ${result.summary.analysis_path}`);

    if (result.version_info) {
      console.log(`✨ Prompt版本: v${result.version_info.version}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ 执行失败:', err.message);
    process.exit(1);
  }
}

// 导出模块
module.exports = {
  runContentExtractor,
  loadPrompt,
  getAvailablePrompts,
  analyzeContent,
  updatePromptVersion,
  SHEET_COLUMNS
};

// CLI入口
if (require.main === module) {
  main();
}