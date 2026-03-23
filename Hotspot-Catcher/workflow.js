const fs = require('fs');
const path = require('path');
const { fetchHotspots, loadConfig } = require('./fetch.js');
const { generateOpinions, generateArticle } = require('./utils/ai.js');
const { generateImageCandidates } = require('./utils/image.js');

const OUTPUT_DIR = path.join(__dirname, 'output', 'publish-pack');
const DEFAULT_IMAGE_STYLES = ['写实摄影', '清新手绘', '扁平插画', '国风水墨', '极简海报'];

function parseArgs(argv) {
  const result = {
    keyword: '',
    styles: DEFAULT_IMAGE_STYLES
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--keyword') {
      result.keyword = argv[i + 1] || '';
    }
    if (argv[i] === '--styles') {
      result.styles = (argv[i + 1] || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }
  }
  if (result.styles.length === 0) {
    result.styles = DEFAULT_IMAGE_STYLES;
  }
  return result;
}

function buildRuntimeConfig(config, args) {
  const keyword = (args.keyword || '').trim();
  if (keyword) {
    return { ...config, keywords: [keyword] };
  }
  return {
    ...config,
    keywords: Array.isArray(config.keywords) && config.keywords.length > 0 ? config.keywords : ['柑橘']
  };
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function selectTopHotspot(hotspots) {
  if (!hotspots || hotspots.length === 0) {
    throw new Error('没有热点数据');
  }
  return hotspots[0];
}

function selectOpinion(opinions) {
  return opinions[0];
}

function renderMarkdown(platform, draft) {
  const tags = draft.tags.map(tag => `#${tag}`).join(' ');
  if (platform === 'xiaohongshu') {
    return `# ${draft.title}\n\n${draft.body}\n\n${tags}\n`;
  }
  return `# ${draft.title}\n\n${draft.body}\n\n关键词标签：${tags}\n`;
}

function buildRunDir() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(OUTPUT_DIR, `run-${timestamp}`);
  ensureDir(runDir);
  ensureDir(path.join(runDir, 'images'));
  return runDir;
}

async function saveDraftsAndImages({ config, hotspot, opinion, styles, runDir }) {
  const wechatDraft = await generateArticle(hotspot, opinion, 'wechat', config);
  const xhsDraft = await generateArticle(hotspot, opinion, 'xiaohongshu', config);

  const wechatPath = path.join(runDir, 'wechat.md');
  const xhsPath = path.join(runDir, 'xiaohongshu.md');
  fs.writeFileSync(wechatPath, renderMarkdown('wechat', wechatDraft));
  fs.writeFileSync(xhsPath, renderMarkdown('xiaohongshu', xhsDraft));

  const wechatImages = await generateImageCandidates({
    config,
    title: wechatDraft.title,
    keyword: hotspot.keyword,
    platform: 'wechat',
    styles
  });
  const xhsImages = await generateImageCandidates({
    config,
    title: xhsDraft.title,
    keyword: hotspot.keyword,
    platform: 'xiaohongshu',
    styles
  });

  const imageManifestPath = path.join(runDir, 'images', 'manifest.json');
  fs.writeFileSync(
    imageManifestPath,
    JSON.stringify({ wechat: wechatImages, xiaohongshu: xhsImages }, null, 2)
  );

  return {
    wechatPath,
    xhsPath,
    imageManifestPath,
    wechatDraft,
    xhsDraft
  };
}

function buildRunReport({ config, keyword, hotspot, opinion, styles, outputs }) {
  const report = {
    run_id: path.basename(path.dirname(outputs.wechatPath)),
    keyword,
    hotspot: {
      title: hotspot.title,
      platform: hotspot.platform,
      views: hotspot.views || 0,
      likes: hotspot.likes || 0,
      comments: hotspot.comments || 0
    },
    opinion: {
      title: opinion.title,
      angle: opinion.angle
    },
    styles,
    outputs: {
      wechat: outputs.wechatPath,
      xiaohongshu: outputs.xhsPath,
      images: outputs.imageManifestPath
    },
    reuse_sources: {
      local_reuse: ['fetch.js', 'utils/ai.js', 'templates/wechat.md', 'templates/xiaohongshu.md'],
      ecosystem_targets: ['skills.sh', 'GitHub高质量抓取与文案模板仓库'],
      strategy: '优先复用已有能力，仅补胶水层'
    },
    providers: {
      ai: config.ai.provider,
      image: config.image.provider
    },
    generated_at: new Date().toISOString()
  };
  if (config._last_image_error) {
    report.image_error = config._last_image_error;
  }
  return report;
}

async function main() {
  try {
    console.log('🦞 热点捕手 Skill 工作流');
    console.log('=======================');

    const args = parseArgs(process.argv.slice(2));
    const config = loadConfig();
    const styles = args.styles.slice(0, 5);
    const runtimeConfig = buildRuntimeConfig(config, args);
    const runDir = buildRunDir();

    console.log(`关键词: ${runtimeConfig.keywords.join(' / ')}`);
    console.log(`配图风格: ${styles.join(' / ')}`);

    const hotspots = await fetchHotspots(runtimeConfig);
    const selectedHotspot = selectTopHotspot(hotspots);
    const opinions = await generateOpinions(selectedHotspot, runtimeConfig);
    const selectedOpinion = selectOpinion(opinions);

    const outputs = await saveDraftsAndImages({
      config: runtimeConfig,
      hotspot: selectedHotspot,
      opinion: selectedOpinion,
      styles,
      runDir
    });

    const report = buildRunReport({
      config: runtimeConfig,
      keyword: selectedHotspot.keyword || runtimeConfig.keywords[0],
      hotspot: selectedHotspot,
      opinion: selectedOpinion,
      styles,
      outputs
    });
    const reportPath = path.join(runDir, 'run-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('✅ 产出完成');
    console.log(`公众号文案: ${outputs.wechatPath}`);
    console.log(`小红书文案: ${outputs.xhsPath}`);
    console.log(`配图清单: ${outputs.imageManifestPath}`);
    console.log(`运行报告: ${reportPath}`);
  } catch (error) {
    console.error('❌ 工作流失败:', error.message);
    process.exit(1);
  }
}

module.exports = { main, buildRuntimeConfig };

if (require.main === module) {
  main();
}
