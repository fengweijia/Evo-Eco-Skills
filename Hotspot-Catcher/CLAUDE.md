# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hotspot Catcher (热点捕手)** is a Node.js-based Skill that automates social media content creation for WeChat and Xiaohongshu. It:
- Fetches hot topics from multiple platforms (Bilibili, Xiaohongshu, Weibo, Zhihu)
- Generates AI opinions and article drafts using configurable AI providers
- Generates image candidates in 5 styles for both platforms
- Packages everything into a publish-ready directory

## Common Development Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies (only `axios` is required) |
| `npm start` | Run the main workflow with default options |
| `npm run skill:citrus` | Run Skill with default citrus keyword and styles |
| `npm run fetch` | Only fetch hotspots without full content generation |
| `npm run reuse:import -- --source <url-or-path>` | Import reusable assets from URL or local path |
| `npm run probe:siliconflow` | Test SiliconFlow API connectivity |
| `npm test` | Run all tests using Node.js built-in test runner |
| `node --test tests/<file>.test.js` | Run a single test file |
| `cp .env.example .env` | Copy environment template for API keys |

### Custom Usage
```bash
node workflow.js --keyword 柑橘 --styles 写实摄影,清新手绘,扁平插画,国风水墨,极简海报
```

## High-Level Architecture

### Core Workflow (workflow.js:217-306)
The main workflow follows this pipeline:
1. Parse CLI arguments (keyword, styles) and load config
2. Fetch hotspots or use ecosystem reuse data
3. Use plugin runtime for hotspot search with fallback
4. Normalize content and analyze viral structure
5. Build template draft using 5 viral structure templates (T1-T5)
6. Optimize prompts and apply manual insights
7. Generate AI opinions and WeChat/Xiaohongshu articles
8. Generate image candidates in configured styles
9. Save everything to `output/publish-pack/run-<timestamp>/`
10. Generate comprehensive `run-report.json`

### Key Modules

| Module | Purpose |
|--------|---------|
| `workflow.js` | Main orchestrator of the entire pipeline |
| `fetch.js` | Hotspot fetching from platforms or reuse sources |
| `utils/ai.js` | AI opinion and article generation with fallbacks |
| `utils/image.js` | Image generation with multiple provider support |
| `utils/viral-analyzer.js` | Analyzes content for viral potential |
| `utils/template-engine.js` | Builds drafts using viral structure templates |
| `utils/plugins-runtime.js` | Plugin routing with fallback mechanisms |
| `utils/prompt.js` | Prompt variant management and optimization |

### Fallback Mechanisms
The project is designed with robust fallbacks:
- **AI provider failures**: Use built-in fallback opinions/articles
- **Image provider failures**: Fall back to picsum.photos placeholders
- **Missing config**: Use sensible defaults
- **Plugin failures**: Fall back to built-in capabilities
- **Reuse data not available**: Fall back to fetched hotspots

### Configuration (config.json)
- `keywords`: Array of keywords to track
- `platforms`: Target platforms to fetch from
- `ai.provider`: AI provider (`mock`, `siliconflow`)
- `image.provider`: Image provider (`mock`, `deepai`, `siliconflow`, `volcengine`/`huoshan`/`ark`)
- `reuse`: Ecosystem reuse options (local file or GitHub URL)
- `plugins`: Plugin routing configuration

### Output Structure
Each run generates:
```
output/publish-pack/run-<timestamp>/
├── wechat.md              # WeChat article (title, body, tags)
├── xiaohongshu.md         # Xiaohongshu article
├── images/
│   └── manifest.json      # 5 style images per platform
└── run-report.json        # Comprehensive run metadata
```

### Test Structure
Tests use Node.js built-in `node:test` runner. Key test files in `tests/`:
- `workflow.stability.test.js`: Stability tests for fallback mechanisms
- `workflow.integration.test.js`: Integration tests
- `viral-analyzer.test.js`: Viral structure analyzer tests
- `image-retry.test.js`: Image provider retry/fallback tests

## Important Conventions

- **Failure is not fatal**: The system prioritizes "having output" over perfect output
- **Config in config.json, secrets in .env**: Use .env for API keys (copy from .env.example)
- **Manual insights**: Place in `input/manual-insights.json` (copy from example)
- **Viral templates**: Defined in `templates/viral-structures.json` (T1-T5)
- **Prompt variants**: Configured in `templates/prompt-variants.json`
