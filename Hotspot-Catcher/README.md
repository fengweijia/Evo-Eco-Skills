# Hotspot Catcher (热点捕手)

> 自动化社交媒体内容创作工具 - 热点抓取 → AI分析 → 内容生成 → 一键发布

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/Tests-91%2F91%20passed-brightgreen)](#testing)
[![License](https://img.shields.io/badge/License-MIT-blue)](#)

## 功能特性

### 核心能力

| 能力 | 说明 |
|------|------|
| **多平台热点抓取** | 支持 Bilibili、小红书、微博、知乎、抖音、头条等平台的关键词热点搜索 |
| **智能数据清洗** | 自动去重、过滤低热度内容、提取关键信息 |
| **AI 内容分析** | 爆款结构化拆解，提取钩子、行动点、CTA 等关键要素 |
| **爆款文案生成** | 基于 viral structure 模板生成微信公众号/小红书文案 |
| **图片候选生成** | 支持多种风格（写实摄影、清新手绘、国风水墨等）的 AI 生图 |
| **飞书多维表格** | 可选存储到飞书文档，支持团队协作 |
| **Prompt 版本管理** | 支持提示词迭代优化，持续改进生成质量 |

### 支持的平台

| 类型 | 平台 |
|------|------|
| 热点来源 | Bilibili、小红书、微博、知乎、抖音、头条 |
| 发布目标 | 微信公众号、小红书 |

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境

1. 复制环境变量模板：

```bash
cp .env.example .env
```

2. 编辑 `.env` 配置 API Key：

```env
# 必填：AI 提供商（SiliconFlow）
SILICONFLOW_API_KEY=sk-xxxxxxxx

# 选填：图片生成（火山引擎/豆包）
VOLCENGINE_API_KEY=xxxxxxxx

# 选填：飞书多维表格
FEISHU_APP_ID=cli_xxxxxxxx
FEISHU_APP_SECRET=xxxxxxxx
FEISHU_SPREADSHEET_TOKEN=xxxxxxxx
```

### 运行方式

#### 方式一：默认配置运行

```bash
npm start
```

#### 方式二：命令行参数

```bash
# 指定关键词和平台
node workflow.js --keyword 柑橘 --platforms bilibili,xiaohongshu

# 指定图片风格
node workflow.js --styles 写实摄影,清新手绘,国风水墨
```

#### 方式三：配置文件

编辑 `config.json`：

```json
{
  "keywords": ["AI副业", "一人公司"],
  "platforms": ["bilibili", "xiaohongshu"],
  "ai": {
    "provider": "siliconflow",
    "model": "Pro/MiniMaxAI/MiniMax-M2.5"
  }
}
```

然后运行：

```bash
npm run fetch     # 仅抓取热点
npm run skill:citrus  # 使用 citrus skill
```

## 项目结构

```
Hotspot-Catcher/
├── workflow.js              # 主工作流入口
├── fetch.js                 # 热点抓取入口
├── config.json              # 配置文件
├── src/
│   ├── engines/             # 核心引擎
│   │   ├── hotspot/         # 热点抓取引擎
│   │   │   ├── fetcher.js   # 平台数据抓取
│   │   │   ├── normalizer.js # 数据标准化
│   │   │   ├── cleaner.js   # 数据清洗
│   │   │   └── selector.js  # 热点筛选
│   │   ├── analyzer/        # 内容分析引擎
│   │   ├── drafter/         # 文案生成引擎
│   │   └── image/           # 图片生成引擎
│   ├── cli/                 # CLI 命令行
│   ├── config/              # 配置管理
│   └── plugins/             # 插件运行时
├── content-extractor-skill/ # 内容提取 Skill
│   ├── parser.js            # JSON 解析
│   ├── crawler.js           # URL 内容抓取
│   ├── feishu.js            # 飞书存储
│   └── analyzer.js          # AI 分析
├── utils/                   # 工具函数
│   ├── ai.js                # AI 能力封装
│   ├── image.js             # 图片生成
│   ├── prompt.js            # Prompt 管理
│   └── viral-analyzer.js    # 爆款分析
├── templates/               # 模板文件
│   ├── viral-structures.json # 爆款结构模板(T1-T5)
│   └── prompt-variants.json  # Prompt 变体
├── tests/                   # 测试用例
└── output/                  # 输出目录
    ├── hotspots/            # 热点数据(JSON)
    ├── analysis/            # 分析结果
    └── publish-pack/        # 发布包
```

## 工作流程

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  1. 热点抓取     │───▶│  2. 数据清洗     │───▶│  3. 内容提取     │
│  关键词→平台    │    │  去重/过滤       │    │  URL→全文        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  6. 发布包输出   │◀───│  5. 图片生成     │◀───│  4. AI 分析      │
│  微信/小红书    │    │  多风格候选      │    │  爆款拆解        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 详细步骤

1. **热点抓取** - 按关键词在指定平台搜索热点内容，提取标题、URL、浏览量、排名
2. **数据清洗** - 去重、过滤无效内容、标准化数据格式
3. **内容提取** - 使用 Firecrawl 抓取 URL 完整内容
4. **AI 分析** - 分析爆款结构（钩子、行动点、CTA），迭代优化 Prompt
5. **文案生成** - 基于 viral structure 模板生成公众号/小红书文案
6. **图片生成** - 为每个平台生成 5 种风格的图片候选
7. **输出打包** - 生成 `output/publish-pack/run-<timestamp>/`

### 数据输出

运行完成后，在 `output/publish-pack/run-<timestamp>/` 目录生成：

```
publish-pack/run-2026-03-31T10-00-00/
├── wechat.md              # 微信公众号文章
├── xiaohongshu.md         # 小红书笔记
├── images/
│   └── manifest.json      # 图片清单
└── run-report.json        # 运行报告
```

## 配置说明

### config.json 完整配置

```json
{
  "keywords": ["关键词1", "关键词2"],
  "platforms": ["bilibili", "xiaohongshu", "weibo", "zhihu"],
  "fetch_interval_hours": 6,
  "auto_filter": true,
  "min_views": 10000,
  "ai": {
    "provider": "siliconflow",
    "api_key": "your-api-key",
    "model": "Pro/MiniMaxAI/MiniMax-M2.5"
  },
  "image": {
    "provider": "volcengine",
    "api_key": "your-api-key"
  },
  "reuse": {
    "enabled": false,
    "local_hotspots_file": "",
    "github_hotspots_url": ""
  },
  "plugins": {
    "hotspot": { "provider": "builtin" },
    "viral": { "provider": "builtin" },
    "prompt": { "provider": "builtin" },
    "image": { "provider": "builtin" }
  }
}
```

### 热门配置参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `keywords` | 监控的关键词 | ["OPC"] |
| `platforms` | 目标平台 | ["bilibili", "xiaohongshu"] |
| `min_views` | 最小浏览量过滤 | 10000 |
| `fetch_interval_hours` | 抓取间隔 | 6 |
| `ai.model` | AI 模型 | Pro/MiniMaxAI/MiniMax-M2.5 |

## 测试

```bash
# 运行所有测试
npm test

# 运行单个测试
node --test tests/engines/hotspot.test.js
```

### 测试覆盖

- 91 个测试用例，全部通过
- 覆盖热点抓取、数据清洗、内容分析、文案生成等核心模块

## 飞书集成

### 配置步骤

1. 在[飞书开放平台](https://open.feishu.cn/)创建应用
2. 添加 `contacts:contact:readonly`、`sheets:sheet` 权限
3. 获取 App ID 和 App Secret
4. 在 `.env` 中配置：

```env
FEISHU_APP_ID=cli_xxxxxxxx
FEISHU_APP_SECRET=xxxxxxxx
```

5. 运行后首次会创建飞书多维表格，数据自动同步

## 依赖工具

| 工具 | 用途 | 安装 |
|------|------|------|
| firecrawl | 网页内容抓取 | `npm install -g @mendable/firecrawl` |
| lark-cli | 飞书 API 操作 | `npx @larksuite/cli` |

## 常见问题

### Q: Firecrawl 不可用怎么办？

项目内置模拟数据作为 fallback，不影响基本功能。如需真实抓取，请安装 firecrawl：

```bash
npm install -g @mendable/firecrawl
```

### Q: 如何查看热点抓取结果？

```bash
ls output/hotspots/
cat output/hotspots/hotspots-*.json
```

### Q: 如何自定义 AI 模型？

修改 `config.json` 中的 `ai.model` 字段，支持 SiliconFlow 所有可用模型。

## 技术栈

- **运行时**: Node.js 18+
- **HTTP 客户端**: axios
- **AI 提供商**: SiliconFlow API
- **图片生成**: 火山引擎(豆包)
- **网页抓取**: Firecrawl (可选)
- **数据存储**: 飞书多维表格 / 本地 JSON

## License

MIT License - 欢迎开源贡献！

## 文档

- [CLAUDE.md](CLAUDE.md) - 开发者指南
- [开发计划](docs/superpowers/plans/) - 详细实现规划