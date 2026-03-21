---
name: citrus-hotspot-content
description: 柑橘热点内容生产Skill，复用已有抓取与文案能力，产出公众号/小红书发布包与5风格配图
---

# citrus-hotspot-content

## 触发场景

- 需要围绕“柑橘”做多平台热点采集
- 需要一键产出公众号+小红书发布文案
- 需要生成不同风格的配图候选
- 需要优先复用现有脚本与生态能力，不重复造轮子

## 输入参数

- `keyword`：默认 `柑橘`
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
- `run-report.json`：运行报告（复用策略、产物路径、基础元数据）

## 复用策略

- 优先复用 `fetch.js` 的热点采集流程
- 优先复用 `utils/ai.js` 的观点与文案生成接口
- 优先复用 `templates/` 中的平台模板思路
- 外部能力按配置接入，默认提供 mock 降级，保证流程可运行
