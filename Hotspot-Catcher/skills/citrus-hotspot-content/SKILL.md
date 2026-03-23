---
name: citrus-hotspot-content
description: 柑橘热点内容生产Skill，复用已有抓取与文案能力，产出公众号/小红书发布包与5风格配图
---

# citrus-hotspot-content

## 触发场景

- 需要围绕 config.json 中关键词做多平台热点采集
- 需要一键产出公众号+小红书发布文案
- 需要生成不同风格的配图候选
- 需要优先复用现有脚本与生态能力，不重复造轮子

## 输入参数

- `keyword`：可选；不传时使用 `config.json` 中的 `keywords`
- `platforms`：默认 `bilibili,xiaohongshu,weibo,zhihu`
- `styles`：默认 `写实摄影,清新手绘,扁平插画,国风水墨,极简海报`

## 运行方式

```bash
cd Hotspot-Catcher
npm run skill:citrus
```

自定义参数：

```bash
node workflow.js --keyword 柑橘 --styles 写实摄影,清新手绘,扁平插画,国风水墨,极简海报
```

## 输出结果

输出目录：`output/publish-pack/run-时间戳/`

- `wechat.md`：公众号发布文案（标题、正文、关键词标签）
- `xiaohongshu.md`：小红书发布文案（标题、正文、关键词标签）
- `images/manifest.json`：5风格配图候选清单
- `run-report.json`：运行报告（热点详情、人工见解、prompt迭代、复用策略、产物路径）

新增报告字段：
- `hotspots`：平台、标题、链接、热度指数等热点结构化信息
- `normalized_contents`：视频/图文统一后的标准文本对象
- `viral_analysis`：爆款结构分析结果
- `selected_template_id` / `template_candidates`：模板选择结果与候选分数
- `manual_insight_applied` / `manual_insight`：人工见解命中结果
- `prompt_iteration.best_prompt_id` / `prompt_iteration.scores`：基础prompt迭代评分
- `prompt_iteration.best_candidate_id` / `prompt_iteration.candidate_scores` / `prompt_iteration.optimized_prompt`：模板感知优化结果
- `plugin_traces`：插件provider调用与回退链路

## 复用策略

- 优先复用 `fetch.js` 的热点采集流程
- 优先复用 `utils/ai.js` 的观点与文案生成接口
- 优先复用 `templates/` 中的平台模板思路
- 外部能力按配置接入，默认提供 mock 降级，保证流程可运行
- 支持 `npm run reuse:import -- --source <url-or-path>` 导入 GitHub raw 或 skills 资产到 `assets/reuse/`
