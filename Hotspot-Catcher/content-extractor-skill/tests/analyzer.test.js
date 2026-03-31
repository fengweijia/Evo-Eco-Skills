const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');

describe('analyzer - 爆款结构化拆解模块', () => {
  test('loadPrompt 应能加载默认prompt模板', () => {
    const { loadPrompt } = require('../analyzer.js');

    const prompt = loadPrompt();
    assert.ok(prompt, '应返回prompt内容');
    assert.ok(prompt.includes('{{CONTENT}}'), '应包含占位符 {{CONTENT}}');
    assert.ok(prompt.includes('钩子'), '应包含钩子字段');
    assert.ok(prompt.includes('冲突'), '应包含冲突字段');
    assert.ok(prompt.includes('证据'), '应包含证据字段');
    assert.ok(prompt.includes('行动点'), '应包含行动点字段');
    assert.ok(prompt.includes('CTA'), '应包含CTA字段');
  });

  test('loadPrompt 应能加载指定模板', () => {
    const { loadPrompt } = require('../analyzer.js');

    // 加载 B站风格模板
    const prompt = loadPrompt('templates/bilibili.md');
    assert.ok(prompt, '应返回模板内容');
    assert.ok(prompt.includes('{{CONTENT}}'), '应包含占位符');
  });

  test('parseAnalysisResult 应能解析AI输出', () => {
    const { parseAnalysisResult } = require('../analyzer.js');

    const aiOutput = `
钩子: 这是一个测试钩子
冲突: 这是一个测试冲突
证据: 第一条证据
第二条证据
第三条证据
行动点: 第一步操作
第二步操作
CTA: 欢迎评论讨论
    `;

    const result = parseAnalysisResult(aiOutput);

    assert.strictEqual(result.hook, '这是一个测试钩子');
    assert.strictEqual(result.conflict, '这是一个测试冲突');
    assert.ok(Array.isArray(result.evidence));
    assert.ok(result.evidence.length >= 3, '证据至少3条');
    assert.ok(Array.isArray(result.actions));
    assert.ok(result.actions.length >= 1, '行动点至少1条');
    assert.strictEqual(result.cta, '欢迎评论讨论');
  });

  test('getAvailablePrompts 应返回可用的prompt列表', () => {
    const { getAvailablePrompts } = require('../analyzer.js');

    const prompts = getAvailablePrompts();
    assert.ok(Array.isArray(prompts), '应返回数组');
    assert.ok(prompts.length > 0, '应至少包含一个prompt');
    assert.ok(prompts[0].name, '每个prompt应有name');
    assert.ok(prompts[0].path, '每个prompt应有path');
  });

  test('updatePromptVersion 应能创建新版本prompt', async () => {
    const { updatePromptVersion } = require('../analyzer.js');

    const newContent = `# 新的创作方法论\n\n分析内容: {{CONTENT}}\n\n新增洞察: 使用对话式开头`;
    const version = await updatePromptVersion('test-update', newContent);

    assert.ok(version, '应返回版本信息');
    assert.ok(version.version >= 1, '版本号应为正数');
    assert.ok(version.path.includes('versions/'), '应保存在versions目录');
  });
});