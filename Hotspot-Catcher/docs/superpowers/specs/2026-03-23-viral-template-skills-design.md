# Viral Template Skills Design

## 1. 目标与范围

本设计面向 Hotspot-Catcher 下一阶段能力升级，目标是构建“爆款模板优先”的内容生产流水线，并为后续生态复用预留解耦接口。

已确认的产品决策：
- 爆款策略优先级：模板优先
- 模板数量：5 套
- 模板切分方式：结构驱动

本期范围：
- 统一视频/图文内容为可分析文本
- 提取爆款结构与风格信号
- 用 5 套结构模板重组内容草稿
- 对 Prompt 做模板感知的迭代与人格化优化
- 预留可插拔 skills 接口（热点查询、爆款解析、Prompt 优化、图像生成）

非本期范围：
- 完整的线上发布自动化
- 全量平台真实反馈闭环（本期先埋点）

---

## 2. 总体架构

升级后的主流程：

1. 热点采集（Hotspot Provider）
2. 统一文本解析（Content Normalizer）
3. 爆款分析（Viral Analyzer）
4. 模板重组（Template Engine）
5. Prompt 迭代（Prompt Optimizer）
6. 平台文案生成（WeChat / Xiaohongshu）
7. 图像生成（Image Generator）
8. 运行报告输出（run-report.json）

新增核心模块：
- `content_normalizer`：将视频字幕、图文正文统一为标准文本对象
- `viral_analyzer`：抽取钩子、冲突、证据、行动建议、CTA 等结构
- `template_engine`：按 5 套结构模板填槽输出 `structured_draft`
- `prompt_optimizer`：结合模板特征与平台约束迭代 prompt
- `plugins_runtime`：插件加载、路由、健康检查、降级回退

---

## 3. 数据模型设计

### 3.1 NormalizedContent

统一输入对象：
- `source_type`: `video | text`
- `platform`: `bilibili | xiaohongshu | weibo | zhihu | ...`
- `title`: 标题
- `raw_text`: 统一后的正文文本
- `metrics`: `{ views, likes, comments, shares }`
- `topic_tags`: 主题标签列表
- `url`: 来源链接

### 3.2 ViralAnalysis

爆款分析结果：
- `hook_sentence`
- `problem_statement`
- `conflict_point`
- `proof_blocks[]`
- `action_items[]`
- `cta_type`
- `style_scores`: `{ emotion, density, actionability, spreadability }`

### 3.3 TemplateDraft

模板引擎输出：
- `template_id`
- `slot_values`
- `structured_draft`
- `selection_reason`

### 3.4 PromptIteration

Prompt 优化结果：
- `optimized_prompt`
- `persona`
- `constraints`
- `candidate_scores[]`
- `best_candidate_id`

---

## 4. 五套结构驱动模板

### T1 问题-方案型
- 痛点开场
- 问题拆解
- 三步方案
- 风险提醒
- CTA

### T2 误区-纠偏型
- 常见误区
- 错误根因
- 正确做法
- 对比案例
- CTA

### T3 案例拆解型
- 背景
- 关键动作
- 结果数据
- 可复用方法
- CTA

### T4 清单指南型
- 目标定义
- 清单分层（必做/可选/避坑）
- 执行节奏
- CTA

### T5 趋势预判型
- 趋势信号
- 机会窗口
- 入场条件
- 风险边界
- CTA

模板选择规则：
- 主规则：按 `style_scores` 与模板画像匹配
- 次规则：按平台偏好打平局（公众号偏 T2/T5，小红书偏 T1/T4）
- 记录：`selected_template_id`、`template_candidates`、`selection_reason`

---

## 5. Skills 解耦接口设计

### 5.1 能力接口

- `HotspotProvider`
  - 输入：关键词、平台、时间窗
  - 输出：标准化热点列表
- `ViralAnalyzer`
  - 输入：`NormalizedContent`
  - 输出：`ViralAnalysis`
- `PromptOptimizer`
  - 输入：`TemplateDraft` + 平台目标
  - 输出：`PromptIteration`
- `ImageGenerator`
  - 输入：封面主题与风格
  - 输出：图片 URL、模型与错误上下文

### 5.2 插件契约（统一返回）

- 元信息：`plugin_id`, `version`, `capabilities`, `priority`, `timeout_ms`
- 方法：
  - `hotspot.search(payload)`
  - `viral.analyze(payload)`
  - `prompt.optimize(payload)`
  - `image.generate(payload)`
- 标准响应：
  - `ok`
  - `data`
  - `error_code`
  - `error_message`
  - `trace_id`

### 5.3 运行时路由

- 配置入口：`config.plugins.<capability>.provider`
- 路由顺序：
  1. external provider 可用则优先调用
  2. 超时/异常/Schema 不通过时自动回退 builtin
- 健康检查：
  - 启动时 `ping`
  - 调用时超时熔断与重试

---

## 6. Prompt 迭代与人格化策略

策略原则：
- 模板优先：先保证结构命中
- 平台适配：同一模板在公众号/小红书采用不同约束
- 人格化：引入可配置 persona（专业型、陪伴型、犀利型等）

