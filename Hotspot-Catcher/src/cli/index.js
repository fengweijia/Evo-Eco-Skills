const { parseArgs, getCommandHelp } = require('./commands.js');
const { detectEnvironment, formatOutput } = require('./output.js');
const { ConfigManager } = require('../config/manager.js');
const { fetchHotspots } = require('../engines/hotspot/index.js');
const { analyzeViral } = require('../engines/analyzer/index.js');
const { generateDrafts } = require('../engines/drafter/index.js');
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
    draftsResult = await generateDrafts(analyzeResult, platforms);

    for (const platform of platforms) {
      if (draftsResult[platform]) {
        const output = formatOutput({
          platform,
          items: draftsResult[platform].candidates
        }, 'candidates', env);
        console.log(output);
        console.log(`\n请输入编号确认（1-3）: _`);
      }
    }
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