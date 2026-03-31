const fs = require('fs');
const path = require('path');
const { fetchHotspots, loadConfig } = require('./fetch.js');
const { generateOpinions, generateArticle } = require('./utils/ai.js');
const { generateImageCandidates } = require('./utils/image.js');
const { normalizeHotspots } = require('./utils/hotspot.js');
const { loadManualInsights, pickInsightForHotspot } = require('./utils/insight.js');
const { loadPromptVariants, scoreDraftQuality, selectBestPrompt, optimizePromptByTemplate } = require('./utils/prompt.js');
const { normalizeContents } = require('./utils/content-normalizer.js');
const { analyzeViralStructure } = require('./utils/viral-analyzer.js');
const { buildTemplateDraft } = require('./utils/template-engine.js');
const { createPluginsRuntime } = require('./utils/plugins-runtime.js');

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

function mergeHotspotsByProvider({ fetchedHotspots, pluginResult }) {
  const pluginHotspots = pluginResult?.ok ? pluginResult?.data?.hotspots : [];
  if (Array.isArray(pluginHotspots) && pluginHotspots.length > 0) {
    return pluginHotspots;
  }
  return Array.isArray(fetchedHotspots) ? fetchedHotspots : [];
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

function buildRunReport({
  config,
  keyword,
  hotspot,
  opinion,
  styles,
  outputs,
  hotspots,
  normalizedContents,
  viralAnalysis,
  templateDraft,
  optimizedPrompt,
  pluginTraces
}) {
  const hotspotList = normalizeHotspots(hotspots);
  const totalViews = hotspotList.reduce((sum, item) => sum + Number(item.views || 0), 0);
  const totalLikes = hotspotList.reduce((sum, item) => sum + Number(item.likes || 0), 0);
  const totalComments = hotspotList.reduce((sum, item) => sum + Number(item.comments || 0), 0);
  const variants = loadPromptVariants();
  const baseQuality = (scoreDraftQuality(outputs.wechatDraft) + scoreDraftQuality(outputs.xhsDraft)) / 2;
  const scoredVariants = variants.map((item, index) => ({
    id: item.id || `variant-${index + 1}`,
    score: Number(Math.max(0, Math.min(baseQuality - index * 0.02, 1)).toFixed(4))
  }));
  const best = selectBestPrompt(scoredVariants);
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
    hotspots: hotspotList.slice(0, 20),
    normalized_contents: (normalizedContents || []).slice(0, 10),
    viral_analysis: viralAnalysis || {},
    selected_template_id: templateDraft?.template_id || 'T1',
    template_candidates: templateDraft?.template_candidates || [],
    selection_reason: templateDraft?.selection_reason || 'default',
    plugin_traces: pluginTraces || [],
    manual_insight_applied: Boolean(config._manual_insight),
    manual_insight: config._manual_insight || '',
    prompt_iteration: {
      best_prompt_id: best?.id || 'default',
      scores: scoredVariants,
      best_candidate_id: optimizedPrompt?.best_candidate_id || '',
      candidate_scores: optimizedPrompt?.candidate_scores || [],
      optimized_prompt: optimizedPrompt?.optimized_prompt || ''
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
    kpi_snapshot: {
      hotspot_count: hotspotList.length,
      total_views: totalViews,
      total_likes: totalLikes,
      total_comments: totalComments,
      avg_prompt_score: scoredVariants.length > 0
        ? Number((scoredVariants.reduce((sum, item) => sum + Number(item.score || 0), 0) / scoredVariants.length).toFixed(4))
        : 0
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

    const fetchedHotspots = await fetchHotspots(runtimeConfig);
    const pluginsRuntime = createPluginsRuntime(runtimeConfig.plugins || {});
    const hotspotPluginResult = await pluginsRuntime.call('hotspot.search', {
      keywords: runtimeConfig.keywords,
      platforms: runtimeConfig.platforms
    });
    const hotspots = mergeHotspotsByProvider({
      fetchedHotspots,
      pluginResult: hotspotPluginResult
    });
    const normalizedContents = normalizeContents(hotspots.map(item => ({
      ...item,
      source_type: item.source_type || 'text',
      content: item.content || item.title
    })));
    const selectedHotspot = selectTopHotspot(hotspots);
    const viralAnalysis = analyzeViralStructure(normalizedContents[0] || {
      title: selectedHotspot.title,
      raw_text: selectedHotspot.title
    });
    const templateDraft = buildTemplateDraft({
      analysis: viralAnalysis,
      platform: 'wechat',
      topic: selectedHotspot.keyword || runtimeConfig.keywords[0]
    });
    const optimizedPrompt = optimizePromptByTemplate({
      template_id: templateDraft.template_id,
      platform: 'wechat',
      persona: '专业型',
      structured_draft: templateDraft.structured_draft
    });
    runtimeConfig._template_draft = templateDraft.structured_draft;
    runtimeConfig._optimized_prompt = optimizedPrompt.optimized_prompt;
    const manualInsights = loadManualInsights();
    const selectedInsight = pickInsightForHotspot(manualInsights, selectedHotspot);
    if (selectedInsight?.insight) {
      runtimeConfig._manual_insight = selectedInsight.insight;
    }
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
      outputs,
      hotspots,
      normalizedContents,
      viralAnalysis,
      templateDraft,
      optimizedPrompt,
      pluginTraces: pluginsRuntime.getTraces()
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

module.exports = { main, buildRuntimeConfig, buildRunReport, mergeHotspotsByProvider };

if (require.main === module) {
  main();
}
