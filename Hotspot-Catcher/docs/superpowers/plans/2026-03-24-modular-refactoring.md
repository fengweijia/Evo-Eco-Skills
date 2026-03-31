\---                                                                                                                                         

&#x20;

  Hotspot-Catcher 模块化重构实施计划                                                                                                          

                                                                                                                                              

  ▎ For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to 

  implement this plan task-by-task. Steps use checkbox (- \[ ]) syntax for tracking.                                                           

                  

  Goal: 将 Hotspot-Catcher 重构为模块化架构，4个独立引擎可解耦调用，支持外部技能接入                                                          

                  

  Architecture: 采用方案B全新模块化，在 src/ 目录下创建 engines/（4个引擎）、cli/（入口）、plugins/（运行时），每个模块独立可测试，通过 --step

   参数分步执行   

                                                                                                                                              

  Tech Stack: Node.js、axios、inquirer、node:test、JSON配置驱动                                                                               

  

  ---                                                                                                                                         

  File Structure  

                                                                                                                                              

  src/            

  ├── engines/                                                                                                                                

  │   ├── hotspot/                                                                                                                            

  │   │   ├── index.js      # 入口，fetchHotspots(keywords, platforms) 接口                                                                   

  │   │   ├── fetcher.js    # 各平台抓取逻辑                                                                                                  

  │   │   ├── normalizer.js # 热点标准化                                                                                                      

  │   │   └── selector.js   # TOP5 排名选取                                                                                                   

  │   ├── analyzer/                                                                                                                           

  │   │   ├── index.js      # 入口，analyzeViral(hotspots) 接口                                                                               

  │   │   ├── textifier.js  # 统一化为文本                                                                                                    

  │   │   ├── extractor.js  # 爆款结构提取                                                                                                    

  │   │   └── storage.js    # markdown 本地化存储                                                                                             

  │   ├── drafter/                                                                                                                            

  │   │   ├── index.js      # 入口，generateDrafts(analyzed, platforms) 接口                                                                  

  │   │   ├── loader.js     # 加载拆解内容                                                                                                    

  │   │   ├── generator.js  # 文案生成（3个候选）                                                                                             

  │   │   └── confirmer.js  # 交互式确认（CLI/IDE/Bot）                                                                                       

  │   └── image/                                                                                                                              

  │       ├── index.js      # 入口，generateImages(drafts, styles, platforms) 接口                                                            

  │       └── adapter.js    # 平台适配，数量计算                                                                                              

  ├── cli/                                                                                                                                    

  │   ├── index.js          # 主入口，解析 --step 参数                                                                                        

  │   ├── commands.js       # 子命令定义                                                                                                      

  │   └── output.js         # 输出格式适配（CLI/IDE/Bot）                                                                                     

  ├── config/                                                                                                                                 

  │   └── manager.js        # 配置管理                                                                                                        

  └── plugins/                                                                                                                                

      └── runtime.js        # 技能运行时，支持外部技能接入                                                                                    

                                                                                                                                              

  tests/                                                                                                                                      

  ├── engines/                                                                                                                                

  │   ├── hotspot.test.js                                                                                                                     

  │   ├── analyzer.test.js                                                                                                                    

  │   ├── drafter.test.js                                                                                                                     

  │   └── image.test.js                                                                                                                       

  ├── cli.test.js                                                                                                                             

  └── plugins.test.js                                                                                                                         

                                                                                                                                              

  ---                                                                                                                                         

  Task 1: 项目结构初始化与配置管理                                                                                                            

                                                                                                                                              

  Files:

  - Create: src/config/manager.js                                                                                                             

  - Create: tests/config.test.js                                                                                                              

  - Modify: config.json                                                                                                                       

  - Step 1: Write the failing test                                                                                                            

                                                                                                                                              

  // tests/config.test.js                                                                                                                     

  const { test } = require('node:test');                                                                                                      

  const assert = require('node:assert');                                                                                                      

  const { ConfigManager } = require('../src/config/manager.js');                                                                              

                                                                                                                                              

  test('ConfigManager should load config from config.json', () => {                                                                           

    const config = new ConfigManager();                                                                                                       

    assert.deepEqual(config.get('keywords'), \['OPC', '一人公司']);                                                                            

    assert.deepEqual(config.get('platforms'), \['bilibili', 'xiaohongshu']);                                                                   

  });                                                                                                                                         

                                                                                                                                              

  test('ConfigManager should merge cli args with config', () => {                                                                             

    const config = new ConfigManager();

    config.mergeArgs({ keyword: '柑橘', platforms: \['wechat'] });                                                                             

    assert.equal(config.get('keywords')\[0], '柑橘');                                                                                          

    assert.ok(config.get('platforms').includes('wechat'));                                                                                    

  });                                                                                                                                         

                                                                                                                                              

  - Step 2: Run test to verify it fails                                                                                                       

                  

  Run: node --test tests/config.test.js                                                                                                       

  Expected: FAIL with "Cannot find module"

                                                                                                                                              

  - Step 3: Write minimal implementation                                                                                                      

                                                                                                                                              

  // src/config/manager.js                                                                                                                    

  const fs = require('fs');                                                                                                                   

  const path = require('path');                                                                                                               

                                                                                                                                              

  class ConfigManager {                                                                                                                       

    constructor() {                                                                                                                           

      this.config = this.loadConfig();                                                                                                        

    }                                                                                                                                         

                                                                                                                                              

    loadConfig() {                                                                                                                            

      const configPath = path.join(process.cwd(), 'config.json');                                                                             

      if (fs.existsSync(configPath)) {                                                                                                        

        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));                                                                              

      }                                                                                                                                       

      return {};                                                                                                                              

    }                                                                                                                                         

                                                                                                                                              

    get(key) {                                                                                                                                

      return this.config\[key];                                                                                                                

    }                                                                                                                                         

                  

    mergeArgs(args) {                                                                                                                         

      if (args.keyword) {

        this.config.keywords = \[args.keyword];                                                                                                

      }                                                                                                                                       

      if (args.platforms) {                                                                                                                   

        this.config.platforms = args.platforms.split(',');                                                                                    

      }                                                                                                                                       

    }                                                                                                                                         

  }                                                                                                                                           

                                                                                                                                              

  module.exports = { ConfigManager };                                                                                                         

                                                                                                                                              

  - Step 4: Run test to verify it passes                                                                                                      

                  

  Run: node --test tests/config.test.js                                                                                                       

  Expected: PASS  

                                                                                                                                              

  - Step 5: Commit                                                                                                                            

                                                                                                                                              

  git add src/config/manager.js tests/config.test.js                                                                                          

  git commit -m "feat: add ConfigManager for config loading and CLI args merge"                                                               

                                                                                                                                              

  ---                                                                                                                                         

  Task 2: 热点抓取引擎 - 模块创建                                                                                                             

                                                                                                                                              

  Files:

  - Create: src/engines/hotspot/index.js                                                                                                      

  - Create: src/engines/hotspot/fetcher.js                                                                                                    

  - Create: src/engines/hotspot/normalizer.js                                                                                                 

  - Create: src/engines/hotspot/selector.js                                                                                                   

  - Create: tests/engines/hotspot.test.js                                                                                                     

  - Step 1: Write the failing test                                                                                                            

                                                                                                                                              

  // tests/engines/hotspot.test.js                                                                                                            

  const { test, describe } = require('node:test');                                                                                            

  const assert = require('node:assert');                                                                                                      

  const { fetchHotspots } = require('../../src/engines/hotspot/index.js');                                                                    

                                                                                                                                              

  describe('hotspot engine', () => {                                                                                                          

    test('fetchHotspots should return array with TOP5 hotspots', async () => {                                                                

      const result = await fetchHotspots(\['柑橘'], \['bilibili']);                                                                             

      assert.ok(Array.isArray(result));                                                                                                       

      assert.ok(result.length <= 5);                                                                                                          

    });                                                                                                                                       

                                                                                                                                              

    test('each hotspot should have platform, title, url, rank', async () => {                                                                 

      const result = await fetchHotspots(\['柑橘'], \['bilibili']);                                                                             

      if (result.length > 0) {                                                                                                                

        assert.ok(result\[0].platform);                                                                                                        

        assert.ok(result\[0].title);                                                                                                           

        assert.ok(result\[0].url);                                                                                                             

        assert.ok(typeof result\[0].rank === 'number');                                                                                        

      }                                                                                                                                       

    });                                                                                                                                       

  });                                                                                                                                         

                  

  - Step 2: Run test to verify it fails                                                                                                       

                  

  Run: node --test tests/engines/hotspot.test.js                                                                                              

  Expected: FAIL with "Cannot find module"

                                                                                                                                              

  - Step 3: Write minimal implementation                                                                                                      

                                                                                                                                              

  // src/engines/hotspot/index.js                                                                                                             

  const { fetchFromPlatform } = require('./fetcher.js');                                                                                      

  const { normalizeHotspot } = require('./normalizer.js');                                                                                    

  const { selectTopN } = require('./selector.js');                                                                                            

                                                                                                                                              

  async function fetchHotspots(keywords, platforms, options = {}) {                                                                           

    const topN = options.topN || 5;                                                                                                           

    const allHotspots = \[];                                                                                                                   

                                                                                                                                              

    for (const platform of platforms) {                                                                                                       

      for (const keyword of keywords) {                                                                                                       

        const rawData = await fetchFromPlatform(platform, keyword);                                                                           

        const normalized = rawData.map(item => normalizeHotspot(item, platform, keyword));                                                    

        const selected = selectTopN(normalized, topN);                                                                                        

        allHotspots.push(...selected);                                                                                                        

      }                                                                                                                                       

    }                                                                                                                                         

                                                                                                                                              

    return allHotspots;                                                                                                                       

  }               

                                                                                                                                              

  module.exports = { fetchHotspots };                                                                                                         

  

  // src/engines/hotspot/fetcher.js                                                                                                           

  async function fetchFromPlatform(platform, keyword) {

    // TODO: 实现真实平台抓取                                                                                                                 

    // 目前返回模拟数据                                                                                                                       

    return \[                                                                                                                                  

      { title: \`${keyword} 热点1\`, url: \`https\://${platform}/1\`, views: 100000 },                                                             

      { title: \`${keyword} 热点2\`, url: \`https\://${platform}/2\`, views: 80000 },                                                              

      { title: \`${keyword} 热点3\`, url: \`https\://${platform}/3\`, views: 60000 },                                                              

      { title: \`${keyword} 热点4\`, url: \`https\://${platform}/4\`, views: 40000 },                                                              

      { title: \`${keyword} 热点5\`, url: \`https\://${platform}/5\`, views: 20000 },                                                              

    ];                                                                                                                                        

  }                                                                                                                                           

                                                                                                                                              

  // src/engines/hotspot/normalizer.js                                                                                                        

  function normalizeHotspot(item, platform, keyword) {                                                                                        

    return {                                                                                                                                  

      id: \`${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}\`,                                                             

      platform,                                                                                                                               

      keyword,                                                                                                                                

      title: item.title,                                                                                                                      

      url: item.url,                                                                                                                          

      views: item.views || 0,                                                                                                                 

      rank: 0, // 将在 selector 中更新                                                                                                        

      raw: item                                                                                                                               

    };                                                                                                                                        

  }                                                                                                                                           

                                                                                                                                              

  // src/engines/hotspot/selector.js                                                                                                          

  function selectTopN(hotspots, n) {

    // 按热度排序                                                                                                                             

    const sorted = \[...hotspots].sort((a, b) => b.views - a.views);                                                                           

    // 取TOP N并更新排名                                                                                                                      

    return sorted.slice(0, n).map((item, index) => ({                                                                                         

      ...item,                                                                                                                                

      rank: index + 1                                                                                                                         

    }));                                                                                                                                      

  }                                                                                                                                           

                                                                                                                                              

  - Step 4: Run test to verify it passes                                                                                                      

                                                                                                                                              

  Run: node --test tests/engines/hotspot.test.js                                                                                              

  Expected: PASS  

                                                                                                                                              

  - Step 5: Commit                                                                                                                            

                                                                                                                                              

  git add src/engines/hotspot/ tests/engines/hotspot.test.js                                                                                  

  git commit -m "feat: add hotspot fetch engine with TOP5 ranking"                                                                            

                                                                                                                                              

  ---                                                                                                                                         

  Task 3: 爆款拆解引擎 - 模块创建                                                                                                             

                                                                                                                                              

  Files:

  - Create: src/engines/analyzer/index.js                                                                                                     

  - Create: src/engines/analyzer/textifier.js                                                                                                 

  - Create: src/engines/analyzer/extractor.js                                                                                                 

  - Create: src/engines/analyzer/storage.js                                                                                                   

  - Create: tests/engines/analyzer.test.js                                                                                                    

  - Step 1: Write the failing test                                                                                                            

                                                                                                                                              

  // tests/engines/analyzer.test.js                                                                                                           

  const { test, describe } = require('node:test');                                                                                            

  const assert = require('node:assert');                                                                                                      

  const { analyzeViral } = require('../../src/engines/analyzer/index.js');                                                                    

                                                                                                                                              

  describe('analyzer engine', () => {                                                                                                         

    test('analyzeViral should return contents with textified and structures', async () => {                                                   

      const hotspots = \[                                                                                                                      

        { id: '1', platform: 'bilibili', title: '测试热点', url: 'https\://x', views: 10000, raw: { content: '测试内容' } }                    

      ];                                                                                                                                      

      const result = await analyzeViral(hotspots);                                                                                            

      assert.ok(Array.isArray(result.contents));                                                                                              

      if (result.contents.length > 0) {                                                                                                       

        assert.ok(result.contents\[0].textified);                                                                                              

        assert.ok(result.contents\[0].structures);                                                                                             

      }                                                                                                                                       

    });                                                                                                                                       

                                                                                                                                              

    test('analyzeViral should save to markdown file', async () => {                                                                           

      const hotspots = \[                                                                                                                      

        { id: '1', platform: 'bilibili', title: '测试热点', url: 'https\://x', views: 10000, raw: { content: '测试内容' } }                    

      ];                                                                                                                                      

      const result = await analyzeViral(hotspots);                                                                                            

      assert.ok(result.storage\_path);                                                                                                         

    });                                                                                                                                       

  });                                                                                                                                         

                                                                                                                                              

  - Step 2: Run test to verify it fails                                                                                                       

                  

  Run: node --test tests/engines/analyzer.test.js                                                                                             

  Expected: FAIL with "Cannot find module"

                                                                                                                                              

  - Step 3: Write minimal implementation                                                                                                      

                                                                                                                                              

  // src/engines/analyzer/index.js                                                                                                            

  const { textifyHotspot } = require('./textifier.js');                                                                                       

  const { extractStructure } = require('./extractor.js');                                                                                     

  const { saveToMarkdown } = require('./storage.js');                                                                                         

                                                                                                                                              

  async function analyzeViral(hotspots, options = {}) {                                                                                       

    const contents = \[];                                                                                                                      

                                                                                                                                              

    for (const hotspot of hotspots) {                                                                                                         

      // 统一化为文本                                                                                                                         

      const textified = textifyHotspot(hotspot);                                                                                              

      // 提取爆款结构                                                                                                                         

      const structures = extractStructure(textified, hotspot);                                                                                

                                                                                                                                              

      contents.push({                                                                                                                         

        hotspot\_id: hotspot.id,                                                                                                               

        platform: hotspot.platform,                                                                                                           

        keyword: hotspot.keyword,                                                                                                             

        title: hotspot.title,                                                                                                                 

        url: hotspot.url,                                                                                                                     

        textified,                                                                                                                            

        structures                                                                                                                            

      });                                                                                                                                     

    }                                                                                                                                         

                  

    // 保存到 markdown                                                                                                                        

    const storage\_path = await saveToMarkdown(contents, options);

                                                                                                                                              

    return { contents, storage\_path };                                                                                                        

  }                                                                                                                                           

                                                                                                                                              

  module.exports = { analyzeViral };                                                                                                          

  

  // src/engines/analyzer/textifier.js                                                                                                        

  function textifyHotspot(hotspot) {

    const raw = hotspot.raw || {};                                                                                                            

    // 从原始数据中提取文本                                                                                                                   

    return raw\.content || raw\.text || raw\.transcript || hotspot.title || '';                                                                  

  }                                                                                                                                           

                                                                                                                                              

  // src/engines/analyzer/extractor.js                                                                                                        

  function extractStructure(text, hotspot) {

    const textStr = String(text);                                                                                                             

    return {                                                                                                                                  

      hook: textStr.slice(0, 50),                                                                                                             

      conflict: textStr.includes('但是') ? '存在反差冲突' : '待分析',                                                                         

      evidence: textStr.split(/\[,。]/).filter(s => s.trim()).slice(0, 3),                                                                     

      actions: \['步骤1', '步骤2', '步骤3'],                                                                                                   

      cta: '欢迎评论讨论'                                                                                                                     

    };                                                                                                                                        

  }                                                                                                                                           

                                                                                                                                              

  // src/engines/analyzer/storage.js                                                                                                          

  const fs = require('fs');

  const path = require('path');                                                                                                               

                                                                                                                                              

  async function saveToMarkdown(contents, options = {}) {                                                                                     

    const outputDir = options.outputDir || path.join(process.cwd(), 'output', 'analysis');                                                    

                                                                                                                                              

    if (!fs.existsSync(outputDir)) {                                                                                                          

      fs.mkdirSync(outputDir, { recursive: true });                                                                                           

    }                                                                                                                                         

                  

    const timestamp = new Date().toISOString().slice(0, 10);                                                                                  

    const filepath = path.join(outputDir, \`analysis-${timestamp}.md\`);

                                                                                                                                              

    let markdown = '# 热点分析报告\n\n';                                                                                                      

                                                                                                                                              

    for (const content of contents) {                                                                                                         

      markdown += \`## ${content.platform} - ${content.title}\n\n\`;

      markdown += \`\*\*原始文本\*\*\n${content.textified}\n\n\`;                                                                                   

      markdown += \`\*\*爆款结构\*\*\n\`;                                                                                                           

      markdown += \`- 钩子: ${content.structures.hook}\n\`;                                                                                     

      markdown += \`- 冲突: ${content.structures.conflict}\n\`;                                                                                 

      markdown += \`- 证据: ${content.structures.evidence.join(', ')}\n\`;                                                                      

      markdown += \`- 行动点: ${content.structures.actions.join(', ')}\n\`;                                                                     

      markdown += \`- CTA: ${content.structures.cta}\n\n\`;                                                                                     

      markdown += \`---\n\n\`;                                                                                                                  

    }                                                                                                                                         

                                                                                                                                              

    fs.writeFileSync(filepath, markdown, 'utf-8');                                                                                            

                                                                                                                                              

    return filepath;                                                                                                                          

  }               

                                                                                                                                              

  - Step 4: Run test to verify it passes                                                                                                      

   

  Run: node --test tests/engines/analyzer.test.js                                                                                             

  Expected: PASS  

                                                                                                                                              

  - Step 5: Commit                                                                                                                            

                                                                                                                                              

  git add src/engines/analyzer/ tests/engines/analyzer.test.js                                                                                

  git commit -m "feat: add viral analyzer engine with markdown storage"                                                                       

                                                                                                                                              

  ---                                                                                                                                         

  Task 4: 爆款文案生成引擎 - 模块创建                                                                                                         

                                                                                                                                              

  Files:          

  - Create: src/engines/drafter/index.js                                                                                                      

  - Create: src/engines/drafter/loader.js                                                                                                     

  - Create: src/engines/drafter/generator.js                                                                                                  

  - Create: src/engines/drafter/confirmer.js                                                                                                  

  - Create: tests/engines/drafter.test.js                                                                                                     

  - Step 1: Write the failing test                                                                                                            

                                                                                                                                              

  // tests/engines/drafter.test.js                                                                                                            

  const { test, describe } = require('node:test');                                                                                            

  const assert = require('node:assert');                                                                                                      

  const { generateDrafts } = require('../../src/engines/drafter/index.js');                                                                   

                                                                                                                                              

  describe('drafter engine', () => {                                                                                                          

    test('generateDrafts should return 3 candidates per platform', async () => {                                                              

      const analyzed = {                                                                                                                      

        contents: \[{                                                                                                                          

          hotspot\_id: '1',                                                                                                                    

          platform: 'wechat',                                                                                                                 

          title: '测试热点',                                                                                                                  

          textified: '测试内容',                                                                                                              

          structures: { hook: '钩子', conflict: '冲突', evidence: \['证据'], actions: \['行动'], cta: 'CTA' }                                   

        }]                                                                                                                                    

      };                                                                                                                                      

                                                                                                                                              

      const result = await generateDrafts(analyzed, \['wechat']);                                                                              

      assert.ok(result.wechat);                                                                                                               

      assert.equal(result.wechat.candidates.length, 3);                                                                                       

    });                                                                                                                                       

                                                                                                                                              

    test('each candidate should have title, body, reason', async () => {                                                                      

      const analyzed = {

        contents: \[{                                                                                                                          

          hotspot\_id: '1',                                                                                                                    

          platform: 'wechat',                                                                                                                 

          title: '测试热点',                                                                                                                  

          textified: '测试内容',                                                                                                              

          structures: { hook: '钩子', conflict: '冲突', evidence: \['证据'], actions: \['行动'], cta: 'CTA' }                                   

        }]                                                                                                                                    

      };                                                                                                                                      

                                                                                                                                              

      const result = await generateDrafts(analyzed, \['wechat']);                                                                              

      const candidate = result.wechat.candidates\[0];

      assert.ok(candidate.title);                                                                                                             

      assert.ok(candidate.body);                                                                                                              

      assert.ok(candidate.reason);                                                                                                            

    });                                                                                                                                       

  });                                                                                                                                         

                                                                                                                                              

  - Step 2: Run test to verify it fails                                                                                                       

                                                                                                                                              

  Run: node --test tests/engines/drafter.test.js                                                                                              

  Expected: FAIL with "Cannot find module"

                                                                                                                                              

  - Step 3: Write minimal implementation                                                                                                      

                                                                                                                                              

  // src/engines/drafter/index.js                                                                                                             

  const { loadAnalysis } = require('./loader.js');                                                                                            

  const { generateCandidates } = require('./generator.js');                                                                                   

                                                                                                                                              

  async function generateDrafts(analyzed, platforms, options = {}) {                                                                          

    const results = {};                                                                                                                       

                                                                                                                                              

    // 加载分析内容                                                                                                                           

    const contents = analyzed.contents || \[];                                                                                                 

                                                                                                                                              

    for (const platform of platforms) {                                                                                                       

      const platformContents = contents.filter(c => c.platform === platform);                                                                 

                                                                                                                                              

      if (platformContents.length === 0) continue;                                                                                            

                                                                                                                                              

      // 生成3个候选                                                                                                                          

      const candidates = generateCandidates(platformContents, platform);

                                                                                                                                              

      results\[platform] = { candidates };                                                                                                     

    }                                                                                                                                         

                                                                                                                                              

    return results;                                                                                                                           

  }

                                                                                                                                              

  module.exports = { generateDrafts };                                                                                                        

   

  // src/engines/drafter/loader.js                                                                                                            

  function loadAnalysis(analysisPath) {

    // 从 markdown 或 JSON 加载分析内容                                                                                                       

    // 目前直接使用传入的 analyzed 对象                                                                                                       

    return analysisPath;                                                                                                                      

  }                                                                                                                                           

                                                                                                                                              

  // src/engines/drafter/generator.js                                                                                                         

  function generateCandidates(contents, platform) {                                                                                           

    const candidates = \[];                                                                                                                    

    const template = platform === 'wechat'                                                                                                    

      ? { titlePrefix: '深度', bodyPrefix: '今天来聊聊' }                                                                                     

      : { titlePrefix: '必看', bodyPrefix: '姐妹们' };                                                                                        

                                                                                                                                              

    for (let i = 1; i <= 3; i++) {                                                                                                            

      candidates.push({                                                                                                                       

        id: \`${platform}-${i}\`,                                                                                                               

        title: \`${template.titlePrefix}：${contents\[0]?.title || '热点'}-${i}\`,                                                               

        body: \`${template.bodyPrefix}，${contents\[0]?.structures?.hook || '值得关注'}...\`,                                                    

        reason: i === 1 ? '数据详实，案例丰富' : i === 2 ? '步骤清晰，易于实操' : '痛点明确，警示性强'                                        

      });                                                                                                                                     

    }                                                                                                                                         

                                                                                                                                              

    return candidates;                                                                                                                        

  }               

                                                                                                                                              

  - Step 4: Run test to verify it passes                                                                                                      

                                                                                                                                              

  Run: node --test tests/engines/drafter.test.js                                                                                              

  Expected: PASS  

                                                                                                                                              

  - Step 5: Commit                                                                                                                            

                                                                                                                                              

  git add src/engines/drafter/ tests/engines/drafter.test.js                                                                                  

  git commit -m "feat: add drafter engine with 3-candidate generation"                                                                        

                                                                                                                                              

  ---                                                                                                                                         

  Task 5: 生图引擎 - 模块创建                                                                                                                 

                                                                                                                                              

  Files:

  - Create: src/engines/image/index.js                                                                                                        

  - Create: src/engines/image/adapter.js                                                                                                      

  - Create: tests/engines/image.test.js                                                                                                       

  - Step 1: Write the failing test                                                                                                            

                                                                                                                                              

  // tests/engines/image.test.js                                                                                                              

  const { test, describe } = require('node:test');                                                                                            

  const assert = require('node:assert');                                                                                                      

  const { generateImages } = require('../../src/engines/image/index.js');                                                                     

                                                                                                                                              

  describe('image engine', () => {                                                                                                            

    test('generateImages should return images with correct platform and style', async () => {                                                 

      const drafts = {                                                                                                                        

        wechat: { final: { title: '测试', body: '内容' } },                                                                                   

        xiaohongshu: { final: { title: '测试', body: '内容' } }                                                                               

      };                                                                                                                                      

      const styles = \['写实摄影', '清新手绘'];                                                                                                

      const platforms = \['wechat', 'xiaohongshu'];                                                                                            

                                                                                                                                              

      const result = await generateImages(drafts, styles, platforms);                                                                         

      assert.ok(Array.isArray(result));                                                                                                       

      assert.ok(result.length > 0);                                                                                                           

    });                                                                                                                                       

                                                                                                                                              

    test('each image should have platform, type, style, url', async () => {                                                                   

      const drafts = {                                                                                                                        

        wechat: { final: { title: '测试', body: '内容' } }                                                                                    

      };                                                                                                                                      

      const styles = \['写实摄影'];                                                                                                            

      const platforms = \['wechat'];                                                                                                           

                                                                                                                                              

      const result = await generateImages(drafts, styles, platforms);                                                                         

      if (result.length > 0) {                                                                                                                

        assert.ok(result\[0].platform);                                                                                                        

        assert.ok(result\[0].style);                                                                                                           

        assert.ok(result\[0].url);                                                                                                             

      }                                                                                                                                       

    });                                                                                                                                       

  });                                                                                                                                         

                                                                                                                                              

  - Step 2: Run test to verify it fails                                                                                                       

                                                                                                                                              

  Run: node --test tests/engines/image.test.js                                                                                                

  Expected: FAIL with "Cannot find module"

                                                                                                                                              

  - Step 3: Write minimal implementation                                                                                                      

                                                                                                                                              

  // src/engines/image/index.js                                                                                                               

  const { adaptImageCount } = require('./adapter.js');                                                                                        

                                                                                                                                              

  async function generateImages(drafts, styles, platforms, options = {}) {                                                                    

    const images = \[];                                                                                                                        

                                                                                                                                              

    for (const platform of platforms) {                                                                                                       

      const draft = drafts\[platform];                                                                                                         

      if (!draft || !draft.final) continue;                                                                                                   

                                                                                                                                              

      // 根据平台适配图片数量                                                                                                                 

      const imageCount = adaptImageCount(platform);                                                                                           

                                                                                                                                              

      for (const style of styles) {                                                                                                           

        for (let i = 0; i < imageCount; i++) {                                                                                                

          images.push({                                                                                                                       

            platform,                                                                                                                         

            type: i === 0 ? 'cover' : 'content',                                                                                              

            style,                                                                                                                            

            url: \`https\://picsum.photos/800/600?random=${Date.now()}-${i}\`,                                                                   

            prompt: \`${draft.final.title} - ${style}\`                                                                                         

          });                                                                                                                                 

        }                                                                                                                                     

      }                                                                                                                                       

    }             

                                                                                                                                              

    return images;                                                                                                                            

  }                                                                                                                                           

                                                                                                                                              

  module.exports = { generateImages };                                                                                                        

  

  // src/engines/image/adapter.js                                                                                                             

  function adaptImageCount(platform) {

    switch (platform) {                                                                                                                       

      case 'wechat':                                                                                                                          

        return 2; // 封面 + 1张配图                                                                                                           

      case 'xiaohongshu':                                                                                                                     

        return 3; // 封面 + 2张配图                                                                                                           

      default:                                                                                                                                

        return 1;                                                                                                                             

    }                                                                                                                                         

  }                                                                                                                                           

                                                                                                                                              

  - Step 4: Run test to verify it passes                                                                                                      

                  

  Run: node --test tests/engines/image.test.js                                                                                                

  Expected: PASS  

                                                                                                                                              

  - Step 5: Commit                                                                                                                            

  

  git add src/engines/image/ tests/engines/image.test.js                                                                                      

  git commit -m "feat: add image generation engine with platform adaptation"                                                                  

                                                                                                                                              

  ---                                                                                                                                         

  Task 6: CLI 入口与输出适配 - 模块创建                                                                                                       

                                                                                                                                              

  Files:

  - Create: src/cli/index.js                                                                                                                  

  - Create: src/cli/commands.js                                                                                                               

  - Create: src/cli/output.js                                                                                                                 

  - Create: tests/cli.test.js                                                                                                                 

  - Step 1: Write the failing test                                                                                                            

                                                                                                                                              

  // tests/cli.test.js                                                                                                                        

  const { test, describe } = require('node:test');                                                                                            

  const assert = require('node:assert');                                                                                                      

  const { detectEnvironment } = require('../src/cli/output.js');                                                                              

  const { parseArgs } = require('../src/cli/commands.js');                                                                                    

                                                                                                                                              

  describe('cli', () => {                                                                                                                     

    test('detectEnvironment should return cli/ide/bot', () => {                                                                               

      const env = detectEnvironment();                                                                                                        

      assert.ok(\['cli', 'ide', 'bot'].includes(env));                                                                                         

    });                                                                                                                                       

                                                                                                                                              

    test('parseArgs should extract step parameter', () => {                                                                                   

      const args = parseArgs(\['--step', 'hotspot']);

      assert.equal(args.step, 'hotspot');                                                                                                     

    });                                                                                                                                       

                                                                                                                                              

    test('parseArgs should support multiple steps', () => {                                                                                   

      const args = parseArgs(\['--step', 'hotspot,analyze']);                                                                                  

      assert.ok(args.steps.includes('hotspot'));                                                                                              

      assert.ok(args.steps.includes('analyze'));                                                                                              

    });                                                                                                                                       

  });                                                                                                                                         

                                                                                                                                              

  - Step 2: Run test to verify it fails                                                                                                       

                                                                                                                                              

  Run: node --test tests/cli.test.js                                                                                                          

  Expected: FAIL with "Cannot find module"

                                                                                                                                              

  - Step 3: Write minimal implementation                                                                                                      

                                                                                                                                              

  // src/cli/output.js                                                                                                                        

  function detectEnvironment() {                                                                                                              

    if (process.env.CLAUDE\_CODE) return 'bot';

    if (process.env.VSCODE\_INJECTION) return 'ide';                                                                                           

    return 'cli';                                                                                                                             

  }                                                                                                                                           

                                                                                                                                              

  function formatForCLI(data, type) {                                                                                                         

    if (type === 'candidates') {

      let output = \`=== ${data.platform} 文案候选 ===\n\`;                                                                                     

      data.items.forEach((item, i) => {                                                                                                       

        output += \`\[${i + 1}] ${item.title}\n\`;                                                                                               

        output += \`    推荐原因: ${item.reason}\n\n\`;                                                                                         

      });                                                                                                                                     

      return output;                                                                                                                          

    }                                                                                                                                         

    return JSON.stringify(data, null, 2);                                                                                                     

  }                                                                                                                                           

                  

  function formatForIDE(data, type) {                                                                                                         

    if (type === 'candidates') {

      let md = \`## ${data.platform} 文案候选\n\n\`;                                                                                            

      md += \`| # | 标题 | 推荐原因 |\n\`;                                                                                                      

      md += \`|---|------|----------|\n\`;                                                                                                      

      data.items.forEach((item, i) => {                                                                                                       

        md += \`| ${i + 1} | ${item.title} | ${item.reason} |\n\`;                                                                              

      });                                                                                                                                     

      return md;                                                                                                                              

    }                                                                                                                                         

    return JSON.stringify(data, null, 2);

  }                                                                                                                                           

                  

  function formatForBot(data, type) {                                                                                                         

    if (type === 'candidates') {

      let output = \`\*\*${data.platform} 文案候选\*\*\n\n\`;                                                                                       

      data.items.forEach((item, i) => {                                                                                                       

        output += \`${i + 1}️⃣ \*\*${item.title}\*\*\n\`;                                                                                            

        output += \`   💡 ${item.reason}\n\n\`;                                                                                                 

      });                                                                                                                                     

      return output;                                                                                                                          

    }                                                                                                                                         

    return JSON.stringify(data, null, 2);                                                                                                     

  }                                                                                                                                           

                                                                                                                                              

  function formatOutput(data, type, env) {                                                                                                    

    switch (env) {                                                                                                                            

      case 'ide': return formatForIDE(data, type);                                                                                            

      case 'bot': return formatForBot(data, type);                                                                                            

      default: return formatForCLI(data, type);                                                                                               

    }                                                                                                                                         

  }                                                                                                                                           

                                                                                                                                              

  module.exports = { detectEnvironment, formatOutput, formatForCLI, formatForIDE, formatForBot };                                             

                                                                                                                                              

  // src/cli/commands.js                                                                                                                      

  function parseArgs(argv = process.argv) {

    const args = {                                                                                                                            

      steps: \[],                                                                                                                              

      keyword: null,                                                                                                                          

      platforms: null,                                                                                                                        

      styles: null,                                                                                                                           

      config: null                                                                                                                            

    };                                                                                                                                        

                                                                                                                                              

    for (let i = 0; i < argv.length; i++) {                                                                                                   

      const arg = argv\[i];                                                                                                                    

      if (arg === '--step' && argv\[i + 1]) {                                                                                                  

        args.steps = argv\[i + 1].split(',');                                                                                                  

        args.step = args.steps\[0]; // 兼容单个step                                                                                            

      }                                                                                                                                       

      if (arg === '--keyword' && argv\[i + 1]) {                                                                                               

        args.keyword = argv\[i + 1];                                                                                                           

      }                                                                                                                                       

      if (arg === '--platforms' && argv\[i + 1]) {                                                                                             

        args.platforms = argv\[i + 1].split(',');                                                                                              

      }                                                                                                                                       

      if (arg === '--styles' && argv\[i + 1]) {                                                                                                

        args.styles = argv\[i + 1].split(',');                                                                                                 

      }                                                                                                                                       

      if (arg === '--config' && argv\[i + 1]) {                                                                                                

        args.config = argv\[i + 1];                                                                                                            

      }                                                                                                                                       

    }                                                                                                                                         

                                                                                                                                              

    return args;                                                                                                                              

  }                                                                                                                                           

                                                                                                                                              

  function getCommandHelp() {                                                                                                                 

    return \`

  Usage: node cli.js \[options]                                                                                                                

                                                                                                                                              

  Options:                                                                                                                                    

    --step \<commands>   执行步骤: hotspot, analyze, draft, image, all                                                                         

    --keyword \<word>    关键词                                                                                                                

    --platforms \<list>  平台列表，用逗号分隔                                                                                                  

    --styles \<list>     风格列表，用逗号分隔                                                                                                  

    --config \<file>     配置文件                                                                                                              

                                                                                                                                              

  Examples:                                                                                                                                   

    node cli.js --step hotspot --keyword 柑橘                                                                                                 

    node cli.js --step hotspot,analyze,draft --platforms wechat,xiaohongshu                                                                   

    node cli.js --step all --keyword 柑橘 --styles 写实摄影,清新手绘                                                                          

  \`;                                                                                                                                          

  }                                                                                                                                           

                                                                                                                                              

  module.exports = { parseArgs, getCommandHelp };                                                                                             

  

  // src/cli/index.js                                                                                                                         

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

                                                                                                                                              

    // 加载配置                                                                                                                               

    const config = new ConfigManager();

    config.mergeArgs(args);                                                                                                                   

                                                                                                                                              

    const keywords = config.get('keywords') || \['默认关键词'];                                                                                

    const platforms = config.get('platforms') || \['bilibili', 'xiaohongshu'];                                                                 

    const styles = config.get('styles') || \['写实摄影'];                                                                                      

                                                                                                                                              

    const env = detectEnvironment();                                                                                                          

                                                                                                                                              

    // 执行各步骤                                                                                                                             

    let hotspotsResult = null;

    let analyzeResult = null;                                                                                                                 

    let draftsResult = null;                                                                                                                  

                                                                                                                                              

    if (args.steps.includes('hotspot') || args.steps.includes('all')) {                                                                       

      console.log('🔍 正在抓取热点...');                                                                                                      

      hotspotsResult = await fetchHotspots(keywords, platforms);                                                                              

      console.log(\`✅ 获取到 ${hotspotsResult.length} 个热点\`);                                                                               

    }                                                                                                                                         

                                                                                                                                              

    if ((args.steps.includes('analyze') || args.steps.includes('all')) && hotspotsResult) {                                                   

      console.log('📊 正在分析热点...');                                                                                                      

      analyzeResult = await analyzeViral(hotspotsResult);                                                                                     

      console.log(\`✅ 分析完成，保存至 ${analyzeResult.storage\_path}\`);                                                                       

    }                                                                                                                                         

                                                                                                                                              

    if ((args.steps.includes('draft') || args.steps.includes('all')) && analyzeResult) {                                                      

      console.log('✍️  正在生成文案...');                                                                                                      

      draftsResult = await generateDrafts(analyzeResult, platforms);                                                                          

                                                                                                                                              

      // 输出候选并等待确认                                                                                                                   

      for (const platform of platforms) {                                                                                                     

        if (draftsResult\[platform]) {                                                                                                         

          const output = formatOutput({                                                                                                       

            platform,                                                                                                                         

            items: draftsResult\[platform].candidates                                                                                          

          }, 'candidates', env);                                                                                                              

          console.log(output);                                                                                                                

                                                                                                                                              

          // TODO: 交互式确认逻辑                                                                                                             

          console.log(\`\n请输入编号确认（1-3）: \_\`);                                                                                          

        }                                                                                                                                     

      }                                                                                                                                       

    }                                                                                                                                         

                                                                                                                                              

    if ((args.steps.includes('image') || args.steps.includes('all')) && draftsResult) {                                                       

      console.log('🖼️  正在生成图片...');                                                                                                      

      const confirmedDrafts = draftsResult; // TODO: 确认后的文案                                                                             

      const imagesResult = await generateImages(confirmedDrafts, styles, platforms);                                                          

      console.log(\`✅ 生成 ${imagesResult.length} 张图片\`);                                                                                   

    }                                                                                                                                         

                                                                                                                                              

    console.log('✨ 完成！');                                                                                                                 

  }               

                                                                                                                                              

  module.exports = { main };                                                                                                                  

                                                                                                                                              

  // 如果直接运行                                                                                                                             

  if (require.main === module) {

    main().catch(console.error);                                                                                                              

  }                                                                                                                                           

                                                                                                                                              

  - Step 4: Run test to verify it passes                                                                                                      

                                                                                                                                              

  Run: node --test tests/cli.test.js                                                                                                          

  Expected: PASS  

                                                                                                                                              

  - Step 5: Commit                                                                                                                            

                                                                                                                                              

  git add src/cli/ tests/cli.test.js                                                                                                          

  git commit -m "feat: add CLI entry with environment-aware output"                                                                           

                                                                                                                                              

  ---                                                                                                                                         

  Task 7: 插件运行时 - 外部技能接入                                                                                                           

                                                                                                                                              

  Files:

  - Create: src/plugins/runtime.js                                                                                                            

  - Create: tests/plugins.test.js                                                                                                             

  - Step 1: Write the failing test                                                                                                            

                                                                                                                                              

  // tests/plugins.test.js                                                                                                                    

  const { test, describe } = require('node:test');                                                                                            

  const assert = require('node:assert');                                                                                                      

  const { PluginRuntime } = require('../src/plugins/runtime.js');                                                                             

                                                                                                                                              

  describe('plugins runtime', () => {                                                                                                         

    test('PluginRuntime should load builtin engine by default', async () => {                                                                 

      const runtime = new PluginRuntime({                                                                                                     

        plugins: { hotspot: { provider: 'builtin' } }                                                                                         

      });                                                                                                                                     

      const engine = await runtime.loadEngine('hotspot');                                                                                     

      assert.ok(engine);                                                                                                                      

      assert.ok(engine.fetchHotspots);                                                                                                        

    });                                                                                                                                       

                                                                                                                                              

    test('PluginRuntime should fallback to builtin when external unavailable', async () => {                                                  

      const runtime = new PluginRuntime({                                                                                                     

        plugins: { hotspot: { provider: 'external', external: { path: '/invalid/path' } } }                                                   

      });                                                                                                                                     

      const engine = await runtime.loadEngine('hotspot');                                                                                     

      assert.ok(engine);                                                                                                                      

    });                                                                                                                                       

  });                                                                                                                                         

                                                                                                                                              

  - Step 2: Run test to verify it fails                                                                                                       

                                                                                                                                              

  Run: node --test tests/plugins.test.js                                                                                                      

  Expected: FAIL with "Cannot find module"

                                                                                                                                              

  - Step 3: Write minimal implementation                                                                                                      

                                                                                                                                              

  // src/plugins/runtime.js                                                                                                                   

  const path = require('path');                                                                                                               

                                                                                                                                              

  class PluginRuntime {                                                                                                                       

    constructor(config) {                                                                                                                     

      this.config = config;                                                                                                                   

      this.cache = new Map();                                                                                                                 

    }                                                                                                                                         

                                                                                                                                              

    async loadEngine(type) {                                                                                                                  

      // 检查缓存                                                                                                                             

      if (this.cache.has(type)) {                                                                                                             

        return this.cache.get(type);                                                                                                          

      }                                                                                                                                       

                                                                                                                                              

      const pluginConfig = this.config.plugins?.\[type] || { provider: 'builtin' };                                                            

      const { provider, external } = pluginConfig;

                                                                                                                                              

      let engine = null;                                                                                                                      

                                                                                                                                              

      // 优先使用 builtin                                                                                                                     

      if (provider === 'builtin') {

        engine = this.loadBuiltin(type);                                                                                                      

      } else if (provider === 'external' && external) {                                                                                       

        // 尝试加载外部技能                                                                                                                   

        engine = await this.loadExternal(external, type);                                                                                     

      }                                                                                                                                       

                                                                                                                                              

      // 回退到 builtin                                                                                                                       

      if (!engine) {

        engine = this.loadBuiltin(type);                                                                                                      

      }                                                                                                                                       

                                                                                                                                              

      this.cache.set(type, engine);                                                                                                           

      return engine;

    }                                                                                                                                         

                                                                                                                                              

    loadBuiltin(type) {                                                                                                                       

      try {                                                                                                                                   

        return require(\`../engines/${type}/index.js\`);                                                                                        

      } catch (e) {                                                                                                                           

        return null;                                                                                                                          

      }                                                                                                                                       

    }                                                                                                                                         

                                                                                                                                              

    async loadExternal(external, type) {                                                                                                      

      try {       

        if (external.path) {                                                                                                                  

          return require(path.resolve(external.path));                                                                                        

        }                                                                                                                                     

        // TODO: 支持 URL 加载                                                                                                                

        if (external.url) {                                                                                                                   

          // 需要实现 URL 加载逻辑                                                                                                            

          return null;                                                                                                                        

        }                                                                                                                                     

      } catch (e) {                                                                                                                           

        console.warn(\`Failed to load external ${type}:\`, e.message);

      }                                                                                                                                       

      return null;                                                                                                                            

    }                                                                                                                                         

                                                                                                                                              

    async callEngine(type, method, ...args) {                                                                                                 

      const engine = await this.loadEngine(type);

      if (engine && engine\[method]) {                                                                                                         

        return engine\[method]\(...args);                                                                                                       

      }                                                                                                                                       

      throw new Error(\`Engine ${type} does not have method ${method}\`);                                                                       

    }                                                                                                                                         

  }                                                                                                                                           

                                                                                                                                              

  module.exports = { PluginRuntime };                                                                                                         

                                                                                                                                              

  - Step 4: Run test to verify it passes                                                                                                      

                  

  Run: node --test tests/plugins.test.js                                                                                                      

  Expected: PASS  

                                                                                                                                              

  - Step 5: Commit                                                                                                                            

                                                                                                                                              

  git add src/plugins/ tests/plugins.test.js                                                                                                  

  git commit -m "feat: add plugin runtime for external skill integration"                                                                     

                                                                                                                                              

  ---                                                                                                                                         

  Task 8: 集成测试与端到端验证                                                                                                                

                                                                                                                                              

  Files:

  - Create: tests/integration.test.js                                                                                                         

  - Modify: package.json (添加 cli 脚本)                                                                                                      

  - Step 1: Write the failing test      

                                                                                                                                              

  // tests/integration.test.js                                                                                                                

  const { test, describe } = require('node:test');                                                                                            

  const assert = require('node:assert');                                                                                                      

  const { spawn } = require('child\_process');                                                                                                 

                                                                                                                                              

  describe('integration', () => {                                                                                                             

    test('cli should execute hotspot step', async () => {                                                                                     

      const result = await runCli(\['--step', 'hotspot', '--keyword', '测试']);                                                                

      assert.ok(result.includes('热点'));                                                                                                     

    });                                                                                                                                       

                                                                                                                                              

    test('cli should support --step all', async () => {                                                                                       

      const result = await runCli(\['--step', 'all', '--keyword', '测试']);

      assert.ok(result.includes('完成'));                                                                                                     

    });                                                                                                                                       

  });                                                                                                                                         

                                                                                                                                              

  function runCli(args) {                                                                                                                     

    return new Promise((resolve, reject) => {                                                                                                 

      const proc = spawn('node', \['src/cli/index.js', ...args], {                                                                             

        cwd: process.cwd()                                                                                                                    

      });                                                                                                                                     

      let output = '';                                                                                                                        

      proc.stdout.on('data', data => { output += data.toString(); });                                                                         

      proc.stderr.on('data', data => { output += data.toString(); });                                                                         

      proc.on('close', code => { resolve(output); });                                                                                         

      proc.on('error', reject);                                                                                                               

    });                                                                                                                                       

  }                                                                                                                                           

                                                                                                                                              

  - Step 2: Run test to verify it fails                                                                                                       

  

  Run: node --test tests/integration.test.js                                                                                                  

  Expected: FAIL  

                                                                                                                                              

  - Step 3: Update package.json and verify                                                                                                    

  

  # package.json 添加脚本                                                                                                                     

  npm pkg set scripts.cli="node src/cli/index.js"                                                                                             

                                                                                                                                              

  - Step 4: Run test to verify it passes                                                                                                      

                                                                                                                                              

  Run: node --test tests/integration.test.js                                                                                                  

  Expected: PASS  

                                                                                                                                              

  - Step 5: Commit                                                                                                                            

                                                                                                                                              

  git add tests/integration.test.js package.json                                                                                              

  git commit -m "test: add integration tests for full pipeline"                                                                               

                                                                                                                                              

  ---                                                                                                                                         

  Task 9: 交互式确认功能完善                                                                                                                  

                                                                                                                                              

  Files:          

  - Modify: src/cli/index.js                                                                                                                  

  - Modify: src/engines/drafter/confirmer.js                                                                                                  

  - Create: tests/interactive.test.js                                                                                                         

  - Step 1: Write the failing test                                                                                                            

                                                                                                                                              

  // tests/interactive.test.js                                                                                                                

  const { test, describe } = require('node:test');                                                                                            

  const assert = require('node:assert');                                                                                                      

  const readline = require('readline');                                                                                                       

                                                                                                                                              

  describe('interactive confirmation', () => {                                                                                                

    test('should prompt and read user choice', async () => {                                                                                  

      // 模拟用户输入                                                                                                                         

      const input = require('stream').Readable.from(\['1\n']);                                                                                 

      const rl = readline.createInterface({ input, output: process.stdout });                                                                 

                                                                                                                                              

      let choice = null;                                                                                                                      

      rl.on('line', (line) => { choice = line; });                                                                                            

                                                                                                                                              

      // 等待输入处理                                                                                                                         

      await new Promise(r => setTimeout(r, 100));                                                                                             

      rl.close();                                                                                                                             

                                                                                                                                              

      assert.equal(choice, '1');                                                                                                              

    });                                                                                                                                       

  });                                                                                                                                         

                  

  - Step 2: Run test to verify it fails                                                                                                       

  

  Run: node --test tests/interactive.test.js                                                                                                  

  Expected: PASS (basic test, refine as needed)

                                                                                                                                              

  - Step 3: Implement interactive confirmation                                                                                                

                                                                                                                                              

  // src/engines/drafter/confirmer.js                                                                                                         

  const readline = require('readline');                                                                                                       

                                                                                                                                              

  function createInterface() {                                                                                                                

    return readline.createInterface({                                                                                                         

      input: process.stdin,                                                                                                                   

      output: process.stdout                                                                                                                  

    });                                                                                                                                       

  }                                                                                                                                           

                                                                                                                                              

  async function promptChoice(promptText) {                                                                                                   

    return new Promise((resolve) => {

      const rl = createInterface();                                                                                                           

      rl.question(promptText, (answer) => {                                                                                                   

        rl.close();                                                                                                                           

        resolve(answer.trim());                                                                                                               

      });                                                                                                                                     

    });                                                                                                                                       

  }                                                                                                                                           

                  

  async function confirmDraft(candidates) {                                                                                                   

    console.log('\n请输入编号确认（1-' + candidates.length + '），或输入 e 编辑: ');

    const choice = await promptChoice('> ');                                                                                                  

                                                                                                                                              

    if (choice.toLowerCase() === 'e') {                                                                                                       

      // TODO: 编辑功能                                                                                                                       

      console.log('编辑功能待实现');                                                                                                          

      return null;                                                                                                                            

    }                                                                                                                                         

                                                                                                                                              

    const index = parseInt(choice) - 1;                                                                                                       

    if (index >= 0 && index < candidates.length) {

      return candidates\[index];                                                                                                               

    }                                                                                                                                         

                                                                                                                                              

    console.log('无效选择，请重试');                                                                                                          

    return confirmDraft(candidates);

  }                                                                                                                                           

                  

  module.exports = { confirmDraft, promptChoice, createInterface };                                                                           

                  

  - Step 4: Integrate with CLI                                                                                                                

                  

  在 src/cli/index.js 中添加确认调用                                                                                                          

                  

  - Step 5: Commit                                                                                                                            

                  

  git add src/engines/drafter/confirmer.js src/cli/index.js tests/interactive.test.js                                                         

  git commit -m "feat: add interactive confirmation for draft selection"                                                                      

                                                                                                                                              

  ---                    