优化维度：
- 钩子强度
- 逻辑完整性
- 可执行性
- 传播性
- 风险提示完整性

输出要求：
- 至少 2 个候选 prompt 版本
- 记录评分与最佳版本
- 全量落入 `run-report.json`

---

## 7. 评估指标（KPI）

解析质量：
- 文本统一解析成功率 > 95%
- 结构字段完整率 > 90%

内容质量：
- 模板匹配准确率（抽检）
- 平台适配评分
- 爆款特征评分

工程稳定性：
- 端到端成功率
- 插件回退率
- 平均生成时延

业务效果（后续）：
- 点击率、完读率、互动率
- 高热素材转高表现稿件比例

---

## 8. 分阶段落地路线图

### M1 统一解析层
- 完成视频/图文统一文本对象
- 保留源数据与可追溯字段

### M2 爆款分析 + 模板引擎
- 上线 5 套结构模板
- 完成模板选择策略与解释字段

### M3 Prompt 迭代人格化
- 引入模板感知 Prompt 优化
- 输出候选评分与最佳选择

### M4 Skills 接口化
- 四大能力接口与 runtime 路由
- 健康检查、超时回退、trace 追踪

### M5 运营化评估
- 报告中沉淀 KPI
- 为反馈闭环埋点

---

## 9. 风险与约束

- 外部平台数据格式不稳定：通过 Normalizer + Schema 校验吸收差异
- 插件能力不可用：通过 builtin fallback 保证可产出
- 模板化过强导致同质化：通过 Prompt 迭代与 persona 参数缓解
- 成本与时延上升：通过阶段化开关、缓存与超时策略控制

---

## 10. 验收标准

功能验收：
- 能将视频/图文统一到标准文本对象
- 能稳定输出 5 套模板之一的结构化草稿
- 能输出带评分的 Prompt 迭代结果
- 能通过插件路由与回退机制完成端到端产出

报告验收：
- `run-report.json` 必含：
  - `hotspots`
  - `viral_analysis`
  - `selected_template_id`
  - `prompt_iteration`
  - `plugin_traces`
  - `image_error`（若失败）

稳定性验收：
- 自动化测试通过
- 主流程在外部能力异常时仍可降级产出

---

## 11. 决策台账（冻结）

- 冻结版本：`spec-v1`
- 冻结日期：`2026-03-23`
- 决策责任：产品/内容策略负责人（用户）+ 工程实现负责人（本项目）

已冻结决策：
- 爆款策略优先级：模板优先
- 模板数量：5 套
- 模板切分：结构驱动
- 落地策略：规则模板 + LLM 重排器

变更规则：
- 任何变更必须更新本节版本号、日期与变更原因

---

## 12. 接口 Schema 与错误码

### 12.1 通用响应

```json
{
  "ok": true,
  "data": {},
  "error_code": "",
  "error_message": "",
  "trace_id": "string"
}
```

约束：
- `ok=true` 时 `data` 必填
- `ok=false` 时 `error_code` 与 `error_message` 必填

### 12.2 能力接口必填字段

- `hotspot.search(payload)`
  - 必填：`keywords[]`, `platforms[]`
- `viral.analyze(payload)`
  - 必填：`raw_text`, `platform`, `title`
- `prompt.optimize(payload)`
  - 必填：`template_id`, `structured_draft`, `platform`
- `image.generate(payload)`
  - 必填：`prompt`, `style`, `platform`

### 12.3 标准错误码

- `E_TIMEOUT`：调用超时
- `E_SCHEMA_INVALID`：响应结构不合规
- `E_PROVIDER_UNAVAILABLE`：外部 provider 不可用
- `E_AUTH_FAILED`：认证失败
- `E_QUOTA_EXCEEDED`：额度不足/账户异常
- `E_UNKNOWN`：未知错误

---

## 13. KPI 口径与周期

| 指标 | 口径 | 周期 | 目标 |
|---|---|---|---|
| 文本统一解析成功率 | 成功解析条数 / 采集条数 | 每日 | >95% |
| 结构字段完整率 | 关键字段完整条数 / 已解析条数 | 每日 | >90% |
| 模板匹配准确率 | 抽检正确条数 / 抽检总数 | 每周 | >85% |
| 端到端成功率 | 成功产出次数 / 总运行次数 | 每日 | >95% |
| 插件回退率 | 回退次数 / 外部调用总次数 | 每日 | <20% |
| 平均生成时延 | 单次流程耗时均值 | 每日 | <180s |

---

## 14. 阶段里程碑门槛

- M1 完成门槛：统一解析测试通过 + 报告含 `NormalizedContent`
- M2 完成门槛：5 模板可选可追溯 + 模板选择理由落报告
- M3 完成门槛：Prompt 候选评分可复现 + 最佳候选稳定输出
- M4 完成门槛：四接口路由可切换 + 异常可回退
- M5 完成门槛：KPI 报告稳定输出 + 回归测试全绿
