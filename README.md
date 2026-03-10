# Evo-Eco-Skills

这个仓库用于沉淀可复用的 Skills。

当前包含：

- GS-Search-Skills：按关键词检索技能生态与 GitHub 项目，采集基础信息、深度分析，并推送到飞书；支持定时执行。

## GS-Search-Skills 使用指南

### 1) 准备环境

- Python：建议 3.10+（本项目使用 `zoneinfo` 做时区计算）
- 可选 Node.js：仅在你希望启用 `npx skills find` 的增强搜索时需要

### 2) 安装依赖

在 Skill 目录下执行：

```bash
cd ～/GS-Search-Skills
pip install -r requirements.txt
```

### 3) 配置方式（推荐：config.yaml + 环境变量注入密钥）

GS-Search-Skills 读取配置文件 `config.yaml`（默认在当前工作目录），并支持在 YAML/JSON 里使用 `${ENV_VAR}` 形式引用环境变量。

创建你的配置：

```bash
cp config.example.yaml config.yaml
```

也可以通过环境变量指定配置文件路径：

```bash
export GS_SEARCH_SKILLS_CONFIG="/绝对路径/你的config.yaml"
```

查询模式：

- `keywords`：直接使用 `keywords_cn/keywords_en` 逐个关键词检索
- `industries`：按“行业/品类”拆解关键词，并自动组合（单词、双词、三词组合）形成更有意义的检索

