const CONFIG_PATH = require('path').join(__dirname, '..', 'config.json');
const fs = require('fs');
const axios = require('axios');
const { loadEnvFile } = require('./env.js');

loadEnvFile();

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function getConfig(runtimeConfig) {
  if (runtimeConfig) {
    return runtimeConfig;
  }
  return loadConfig();
}

function buildFallbackOpinions(hotspot) {
  return [
    {
      id: 1,
      title: '机会型',
      content: `${hotspot.keyword}正在进入高关注窗口期，适合做快速内容抢位`,
      angle: '抓热点流量'
    },
    {
      id: 2,
      title: '方法型',
      content: `围绕${hotspot.keyword}做“问题-解法-案例”结构，更容易沉淀信任`,
      angle: '实操教学'
    },
    {
      id: 3,
      title: '避坑型',
      content: `${hotspot.keyword}内容要避免空洞观点，优先给可执行步骤与成本边界`,
      angle: '降低试错'
    }
  ];
}

function extractJson(text) {
  const raw = String(text || '').trim();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    const match = raw.match(/```json([\s\S]*?)```/i) || raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[1].trim());
    } catch (innerError) {
      return null;
    }
  }
}

async function callSiliconflowChat({ apiKey, model, prompt }) {
  const response = await axios.post(
    'https://api.siliconflow.cn/v1/chat/completions',
    {
      model: model || 'Pro/moonshotai/Kimi-K2.5',
      temperature: 0.7,
      messages: [
        { role: 'system', content: '你是中文内容策划助手，请严格输出JSON。' },
        { role: 'user', content: prompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    }
  );
  return response.data?.choices?.[0]?.message?.content || '';
}

function resolveAiConfig(config) {
  const provider = config.ai?.provider || process.env.AI_PROVIDER || 'mock';
  const apiKey =
    config.ai?.api_key ||
    process.env.SILICONFLOW_API_KEY ||
    process.env.AI_API_KEY ||
    '';
  const model = config.ai?.model || process.env.AI_MODEL || 'Pro/moonshotai/Kimi-K2.5';
  return { provider, apiKey, model };
}

async function generateOpinions(hotspot, runtimeConfig) {
  const config = getConfig(runtimeConfig);
  const ai = resolveAiConfig(config);

  if (ai.provider === 'mock') {
    return buildFallbackOpinions(hotspot);
  }

  if (ai.provider === 'siliconflow' && ai.apiKey) {
    try {
      const content = await callSiliconflowChat({
        apiKey: ai.apiKey,
        model: ai.model,
        prompt: `请围绕热点“${hotspot.title}”生成3个观点方向，返回JSON数组，字段:id,title,content,angle。`
      });
      const parsed = extractJson(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, index) => ({
          id: Number(item.id || index + 1),
          title: String(item.title || `观点${index + 1}`),
          content: String(item.content || ''),
          angle: String(item.angle || '分析')
        }));
      }
    } catch (error) {
      return buildFallbackOpinions(hotspot);
    }
  }

  return buildFallbackOpinions(hotspot);
}

function buildWechatDraft(hotspot, opinion) {
  return {
    title: `${opinion.title}拆解：${hotspot.title}`,
    body: [
      `最近关于“${hotspot.keyword}”的讨论明显升温，今天用一个实战视角做拆解。`,
      '',
      `观点方向：${opinion.content}`,
      '',
      '一、为什么现在值得关注',
      '1) 用户关注度持续上升',
      '2) 内容供给还不饱和',
      '3) 有明确可落地的场景',
      '',
      '二、普通人怎么开始',
      '1) 先确定一个细分问题',
      '2) 连续输出3篇结构化内容',
      '3) 用数据复盘再迭代',
      '',
      '三、注意事项',
      '不要只讲概念，必须给可执行动作和结果预期。',
      '',
      '你更看好哪条路径？欢迎留言交流。'
    ].join('\n'),
    tags: [hotspot.keyword, '行业观察', '内容运营', '热点拆解']
  };
}

function buildXhsDraft(hotspot, opinion) {
  return {
    title: `${hotspot.keyword}怎么做？这3步最关键`,
    body: [
      `最近在看${hotspot.keyword}相关内容，真的很容易踩坑。`,
      '',
      `我更认同这个方向：${opinion.content}`,
      '',
      '给你一套可直接照搬的小流程：',
      '① 选一个最具体的切口',
      '② 用“痛点-方法-结果”写内容',
      '③ 发布后看收藏评论再优化下一篇',
      '',
      '先跑起来，再追求完美。'
    ].join('\n'),
    tags: [hotspot.keyword, '小红书运营', '内容创作', '干货分享', '避坑指南']
  };
}

async function generateArticle(hotspot, opinion, platform = 'wechat', runtimeConfig) {
  const config = getConfig(runtimeConfig);
  const ai = resolveAiConfig(config);
  const safeOpinion = opinion || buildFallbackOpinions(hotspot)[0];

  if (ai.provider === 'mock') {
    if (platform === 'xiaohongshu') {
      return buildXhsDraft(hotspot, safeOpinion);
    }
    return buildWechatDraft(hotspot, safeOpinion);
  }

  if (ai.provider === 'siliconflow' && ai.apiKey) {
    try {
      const content = await callSiliconflowChat({
        apiKey: ai.apiKey,
        model: ai.model,
        prompt: `请为${platform}生成发布文案，热点:${hotspot.title}，观点:${safeOpinion.content}。返回JSON对象，字段:title,body,tags(数组)。`
      });
      const parsed = extractJson(content);
      if (parsed && typeof parsed === 'object') {
        return {
          title: String(parsed.title || `${hotspot.keyword}内容草稿`),
          body: String(parsed.body || safeOpinion.content),
          tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags.map(tag => String(tag)) : [hotspot.keyword]
        };
      }
    } catch (error) {
      return {
        title: `${hotspot.keyword}内容草稿`,
        body: `${safeOpinion.content}\n\nAI调用失败，已自动降级。`,
        tags: [hotspot.keyword]
      };
    }
  }

  return {
    title: `${hotspot.keyword}内容草稿`,
    body: `${safeOpinion.content}\n\n请补充真实AI生成逻辑。`,
    tags: [hotspot.keyword]
  };
}

module.exports = {
  generateOpinions,
  generateArticle,
  loadConfig
};
