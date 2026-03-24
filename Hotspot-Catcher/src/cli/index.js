const { parseArgs, getCommandHelp } = require('./commands.js');
const { detectEnvironment, formatOutput } = require('./output.js');
const { ConfigManager } = require('../config/manager.js');
const { fetchHotspots } = require('../engines/hotspot/index.js');
const { analyzeViral } = require('../engines/analyzer/index.js');
const { generateDrafts } = require('../engines/drafter/index.js');
const { confirmDraft } = require('../engines/drafter/confirmer.js');
const { generateImages } = require('../engines/image/index.js');

async function main() {
  const args = parseArgs();

  if (!args.steps.length) {
    console.log(getCommandHelp());
    process.exit(0);
  }

  const config = new ConfigManager();
  config.mergeArgs(args);

  const keywords = config.get('keywords') || ['默认关键词'];
  const platforms = config.get('platforms') || ['bilibili', 'xiaohongshu'];
  const styles = config.get('styles') || ['写实摄影'];

  const env = detectEnvironment();

  let hotspotsResult = null;
  let analyzeResult = null;
  let draftsResult = null;

  if (args.steps.includes('hotspot') || args.steps.includes('all')) {
    console.log('🔍 正在抓取热点...');
    hotspotsResult = await fetchHotspots(keywords, platforms);
    console.log(`✅ 获取到 ${hotspotsResult.length} 个热点`);
  }

  if ((args.steps.includes('analyze') || args.steps.includes('all')) && hotspotsResult) {
    console.log('📊 正在分析热点...');
    analyzeResult = await analyzeViral(hotspotsResult);
    console.log(`✅ 分析完成，保存至 ${analyzeResult.storage_path}`);
  }

  if ((args.steps.includes('draft') || args.steps.includes('all')) && analyzeResult) {
    console.log('✍️ 正在生成文案...');
    const draftResult = await generateDrafts(analyzeResult, platforms);
    const draftsOutput = draftResult.drafts || draftResult;

    const confirmedDrafts = {};

    for (const platform of platforms) {
      if (draftsOutput[platform]) {
        const output = formatOutput({
          platform,
          items: draftsOutput[platform].candidates
        }, 'candidates', env);
        console.log(output);

        // 使用交互确认
        try {
          const selected = await confirmDraft(draftsOutput[platform].candidates);
          if (selected) {
            confirmedDrafts[platform] = { final: selected };
            console.log(`✅ 已选择: ${selected.title}`);
          } else {
            // 用户选择编辑或取消，使用第一个作为默认
            confirmedDrafts[platform] = { final: draftsOutput[platform].candidates[0] };
          }
        } catch (e) {
          console.log(`确认流程跳过，使用默认: ${e.message}`);
          confirmedDrafts[platform] = { final: draftsOutput[platform].candidates[0] };
        }
      }
    }

    draftsResult = confirmedDrafts;
  }

  if ((args.steps.includes('image') || args.steps.includes('all')) && draftsResult) {
    console.log('🖼️ 正在生成图片...');
    const confirmedDrafts = draftsResult;
    const imagesResult = await generateImages(confirmedDrafts, styles, platforms);
    console.log(`✅ 生成 ${imagesResult.length} 张图片`);
  }

  console.log('✨ 完成！');
}

module.exports = { main };

if (require.main === module) {
  main().catch(console.error);
}