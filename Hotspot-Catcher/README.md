# 🦞 热点捕手（Hotspot Catcher）

> 面向“柑橘”等关键词的热点内容生产 Skill：抓取热点 → 生成公众号/小红书文案 → 生成 5 种风格配图候选 → 输出可发布包

## 功能概览

- ✅ 多平台热点采集（B站/小红书/微博/知乎），按 TOP5 排名选取
- ✅ 热点内容统一化处理 + 爆款结构分析（钩子/冲突/证据/CTA）
- ✅ 爆款文案生成，每平台输出 3 个候选，支持交互式确认
- ✅ 自动生成 5 种风格配图（封面/内容/小红书用图）
- ✅ 模块化架构，4 个引擎可独立调用
- ✅ 失败兜底机制（AI 非 mock、图片供应商异常时仍可产出）
- ✅ 插件运行时，支持外部技能接入
- ✅ 运行报告输出（run-report.json）

## 环境要求

- Node.js >= 18
- npm >= 9

## 安装

```bash
cd Hotspot-Catcher
npm install
```

## 一分钟上手（推荐）

```bash
npm run skill:citrus
```

该命令会使用默认参数：
- 关键词：`柑橘`
- 风格：`写实摄影,清新手绘,扁平插画,国风水墨,极简海报`

## 两种运行模式

### 模式一：传统 workflow（自动执行）

```bash
npm run skill:citrus
```

### 模式二：CLI 分步执行（推荐）

使用新的模块化 CLI，支持分步执行和交互确认：

```bash
# 完整流程
npm run cli -- --step all --keyword 柑橘

# 分步执行（可自由组合）
npm run cli -- --step hotspot --keyword 柑橘       # 抓取热点
npm run cli -- --step analyze                       # 分析热点
npm run cli -- --step draft                         # 生成文案（交互确认）
npm run cli -- --step image                         # 生成配图

# 指定平台
npm run cli -- --step all --keyword 柑橘 --platforms wechat,xiaohongshu

# 指定风格
npm run cli -- --step image --keyword 柑橘 --styles 写实摄影,清新手绘
```

### CLI 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `--step` | 执行步骤（hotspot/analyze/draft/image/all） | `--step hotspot,analyze` |
| `--keyword` | 关键词 | `--keyword 柑橘` |
| `--platforms` | 目标平台（逗号分隔） | `--platforms wechat,xiaohongshu` |
| `--styles` | 图片风格（逗号分隔） | `--styles 写实摄影,清新手绘` |
| `--config` | 配置文件路径 | `--config custom.json` |

### 3) 输出目录说明

每次运行会生成一个独立目录：

```text
output/publish-pack/run-时间戳/
├── wechat.md
├── xiaohongshu.md
├── images/
│   └── manifest.json
└── run-report.json
```

- `wechat.md`：公众号发布文案（标题、正文、关键词标签）
- `xiaohongshu.md`：小红书发布文案（标题、正文、关键词标签）
- `images/manifest.json`：两平台各 5 种风格配图候选（含 prompt 和 imageUrl）
- `run-report.json`：运行元信息、复用策略、最终产物路径

## 配置说明（config.json）

### 基础采集配置

```json
{
  "keywords": ["柑橘"],
  "platforms": ["bilibili", "xiaohongshu", "weibo", "zhihu"],
  "auto_filter": true,
  "min_views": 10000
}
```

### AI 配置

```json
{
  "ai": {
    "provider": "mock",
    "api_key": "",
    "model": "gpt-4"
  }
}
```

- `provider = mock`：使用内置兜底文案
- 非 mock：当前仍带兜底，不会因空观点导致流程崩溃

### 图片配置

```json
{
  "image": {
    "provider": "mock",
    "api_key": ""
  }
}
```

- `provider = mock`：返回可用占位图链接
- `provider = deepai`：调用 DeepAI 文生图
- `provider = siliconflow`：调用 SiliconFlow 图片接口
- `provider = volcengine/huoshan/ark`：调用火山 Ark 图片接口
- 未知 provider / key 缺失 / 调用失败：自动回退 mock 链接

### 生态复用配置

```json
{
  "reuse": {
    "enabled": false,
    "local_hotspots_file": "",
    "github_hotspots_url": ""
  }
}
```

- `enabled=true` 时优先尝试复用数据：
  - `local_hotspots_file`：本地 JSON 文件路径
  - `github_hotspots_url`：可直接 GET 的 JSON URL
