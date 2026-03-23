# Hotspot Pipeline Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现“热点详情展示 + 人工观点融合 + Prompt迭代优化 + 生态复用增强”的完整生产闭环。

**Architecture:** 在现有 `fetch -> opinion -> draft -> image` 流程上新增四层能力：热点标准化展示层、人工干预层、Prompt迭代引擎层、复用资源导入层。通过结构化 JSON 输入输出打通每一层，保证可测试、可追踪、可扩展。

**Tech Stack:** Node.js、axios、node:test、JSON 配置驱动、Markdown 模板、CLI 工作流

---

### Task 1: 热点详情标准化与展示

**Files:**
- Create: `utils/hotspot.js`
- Modify: `fetch.js`
- Modify: `workflow.js`
- Test: `tests/hotspot-details.test.js`

- [ ] **Step 1: Write the failing test**

```js
test('热点详情应包含平台/标题/链接/热度指数', async () => {
  const details = normalizeHotspots([{ platform: 'bilibili', title: 'A', url: 'https://x', views: 12000 }]);
  assert.equal(details[0].platform, 'bilibili');
  assert.equal(typeof details[0].heat_score, 'number');
  assert.ok(details[0].url.startsWith('http'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/hotspot-details.test.js`
Expected: FAIL with `normalizeHotspots is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
function normalizeHotspots(items) {
  return items.map((item, index) => ({
    id: `${item.platform}-${index + 1}`,
    platform: item.platform,
    title: item.title,
    url: item.url || '',
    heat_score: Number(item.views || item.likes || 0),
    raw: item
  }));
}
```

- [ ] **Step 4: Integrate into workflow output**

Run: `node workflow.js --styles 写实摄影`
Expected: `run-report.json` 包含 `hotspots` 数组及上述字段

- [ ] **Step 5: Commit**

```bash
git add utils/hotspot.js fetch.js workflow.js tests/hotspot-details.test.js
git commit -m "feat: normalize hotspot details with heat score"
```

### Task 2: 人工见解干预与融合生成

**Files:**
- Create: `utils/insight.js`
- Create: `input/manual-insights.example.json`
- Modify: `workflow.js`
- Modify: `utils/ai.js`
- Test: `tests/manual-insight-merge.test.js`

- [ ] **Step 1: Write the failing test**

```js
test('人工见解应融合进观点与文案生成输入', async () => {
  const insight = loadManualInsight({ hotspot_id: 'bilibili-1', insight: '强调变现路径与风险边界' });
  assert.ok(insight.insight.includes('变现路径'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/manual-insight-merge.test.js`
Expected: FAIL with `loadManualInsight is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
function mergeInsightIntoPrompt(basePrompt, insight) {
  if (!insight) return basePrompt;
  return `${basePrompt}\n\n人工见解:\n${insight}`;
}
```

- [ ] **Step 4: Add workflow entry**

Run: `node workflow.js --styles 写实摄影`
Expected: 当存在 `input/manual-insights.json` 时，`run-report.json` 含 `manual_insight_applied: true`

- [ ] **Step 5: Commit**

```bash
git add utils/insight.js input/manual-insights.example.json workflow.js utils/ai.js tests/manual-insight-merge.test.js
git commit -m "feat: support manual insight intervention in content pipeline"
```

### Task 3: Prompt 迭代引擎与质量打分

**Files:**
- Create: `utils/prompt.js`
- Create: `templates/prompt-variants.json`
- Modify: `utils/ai.js`
- Modify: `workflow.js`
- Test: `tests/prompt-iteration.test.js`

- [ ] **Step 1: Write the failing test**

```js
test('prompt迭代引擎应返回最佳版本与评分', () => {
  const result = selectBestPrompt([{ id: 'v1', score: 0.62 }, { id: 'v2', score: 0.81 }]);
  assert.equal(result.id, 'v2');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/prompt-iteration.test.js`
Expected: FAIL with `selectBestPrompt is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
function selectBestPrompt(candidates) {
  return candidates.sort((a, b) => b.score - a.score)[0];
}
```

- [ ] **Step 4: Integrate quality report**

Run: `node workflow.js --styles 写实摄影`
Expected: `run-report.json` 含 `prompt_iteration.best_prompt_id` 与 `prompt_iteration.scores`

- [ ] **Step 5: Commit**

```bash
git add utils/prompt.js templates/prompt-variants.json utils/ai.js workflow.js tests/prompt-iteration.test.js
git commit -m "feat: add prompt iteration and quality scoring"
```

### Task 4: 生态复用增强（GitHub/skills）

**Files:**
- Create: `scripts/import-reuse-assets.js`
- Create: `utils/reuse.js`
- Modify: `config.json`
- Modify: `README.md`
- Test: `tests/reuse-import.test.js`

- [ ] **Step 1: Write the failing test**

```js
test('复用导入应解析GitHub raw与skills目录来源', async () => {
  const parsed = parseReuseSource('https://raw.githubusercontent.com/a/b/main/template.md');
  assert.equal(parsed.type, 'github_raw');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/reuse-import.test.js`
Expected: FAIL with `parseReuseSource is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
function parseReuseSource(input) {
  if (input.includes('raw.githubusercontent.com')) return { type: 'github_raw', value: input };
  if (input.includes('/skills/')) return { type: 'local_skill', value: input };
  return { type: 'unknown', value: input };
}
```

- [ ] **Step 4: Add import script command**

Run: `node scripts/import-reuse-assets.js --source <url-or-path>`
Expected: 在 `assets/reuse/` 下生成导入文件并记录 `reuse-manifest.json`

- [ ] **Step 5: Commit**

```bash
git add scripts/import-reuse-assets.js utils/reuse.js config.json README.md tests/reuse-import.test.js
git commit -m "feat: strengthen reusable asset import from github and skills ecosystem"
```

### Task 5: 端到端验证与文档交付

**Files:**
- Modify: `README.md`
- Modify: `skills/citrus-hotspot-content/SKILL.md`
- Test: `tests/workflow.integration.test.js`

- [ ] **Step 1: Write the failing integration test**

```js
test('端到端流程应产出热点详情、人工见解标记与优化prompt信息', async () => {
  const report = await runWorkflowForTest();
  assert.ok(Array.isArray(report.hotspots));
  assert.equal(typeof report.prompt_iteration?.best_prompt_id, 'string');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/workflow.integration.test.js`
Expected: FAIL with missing report fields

- [ ] **Step 3: Implement missing report fields/docs**

```md
- 更新 README: 人工干预输入格式、prompt迭代策略、复用导入脚本
- 更新 SKILL.md: 新能力说明与推荐命令
```

- [ ] **Step 4: Run full verification**

Run: `npm test && npm run probe:siliconflow && node workflow.js --styles 写实摄影,清新手绘`
Expected: 全部通过，`run-report.json` 包含新增字段

- [ ] **Step 5: Commit**

```bash
git add README.md skills/citrus-hotspot-content/SKILL.md tests/workflow.integration.test.js
git commit -m "docs: finalize enhanced workflow usage and verification guide"
```
