# Viral Template Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Hotspot-Catcher 落地“5套结构驱动爆款模板 + 可插拔 skills 接口 + 可追踪 KPI 报告”的可执行生产链路。

**Architecture:** 在现有 `fetch -> ai -> image -> report` 流程中新增四层：统一文本解析、爆款分析、模板引擎、插件路由。流程先产出结构化中间结果，再进入平台文案与配图，所有阶段写入 `run-report.json` 便于验收与回归。实现采用 builtin 优先可用、external 可插拔接入、失败自动回退。

**Tech Stack:** Node.js、node:test、axios、JSON Schema 风格校验（轻量手写）、现有 CLI 工作流

---

## File Structure (Implementation Targets)

> Repo root: `/Users/apple/Documents/PythonP/Evo-Eco-Skills/Hotspot-Catcher`  
> 以下路径均相对该根目录。

- Create: `utils/content-normalizer.js` — 统一视频/图文输入为 `NormalizedContent`
- Create: `utils/viral-analyzer.js` — 抽取 `ViralAnalysis` 结构字段与评分
- Create: `utils/template-engine.js` — 5 套模板定义、模板匹配、结构化草稿输出
- Create: `utils/plugins-runtime.js` — 插件注册、路由、超时、回退、trace
- Create: `templates/viral-structures.json` — 5 套结构驱动模板配置
- Create: `tests/content-normalizer.test.js`
- Create: `tests/viral-analyzer.test.js`
- Create: `tests/template-engine.test.js`
- Create: `tests/plugins-runtime.test.js`
- Create: `tests/workflow.viral-pipeline.integration.test.js`
- Modify: `utils/prompt.js` — 增加模板感知 prompt 优化入口
- Modify: `utils/ai.js` — 消费模板草稿与优化 prompt
- Modify: `workflow.js` — 插入新流水线，产出新增报告字段
- Modify: `config.json` — 插件 provider 路由配置入口
- Modify: `README.md` — 新能力与运行方式

---

### Task 1: 实现统一文本解析层（M1）

**Files:**
- Create: `utils/content-normalizer.js`
- Test: `tests/content-normalizer.test.js`
- Modify: `workflow.js`

- [ ] **Step 1: Write the failing test (@superpowers:test-driven-development)**

```js
test('视频与图文应统一为NormalizedContent', () => {
  const items = [
    { source_type: 'video', platform: 'bilibili', title: 'A', transcript: '字幕A', url: 'https://a' },
    { source_type: 'text', platform: 'xiaohongshu', title: 'B', content: '正文B', url: 'https://b' }
  ];
  const result = normalizeContents(items);
  assert.equal(result.length, 2);
  assert.equal(result[0].raw_text, '字幕A');
  assert.equal(result[1].raw_text, '正文B');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/content-normalizer.test.js`  
Expected: FAIL with `Cannot find module '../utils/content-normalizer.js'`

- [ ] **Step 3: Write minimal implementation**

```js
function normalizeContent(item) {
  const rawText = item.source_type === 'video' ? item.transcript || '' : item.content || '';
  return {
    source_type: item.source_type || 'text',
    platform: item.platform || 'unknown',
    title: item.title || '',
    raw_text: rawText,
    metrics: { views: Number(item.views || 0), likes: Number(item.likes || 0), comments: Number(item.comments || 0), shares: Number(item.shares || 0) },
    topic_tags: Array.isArray(item.topic_tags) ? item.topic_tags : [],
    url: item.url || ''
  };
}
function normalizeContents(items) {
  return Array.isArray(items) ? items.map(normalizeContent) : [];
}
```

- [ ] **Step 4: Wire into workflow report**

Run: `node workflow.js --styles 写实摄影`  
Expected: `run-report.json` contains `normalized_contents` (at least first 10)

- [ ] **Step 5: Commit**

```bash
git add utils/content-normalizer.js tests/content-normalizer.test.js workflow.js
git commit -m "feat: add normalized content layer for video/text sources"
```

---

### Task 2: 实现爆款分析层（M2-1）

**Files:**
- Create: `utils/viral-analyzer.js`
- Test: `tests/viral-analyzer.test.js`
- Modify: `workflow.js`

- [ ] **Step 1: Write the failing test**