- 复用数据命中后，会优先作为热点来源

## NPM 脚本

```bash
npm run fetch         # 仅采集热点
npm run skill:citrus  # Skill 主流程（推荐）
npm run reuse:import -- --source <url-or-path> # 复用资产导入
npm run probe:siliconflow # 真实API连通性探针
npm test              # 稳定性测试
```

探针输出说明：
- `chat.status=ok`：文案模型真实可用
- `image.status=ok`：图片真实可用（非占位图）
- `image.status=degraded`：已降级到占位图，需看 `image.lastError` 定位原因

## 人工见解干预

在 `input/manual-insights.json` 中配置人工见解（可从 `input/manual-insights.example.json` 复制）：

```json
[
  { "keyword": "OPC", "insight": "强调可复制流程与风险边界" }
]
```

工作流会自动按关键词命中并融合到观点/文案生成过程，运行报告中会标记：
- `manual_insight_applied`
- `manual_insight`

## Prompt 迭代优化

项目内置 `templates/prompt-variants.json`，用于配置多种提示词策略。每次运行会在 `run-report.json` 输出：
- `prompt_iteration.best_prompt_id`
- `prompt_iteration.scores`
- `prompt_iteration.best_candidate_id`
- `prompt_iteration.candidate_scores`
- `prompt_iteration.optimized_prompt`

你可以持续调优变体描述与策略，以提高目标平台内容质量。

## GitHub/Skills 生态复用

通过导入脚本快速复用外部资产：

```bash
npm run reuse:import -- --source https://raw.githubusercontent.com/<owner>/<repo>/main/<file>
npm run reuse:import -- --source /absolute/path/to/skills/<skill>/SKILL.md
```

导入结果会写入：
- `assets/reuse/reuse-*.txt`
- `assets/reuse/reuse-manifest.json`

## 爆款模板与插件路由

- 爆款模板配置：`templates/viral-structures.json`（T1 问题-方案、T2 误区-纠偏、T3 案例拆解、T4 清单指南、T5 趋势预判）
- 统一文本解析：`utils/content-normalizer.js`
- 爆款分析：`utils/viral-analyzer.js`
- 模板引擎：`utils/template-engine.js`
- 插件运行时：`utils/plugins-runtime.js`

`config.json` 的 `plugins` 字段可配置各能力的 provider（`builtin` 或 `external`），当 external 不可用时会自动 fallback。

## 测试

当前内置稳定性测试覆盖：
- 非 mock AI 场景观点兜底
- 图片供应商异常回退
- 生态复用数据源优先接入
- 插件路由优先级与 schema 回退
- 爆款模板与 prompt 迭代字段输出

执行：

```bash
npm test
```

## 项目结构

```text
Hotspot-Catcher/
├── config.json
├── fetch.js
├── workflow.js
├── package.json
├── docs/
│   └── superpowers/
├── input/
│   └── manual-insights.example.json
├── scripts/
│   ├── import-reuse-assets.js
│   └── probe-siliconflow.js
├── skills/
│   └── citrus-hotspot-content/
│       └── SKILL.md
├── templates/
│   ├── prompt-variants.json
│   ├── viral-structures.json
│   ├── wechat.md
│   └── xiaohongshu.md
├── tests/
│   ├── workflow.stability.test.js
│   ├── workflow.integration.test.js
│   └── workflow.viral-pipeline.integration.test.js
└── utils/
    ├── ai.js
    ├── content-normalizer.js
    ├── hotspot.js
    ├── image.js
    ├── insight.js
    ├── plugins-runtime.js
    ├── prompt.js
    ├── reuse.js
    ├── template-engine.js
    ├── viral-analyzer.js
    └── platform.js
```

## 常见问题

### Q1：为什么输出目录没有文件？
- 先执行 `npm run skill:citrus`，产物按时间戳生成在 `output/publish-pack/` 下。

### Q2：我接入了真实 AI/图片后失败怎么办？
- 当前流程有兜底机制，优先保证“有产出”。你可以先看 `run-report.json` 再定位配置问题。

### Q3：如何做成自动发布？
- 当前定位是“生成可发布包 + 手动发布”，后续可按公众号/小红书接口扩展发布器。

### Q4：如何确认热点详情是否完整？
- 查看 `run-report.json` 中 `hotspots` 字段，包含平台、标题、链接、热度指数等结构化信息。

## License

MIT
