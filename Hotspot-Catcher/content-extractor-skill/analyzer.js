const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(__dirname, 'prompts');
const TEMPLATES_DIR = path.join(PROMPTS_DIR, 'templates');
const VERSIONS_DIR = path.join(PROMPTS_DIR, 'versions');

/**
 * 加载prompt模板
 * @param {string} templatePath - 模板路径（相对于prompts目录）
 * @returns {string} prompt内容
 */
function loadPrompt(templatePath = 'default.md') {
  let fullPath;

  // 如果是完整路径直接使用，否则相对于prompts目录
  if (path.isAbsolute(templatePath)) {
    fullPath = templatePath;
  } else if (templatePath.startsWith('templates/')) {
    fullPath = path.join(PROMPTS_DIR, templatePath);
  } else {
    fullPath = path.join(PROMPTS_DIR, templatePath);
  }

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ Prompt模板不存在: ${fullPath}，使用默认`);
    return loadPrompt('default.md');
  }

  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * 获取所有可用的prompt列表
 * @returns {Array<object>} prompt列表
 */
function getAvailablePrompts() {
  const prompts = [];

  // 扫描templates目录
  if (fs.existsSync(TEMPLATES_DIR)) {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md'));
    files.forEach(file => {
      prompts.push({
        name: file.replace('.md', ''),
        path: path.join('templates', file),
        type: 'platform'
      });
    });
  }

  // 添加默认prompt
  const defaultPath = path.join(PROMPTS_DIR, 'default.md');
  if (fs.existsSync(defaultPath)) {
    prompts.unshift({
      name: 'default',
      path: 'default.md',
      type: 'default'
    });
  }

  // 扫描versions目录
  const versionsPath = path.join(PROMPTS_DIR, 'versions');
  if (fs.existsSync(versionsPath)) {
    const versionFiles = fs.readdirSync(versionsPath).filter(f => f.endsWith('.md'));
    versionFiles.forEach(file => {
      const match = file.match(/^v(\d+)_/);
      prompts.push({
        name: file.replace('.md', ''),
        path: path.join('versions', file),
        type: 'version',
        version: match ? parseInt(match[1]) : 1
      });
    });
  }

  return prompts;
}

/**
 * 解析AI输出为结构化数据
 * @param {string} aiOutput - AI返回的内容
 * @returns {object} 结构化结果
 */
function parseAnalysisResult(aiOutput) {
  // 尝试提取JSON
  let jsonStr = aiOutput;

  // 移除代码块标记
  const jsonMatch = aiOutput.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      hook: parsed.hook || '',
      conflict: parsed.conflict || '',
      evidence: parsed.evidence || [],
      emotions: parsed.emotions || [],
      actions: parsed.actions || [],
      cta: parsed.cta || '',
      value: parsed.value || ''
    };
  } catch {
    // JSON解析失败，使用正则提取
    return {
      hook: extractField(aiOutput, '钩子'),
      conflict: extractField(aiOutput, '冲突'),
      evidence: extractArray(aiOutput, '证据'),
      emotions: extractArray(aiOutput, '情绪点'),
      actions: extractArray(aiOutput, '行动点'),
      cta: extractField(aiOutput, 'CTA'),
      value: extractField(aiOutput, '价值')
    };
  }
}

/**
 * 提取单个字段
 */
function extractField(text, field) {
  const patterns = [
    new RegExp(`${field}[:：]\\s*([\\s\\S]*?)(?=\\n\\n|\\n[\\u4e00-\\u9fa5]|$)`),
    new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`),
    new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`)
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      return match[1].trim();
    }
  }
  return '';
}

/**
 * 提取数组字段 - 改进版，支持多行内容
 */
function extractArray(text, field) {
  // 字段名称的中英文映射
  const fieldNextMap = {
    '证据': ['行动点', 'actions'],
    'actions': ['cta', 'CTA'],
    'emotions': ['cta', 'CTA'],
    'evidence': ['actions', '行动点']
  };

  const nextFields = fieldNextMap[field] || [];

  // 模式1：在两行空行之间（标准段落格式）
  const pattern1 = new RegExp(`${field}[:：]\\s*([\\s\\S]*?)(?=\\n\\n|$)`);
  // 模式2：到下一个字段之前（紧凑格式）
  const nextFieldPattern = nextFields.length > 0
    ? new RegExp(`${field}[:：]\\s*([\\s\\S]*?)(?=\\n(${nextFields.join('|')})[:：]|$)`)
    : null;
  // 模式3：JSON数组格式
  const pattern3 = new RegExp(`"${field}"\\s*:\\s*\\[[\\s\\S]*?\\]`);

  const patterns = [pattern1, nextFieldPattern, pattern3].filter(Boolean);

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const content = match[1];
      // 尝试解析为JSON数组
      try {
        const arr = JSON.parse(content);
        if (Array.isArray(arr)) return arr;
      } catch {
        // 按行分割，处理多行内容
        const lines = content.split('\n')
          .map(s => s.replace(/^[-*\d]+\.?\s*/, '').trim())
          .filter(Boolean)
          // 过滤掉看起来像字段定义的行（如 "行动点: xxx"）
          .filter(line => !/^[\u4e00-\u9fa5a-zA-Z]+[:：]/.test(line));
        // 如果只有一行但包含多个项目符号，尝试进一步拆分
        if (lines.length === 1 && lines[0].includes('；') || lines[0].includes(';')) {
          return lines[0].split(/[；;]/).map(s => s.trim()).filter(Boolean);
        }
        return lines;
      }
    }
  }
  return [];
}

/**
 * 用prompt分析内容（需要AI API）
 * @param {string} content - 要分析的内容
 * @param {object} options - 选项
 * @returns {Promise<object>} 分析结果
 */
async function analyzeContent(content, options = {}) {
  const prompt = options.prompt || loadPrompt(options.promptPath || 'default.md');
  const fullPrompt = prompt.replace(/{{CONTENT}}/g, content);

  // 如果配置了AI API，调用它
  if (options.aiApiKey && options.aiModel) {
    try {
      const response = await callAIApi(fullPrompt, options);
      return parseAnalysisResult(response);
    } catch (err) {
      console.warn(`⚠️ AI分析失败: ${err.message}`);
    }
  }

  // 降级：返回示例结果
  console.warn('⚠️ 无AI API，使用示例结果');
  return {
    hook: '（示例钩子）',
    conflict: '（示例冲突）',
    evidence: ['（示例证据1）', '（示例证据2）'],
    actions: ['（示例行动点）'],
    cta: '（示例CTA）',
    _isMock: true
  };
}

/**
 * 调用AI API（需要外部实现或使用已有模块）
 */
async function callAIApi(prompt, options) {
  const axios = require('axios');

  const response = await axios.post('https://api.siliconflow.cn/v1/chat/completions', {
    model: options.aiModel || 'Qwen/Qwen2.5-7B-Instruct',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  }, {
    headers: {
      'Authorization': `Bearer ${options.aiApiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content;
}

