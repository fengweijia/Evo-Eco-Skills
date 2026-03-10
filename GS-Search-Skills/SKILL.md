---
name: GS-Search-Skills
description: 按关键词检索技能生态与 GitHub 项目，深度分析后定时推送到飞书
---

## Functionality

- 技能查找：面向 skills.sh、vercel-labs/agent-skills、awesome-claude-skills 等生态进行关键词检索与候选聚合
- 项目查找：在 GitHub 上按关键词检索高质量开源项目，并支持种子项目直连分析
- 信息采集：stars、forks、license、topics、更新时间等
- 深度分析：输出使用场景、适用人群、集成方式与风险点（支持 LLM，可回退规则摘要）
- 飞书推送：通过群机器人 Webhook 按规范格式推送（post 富文本）
- 定时任务：支持 interval 或 daily 定时自动推送

推荐规则：

- 仅推荐 ⭐≥2000 的 Skills/开源项目

## When To Invoke

- 需要定期获取“技能/开源项目”情报，或按关键词跟踪某个领域（如 Agent、LLM、RAG、AIGC）
- 需要把检索结果自动推送到飞书群/个人并形成可读的简报

## Inputs

- 配置文件：`config.yaml` 或 `config.json`
- 环境变量（可选）：用于注入 GitHub Token、飞书 Webhook 等敏感信息
- 查询模式：支持关键词模式或行业/品类拆解模式（单关键词与组合关键词检索）

## Outputs

- 标准化 JSON 扫描结果（stdout 或文件）
- 飞书 IM 消息推送（可选启用）

## Usage

1) 复制本目录到你的 skills 目录（例如 `.claude/skills/GS-Search-Skills/`）

2) 安装依赖

```bash
pip install -r requirements.txt
```

3) 配置（推荐用环境变量注入密钥）

```bash
cp config.example.yaml config.yaml
```

4) 手动执行一次并推送

```bash
python -m gs_search_skills.cli run --push
```

5) 启动定时任务

```bash
python -m gs_search_skills.cli schedule
```