```js
test('应提取爆款结构字段与风格评分', () => {
  const analysis = analyzeViralStructure({
    title: 'OPC月入10万',
    raw_text: '痛点... 误区... 案例... 方法...'
  });
  assert.equal(typeof analysis.hook_sentence, 'string');
  assert.ok(Array.isArray(analysis.proof_blocks));
  assert.equal(typeof analysis.style_scores.spreadability, 'number');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/viral-analyzer.test.js`  
Expected: FAIL with `analyzeViralStructure is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
function analyzeViralStructure(content) {
  const text = String(content.raw_text || '');
  return {
    hook_sentence: String(content.title || '').slice(0, 24),
    problem_statement: text.slice(0, 80),
    conflict_point: text.includes('但是') ? '存在反差冲突' : '冲突待补充',
    proof_blocks: text.split('\n').filter(Boolean).slice(0, 3),
    action_items: ['步骤1', '步骤2', '步骤3'],
    cta_type: 'comment',
    style_scores: { emotion: 0.6, density: 0.7, actionability: 0.8, spreadability: 0.65 }
  };
}
```

- [ ] **Step 4: Integrate and expose in report**

Run: `node workflow.js --styles 写实摄影`  
Expected: `run-report.json` contains `viral_analysis`

- [ ] **Step 5: Commit**

```bash
git add utils/viral-analyzer.js tests/viral-analyzer.test.js workflow.js
git commit -m "feat: add viral analyzer for structured content signals"
```

---

### Task 3: 实现5套模板引擎（M2-2）

**Files:**
- Create: `templates/viral-structures.json`
- Create: `utils/template-engine.js`
- Test: `tests/template-engine.test.js`
- Modify: `workflow.js`

- [ ] **Step 1: Write the failing test**

```js
test('应按结构评分选择模板并输出结构化草稿', () => {
  const draft = buildTemplateDraft({
    analysis: { style_scores: { actionability: 0.9, spreadability: 0.6 } },
    platform: 'xiaohongshu',
    topic: 'OPC'
  });
  assert.equal(typeof draft.template_id, 'string');
  assert.equal(typeof draft.structured_draft, 'string');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/template-engine.test.js`  
Expected: FAIL with missing template module

- [ ] **Step 3: Write minimal implementation**

```js
const templates = loadTemplates(); // T1..T5
function selectTemplate(analysis, platform) {
  if (platform === 'xiaohongshu') return templates.find(t => t.id === 'T1') || templates[0];
  if (platform === 'wechat') return templates.find(t => t.id === 'T2') || templates[0];
  return templates.find(t => t.id === 'T3') || templates[0];
}
function buildTemplateDraft({ analysis, platform, topic }) {
  const selected = selectTemplate(analysis, platform);
  return { template_id: selected.id, slot_values: {}, structured_draft: `${selected.name}：${topic}`, selection_reason: 'rule+platform' };
}
```

- [ ] **Step 4: Add report fields**

Run: `node workflow.js --styles 写实摄影`  
Expected: report contains `selected_template_id`, `template_candidates`, `selection_reason`

- [ ] **Step 5: Commit**

```bash
git add templates/viral-structures.json utils/template-engine.js tests/template-engine.test.js workflow.js
git commit -m "feat: add five structural viral templates and selection engine"
```

---

### Task 4: 实现插件运行时与四能力接口（M4）

**Files:**
- Create: `utils/plugins-runtime.js`
- Test: `tests/plugins-runtime.test.js`
- Modify: `config.json`
- Modify: `workflow.js`

- [ ] **Step 1: Write the failing test**

```js
test('外部provider失败时应自动回退builtin并保留trace', async () => {
  const runtime = createPluginsRuntime({ hotspot: { provider: 'external' } });
  const result = await runtime.call('hotspot.search', { keywords: ['OPC'] });
  assert.equal(result.ok, true);
  assert.equal(typeof result.trace_id, 'string');
  assert.equal(result.trace.fallback_used, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/plugins-runtime.test.js`  
Expected: FAIL with `createPluginsRuntime is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
function createPluginsRuntime(config) {
  return {
    async call(method, payload) {
      try { return await callExternal(method, payload, config); }
      catch (error) { return callBuiltin(method, payload, { fallback_used: true, error }); }
    }
  };
}
```

- [ ] **Step 4: Integrate route config + traces**