/**
 * 根据分析结果生成新的prompt版本
 * 用于Prompt迭代优化：从内容分析中提取新的写作方法论
 *
 * @param {string} baseName - 基础版本名称
 * @param {object|string} analysis - 分析结果或直接传入新的洞察字符串
 * @param {string} newInsight - 可选：新洞察/写作方法论（如果不传入则从analysis提取）
 * @returns {Promise<object>} 新版本信息
 */
async function updatePromptVersion(baseName, analysis, newInsight) {
  // 支持直接传入新的洞察字符串（第一参数为洞察内容）
  let actualInsight = newInsight;
  let actualAnalysis = analysis;

  if (typeof analysis === 'string') {
    // 如果第一个参数是字符串，则它是洞察，而不是baseName
    actualInsight = analysis;
    actualAnalysis = {};
  } else if (!newInsight && analysis) {
    // 从analysis对象提取洞察
    actualInsight = `从内容分析中提取的方法论：
- 钩子: ${analysis.hook}
- 冲突: ${analysis.conflict}
- 证据数量: ${analysis.evidence?.length || 0}
- 行动点: ${analysis.actions?.join(', ') || ''}
- CTA: ${analysis.cta || ''}`;
  }
  // 确保versions目录存在
  if (!fs.existsSync(VERSIONS_DIR)) {
    fs.mkdirSync(VERSIONS_DIR, { recursive: true });
  }

  // 找到当前最新版本号
  let maxVersion = 0;
  const existingFiles = fs.readdirSync(VERSIONS_DIR).filter(f => f.startsWith(baseName));
  existingFiles.forEach(file => {
    const match = file.match(/v(\d+)_/);
    if (match) {
      maxVersion = Math.max(maxVersion, parseInt(match[1]));
    }
  });

  const newVersion = maxVersion + 1;
  const timestamp = new Date().toISOString().slice(0, 10);

  // 读取原始prompt
  const basePrompt = loadPrompt('default.md');

  // 添加新洞察到prompt末尾
  const updatedPrompt = `${basePrompt}

---

## 迭代版本 ${newVersion} - ${timestamp}

### 新增洞察（从内容分析中提取）

${actualInsight}

### 分析结果摘要
- 钩子: ${actualAnalysis.hook || ''}
- 冲突: ${actualAnalysis.conflict || ''}
- 行动点: ${actualAnalysis.actions?.join(', ') || ''}
- CTA: ${actualAnalysis.cta || ''}
`;

  // 写入新版本
  const versionFileName = `${baseName}_v${newVersion}_${timestamp}.md`;
  const versionPath = path.join(VERSIONS_DIR, versionFileName);
  fs.writeFileSync(versionPath, updatedPrompt, 'utf-8');

  console.log(`✅ Prompt版本已更新: v${newVersion}`);

  return {
    name: baseName,
    version: newVersion,
    path: versionPath,
    timestamp,
    insight: newInsight
  };
}

/**
 * 保存生成的分析结果到文件
 * @param {Array} results - 分析结果数组
 * @returns {string} 保存路径
 */
function saveAnalysisResults(results) {
  const outputDir = path.join(process.cwd(), 'output', 'analysis');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const filepath = path.join(outputDir, `analysis-structured-${timestamp}.json`);

  fs.writeFileSync(filepath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`✅ 分析结果已保存: ${filepath}`);

  return filepath;
}

module.exports = {
  loadPrompt,
  getAvailablePrompts,
  parseAnalysisResult,
  analyzeContent,
  updatePromptVersion,
  saveAnalysisResults
};