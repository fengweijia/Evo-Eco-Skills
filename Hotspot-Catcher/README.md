# 🦞 热点捕手 (Hotspot Catcher)

> 根据关键词自动采集B站、小红书等平台热点，生成自媒体内容

## 功能特性

- ✅ 关键词配置 - 可自定义监听多个关键词
- ✅ 多平台采集 - 支持B站、小红书、微博、知乎
- ✅ 自动过滤 - 根据热度阈值过滤低热度内容
- ✅ 观点生成 - AI生成3个观点方向
- ✅ 文案写作 - 自动生成公众号/小红书版本
- ✅ 配套配图 - 支持接入图片生成API

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装

```bash
git clone <你的仓库地址>
cd hotspot-catcher
npm install
```

### 配置

编辑 `config.json`：

```json
{
  "keywords": ["OPC一人公司", "AI副业", "AI创业", "OpenClaw", "多智能体"],
  "platforms": ["bilibili", "xiaohongshu", "weibo", "zhihu"],
  "fetch_interval_hours": 6,
  "auto_filter": true,
  "min_views": 10000
}
```

### 运行

```bash
# 采集热点
node fetch.js

# 或使用完整流程（需要配置AI API）
node workflow.js
```

## 项目结构

```
hotspot-catcher/
├── config.json          # 配置文件
├── fetch.js             # 热点采集脚本
├── workflow.js          # 完整工作流（采集→观点→文案）
├── generate-article.js  # 文案生成器
├── utils/
│   ├── platform.js      # 平台适配器
│   └── ai.js            # AI调用封装
├── templates/           # 文案模板
│   ├── wechat.md
│   └── xiaohongshu.md
├── output/              # 输出目录
│   ├── hotspots/        # 热点数据
│   └── articles/        # 生成的文案
├── package.json
└── README.md
```

## 工作流程

```
1. 热点采集 → 根据关键词从各平台获取热点
       ↓
2. 热点筛选 → 选择要写的热点
       ↓
3. 观点生成 → AI生成3个观点方向
       ↓
4. 观点确认 → 用户选择观点
       ↓
5. 文案写作 → 生成公众号+小红书版本
       ↓
6. 配图生成 → AI生成配图（需要配置API）
       ↓
7. 手动发布 → 复制到各平台发布
```

## API 配置（可选）

### 图片生成

编辑 `config.json`：

```json
{
  "image": {
    "provider": "deepai",
    "api_key": "your-api-key"
  }
}
```

### AI 大模型

```json
{
  "ai": {
    "provider": "openai",
    "api_key": "your-api-key",
    "model": "gpt-4"
  }
}
```

## 进阶：自动化发布

要实现自动推送公众号/小红书，需要：

| 平台 | 配置要求 |
|:---|:---|
| 公众号 | app_id + app_secret |
| 小红书 | MCP 服务配置 |

## 贡献

欢迎提交 Issue 和 PR！

## License

MIT