Run: `node workflow.js --styles 写实摄影`  
Expected: `run-report.json` contains `plugin_traces[]` with `trace_id`, `provider`, `fallback_used`

- [ ] **Step 5: Commit**

```bash
git add utils/plugins-runtime.js tests/plugins-runtime.test.js config.json workflow.js
git commit -m "feat: add plugin runtime with provider routing and fallback trace"
```

---

### Task 5: 实现Prompt迭代人格化与平台约束（M3）

**Files:**
- Modify: `utils/prompt.js`
- Modify: `utils/ai.js`
- Test: `tests/prompt-iteration.test.js`
- Test: `tests/workflow.viral-pipeline.integration.test.js`

- [ ] **Step 1: Write the failing test**

```js
test('应生成至少2个候选prompt并返回最佳版本', () => {
  const result = optimizePromptByTemplate({
    template_id: 'T2',
    platform: 'wechat',
    persona: '专业型',
    structured_draft: '...'
  });
  assert.ok(result.candidates.length >= 2);
  assert.equal(typeof result.best_candidate_id, 'string');
  assert.equal(typeof result.optimized_prompt, 'string');
  assert.ok(Array.isArray(result.candidate_scores));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/prompt-iteration.test.js`  
Expected: FAIL with missing optimizer export

- [ ] **Step 3: Write minimal implementation**

```js
function optimizePromptByTemplate(input) {
  const candidates = [
    { id: 'p1', prompt: `模板${input.template_id} - 候选1`, score: 0.72 },
    { id: 'p2', prompt: `模板${input.template_id} - 候选2`, score: 0.78 }
  ];
  return { candidates, best_candidate_id: 'p2', persona: input.persona };
}
```

- [ ] **Step 4: Integrate ai generation path**

Run: `node --test tests/workflow.viral-pipeline.integration.test.js`  
Expected: PASS with report fields `prompt_iteration.best_candidate_id`, `prompt_iteration.candidate_scores`, `prompt_iteration.optimized_prompt`

- [ ] **Step 5: Commit**

```bash
git add utils/prompt.js utils/ai.js tests/prompt-iteration.test.js tests/workflow.viral-pipeline.integration.test.js
git commit -m "feat: add template-aware prompt optimization with persona candidates"
```

---

### Task 6: 文档、KPI与端到端验收（M5）

**Files:**
- Modify: `README.md`
- Modify: `skills/citrus-hotspot-content/SKILL.md`
- Modify: `workflow.js`
- Test: `tests/workflow.viral-pipeline.integration.test.js`

- [ ] **Step 1: Write/extend failing integration assertions**

```js
test('报告应包含KPI口径关键字段', () => {
  const report = buildRunReport(...);
  assert.ok(report.kpi_snapshot);
  assert.ok(report.plugin_traces);
  assert.ok(report.selected_template_id);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/workflow.viral-pipeline.integration.test.js`  
Expected: FAIL with missing report fields

- [ ] **Step 3: Implement missing report/docs**

```md
- README 增加：5模板说明、插件路由配置、KPI解释
- SKILL.md 增加：模板选择与人工干预流程
```

- [ ] **Step 4: Run full verification (@superpowers:verification-before-completion)**

Run: `npm test && npm run probe:siliconflow && node workflow.js --styles 写实摄影,清新手绘`  
Expected: 全绿；`run-report.json` 含 `normalized_contents`、`viral_analysis`、`selected_template_id`、`prompt_iteration`、`plugin_traces`，失败场景含 `image_error`  
Prerequisites: `.env` 或 `config.json` 提供可用 AI/图片凭证；若 external provider 不可用，允许 fallback 到 builtin，但流程必须成功产出。

- [ ] **Step 5: Commit**

```bash
git add README.md skills/citrus-hotspot-content/SKILL.md workflow.js tests/workflow.viral-pipeline.integration.test.js
git commit -m "docs: finalize viral template pipeline usage and KPI reporting"
```

---

## Execution Notes

- 严格按 @superpowers:test-driven-development 执行每个任务的 RED -> GREEN -> REFACTOR。
- 每个任务必须独立跑测试后再进入下一任务，避免跨任务耦合回归。
- 插件外部能力不可达时，必须保持 builtin 可产出，禁止中断主流程。
- 若出现外部接口异常，先使用 @superpowers:systematic-debugging 定位根因，再改代码。
