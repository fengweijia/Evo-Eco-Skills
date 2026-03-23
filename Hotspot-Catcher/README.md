# 🦞 热点捕手（Hotspot Catcher）

> 面向“柑橘”等关键词的热点内容生产 Skill：抓取热点 → 生成公众号/小红书文案 → 生成 5 种风格配图候选 → 输出可发布包

## 功能概览

- ✅ 多平台热点采集（B站/小红书/微博/知乎）
- ✅ 支持复用生态数据源（本地 JSON 或 GitHub URL）
- ✅ 自动生成双平台发布文案（标题、正文、关键词标签）
- ✅ 自动生成 5 种风格配图候选
- ✅ 失败兜底机制（AI 非 mock、图片供应商异常时仍可产出）
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

## Skill 详细使用方法

### 1) 默认运行

```bash
npm run skill:citrus
```

### 2) 自定义关键词与风格

```bash
node workflow.js --keyword 柑橘 --styles 写实摄影,清新手绘,扁平插画,国风水墨,极简海报
```

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
npm run probe:siliconflow # 真实API连通性探针
npm test              # 稳定性测试
```

## 测试

当前内置稳定性测试覆盖：
- 非 mock AI 场景观点兜底
- 图片供应商异常回退
- 生态复用数据源优先接入

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
├── skills/
│   └── citrus-hotspot-content/
│       └── SKILL.md
├── tests/
│   └── workflow.stability.test.js
├── templates/
│   ├── wechat.md
│   └── xiaohongshu.md
└── utils/
    ├── ai.js
    ├── image.js
    └── platform.js
```

## 常见问题

### Q1：为什么输出目录没有文件？
- 先执行 `npm run skill:citrus`，产物按时间戳生成在 `output/publish-pack/` 下。

### Q2：我接入了真实 AI/图片后失败怎么办？
- 当前流程有兜底机制，优先保证“有产出”。你可以先看 `run-report.json` 再定位配置问题。

### Q3：如何做成自动发布？
- 当前定位是“生成可发布包 + 手动发布”，后续可按公众号/小红书接口扩展发布器。

## License

MIT