当前默认使用 `industries`，配置示例见 [config.example.yaml](file:///Users/apple/Documents/PythonP/Evo-Eco-Skills/GS-Search-Skills/config.example.yaml)。

`industries` 配置要点：

- `singles`：你明确希望单独查询的关键词（例如“文生图”“文章扩写”）
- `groups`：关键词分组。系统会自动生成组合查询（例如“公众号 内容创作”“小红书 笔记生成”“公众号 内容创作 文生图”）
- `query.max_combo_size`：组合关键词的最大长度（默认 3）
- `query.max_combos_per_industry`：每个行业最多生成多少条组合查询，防止组合爆炸

### 4) 环境变量配置（重点）

#### 4.1 GitHub（建议配置，避免限流）

GS-Search-Skills 会调用 GitHub API（repo search / code search / repo readme）。匿名访问很容易触发限流，建议配置 token。

- `GITHUB_TOKEN`：GitHub Personal Access Token（建议至少具备 public repo read 权限）

获取方法（GitHub 网页端）：

1. 打开 GitHub 右上角头像 → Settings
2. 左侧进入 Developer settings → Personal access tokens
3. 选择 Fine-grained tokens（或 Tokens (classic)）
4. Generate new token，设置有效期与权限
   - 仅检索公开仓库：通常不需要额外 scope（classic 可不勾选任何 scope 或仅最小权限）
   - 若你需要访问私有仓库：需要给相应 repo 的读取权限
5. 生成后复制一次性显示的 token，并设置为环境变量 `GITHUB_TOKEN`

macOS / zsh 示例：

```bash
export GITHUB_TOKEN="ghp_xxx"
```

推荐规则（重要）：

- 本 Skill 只推送 ⭐≥2000 的 Skills/开源项目（低于 2000 star 的不予推荐）
- `config.yaml` 的 `github.min_stars` 默认建议设置为 `2000`（你也可以提高阈值）

#### 4.2 飞书（推送必配）

飞书推送改为使用「群机器人 Webhook」方式：不再需要 `chat_id` / tenant_access_token。

- `FEISHU_WEBHOOK_URL`：群机器人 webhook 地址（形如 `https://open.feishu.cn/open-apis/bot/v2/hook/xxxx`）
- `FEISHU_WEBHOOK_SECRET`：可选。如果机器人启用了“签名校验”，需要填这里；未启用则留空即可。

macOS / zsh 示例：

```bash
export FEISHU_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/xxxx"
export FEISHU_WEBHOOK_SECRET="xxxxxx"
```

常见坑：

- `${...}` 里必须写“环境变量名”，例如 `${FEISHU_WEBHOOK_URL}`，不要把真实值写进 `${}` 里（否则会被当成变量名解析失败）。

获取方法（飞书客户端）：

1. 进入目标群 → 群设置
2. 添加机器人（自定义机器人/群机器人）
3. 在机器人配置里复制 Webhook 地址
4. 如果开启了“签名校验”，同时复制 Secret 并设置为 `FEISHU_WEBHOOK_SECRET`

#### 4.3 LLM（可选，开启后输出更强的“使用场景/集成方式/风险点”）

默认关闭。开启后会走 OpenAI 兼容的 Chat Completions 接口。

- `OPENAI_API_KEY`：API Key
- `OPENAI_BASE_URL`：可选，默认 `https://api.openai.com/v1`（兼容服务可填自建 base url）

macOS / zsh 示例：

```bash
export OPENAI_API_KEY="sk-xxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_MODEL="gpt-4o-mini"
```

然后在 `config.yaml` 中将：

```yaml
llm:
  enabled: true
  api_key: ${OPENAI_API_KEY}
  base_url: ${OPENAI_BASE_URL}
  model: ${OPENAI_MODEL}
```

国内大模型（硅基流动 / DeepSeek 等）配置方式：

- 本 Skill 只依赖“OpenAI 兼容接口”这一个抽象：你只要把 `base_url` 与 `model` 填成对应平台的值即可。
- `model` 建议填写你在对应平台控制台/API 文档中看到的“模型 ID”，不要只写展示名。

示例 A：硅基流动（SiliconFlow，示意）

```bash
export OPENAI_BASE_URL="https://<siliconflow-openai-compatible-base>/v1"
export OPENAI_API_KEY="<siliconflow-api-key>"
```

```yaml
llm:
  enabled: true
  base_url: ${OPENAI_BASE_URL}
  api_key: ${OPENAI_API_KEY}
  model: "<siliconflow-model-id>"
```

示例 B：DeepSeek（示意）

```bash
export OPENAI_BASE_URL="https://<deepseek-openai-compatible-base>/v1"
export OPENAI_API_KEY="<deepseek-api-key>"
```

```yaml
llm:
  enabled: true
  base_url: ${OPENAI_BASE_URL}
  api_key: ${OPENAI_API_KEY}
  model: "<deepseek-model-id>"
```

#### 4.4 skills CLI（可选，启用 find-skills）

如果你的环境有 Node.js，并希望额外使用 `npx skills find <keyword>` 来补充“官方技能商店”检索结果，可开启：

```bash
export GS_ENABLE_SKILLS_CLI=1
```

### 5) 运行示范

#### 5.1 手动执行一次（只输出 JSON，不推送）

```bash
cd /Users/apple/Documents/PythonP/Evo-Eco-Skills/GS-Search-Skills
python -m gs_search_skills.cli run --keyword Agent --keyword LLM --output ./out.json
```

说明：
- `--keyword` 可多次指定，用于临时追加关键词（不改 config.yaml）
- `--output` 可选，将结果写入文件；不填则输出到 stdout

#### 5.2 手动执行一次并推送飞书

```bash
cd /Users/apple/Documents/PythonP/Evo-Eco-Skills/GS-Search-Skills
python -m gs_search_skills.cli run --push --keyword 智能体 --keyword Agent
```

飞书消息呈现方式（推送样式）：

- 仅包含两类信息：必看技能、必看项目
- 每条只展示：名称/仓库、star 数、推荐理由（从分析结果抽取关键点）、链接（技能会额外给出安装命令）
- 若本次没有符合 ⭐≥2000 的条目，会推送“本次无推荐”

#### 5.3 定时任务（常驻进程自动推送）

在 `config.yaml` 中设置：

```yaml
schedule:
  enabled: true
  mode: interval
  interval_minutes: 360
```

或每日定时：

```yaml
schedule:
  enabled: true
  mode: daily
  daily_time: "09:30"
  timezone: Asia/Shanghai
```

启动定时：

```bash
cd /Users/apple/Documents/PythonP/Evo-Eco-Skills/GS-Search-Skills
python -m gs_search_skills.cli schedule
```

### 6) 常见问题

- GitHub 限流：配置 `GITHUB_TOKEN`；如果仍限流，本次扫描会跳过部分信源但不会中断。
- 飞书推送失败：检查 `FEISHU_APP_ID/FEISHU_APP_SECRET` 与 `receive_id_type/receive_id` 是否匹配，并确保应用具备 IM 发消息权限。
- 密钥安全：不要把 token/secret 写进仓库；推荐只写 `${ENV_VAR}`，在运行时通过 `export` 注入。
