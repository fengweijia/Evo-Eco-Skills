---
name: rednote-operator-v2
description: 小红书账号运营助手V2 - 基于DeepSeek AI + Agent-Reach数据源的智能运营工具
---

# rednote002 - 小红书运营军师（重构版）

## 触发条件

当用户提到以下内容时自动触发：
- 小红书账号运营
- 种草笔记制作
- 对标账号分析
- 内容规划与创作
- 社交媒体运营自动化
- rednote002

## 核心功能（7大模块）

### 1. 账号配置
- 输入账号定位、目标受众、运营目标、调性风格
- 生成结构化账号画像

### 2. 对标账号搜索
- 使用Agent-Reach（开源）采集短视频平台数据
- 搜索抖音/快手/B站/小红书同领域账号
- 按粉丝/互动/内容质量排序

### 3. 账号设计 ⭐NEW
- 根据对标分析，差异化设计：
  - 账号名称（3个候选）
  - 账号介绍
  - 背景图/头像建议
  - 人设定位
  - 内容风格

### 4. 内容拆解分析
- 爆款内容结构分析
- 标题模板提取
- 发布频率建议
- 互动特征分析

### 5. 主题规划
- 结合账号定位和热点
- 自动规划3-5个制作主题
- 用户确认后进入生成

### 6. 笔记生成
- 标题（3个备选）
- 正文（图文/视频脚本）
- 封面图描述（AI生成）
- 标签建议
- 发布时间建议

### 7. 数据监控
- 手动导入笔记数据
- 性能分析
- 优化建议

## 技术栈

| 模块 | 方案 |
|------|------|
| 大模型 | **DeepSeek** (deepseek-chat) |
| 数据采集 | **Agent-Reach** (开源免费) |
| 封面图 | **Doubao-Seedream-5.0** |
| 视频生成 | **Doubao-Seedance-2.0** |
| 部署 | Serverless / Docker |

## 数据流程

```
用户配置 → Agent-Reach搜索 → 账号设计 → 内容拆解 
→ 主题规划 → DeepSeek生成 → 笔记输出 → 数据监控
```

## 配置说明

在 `config/account.config.js` 中配置：

```javascript
ai: {
  provider: "deepseek",
  apiKey: "your-deepseek-api-key",
  model: "deepseek-chat",
  imageProvider: "tongyi",
  imageApiKey: "your-tongyi-api-key"
}
```

## 相关资源

- **Agent-Reach**: https://github.com/Panniantong/Agent-Reach
- **DeepSeek API**: https://platform.deepseek.com/
- **通义万相**: https://dashscope.console.aliyun.com/

## 与opc001的关系

复用opc001的技术架构：
- 多Agent工作流设计
- OPCV2.0设计系统风格
- Serverless后端部署