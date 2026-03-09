/**
 * Agent 3: 账号设计师 (Account Designer)
 * 根据对标账号分析，差异化设计账号的名称、介绍、背景图、logo、人设
 * 
 * 这是重构版新增的核心功能！
 */

class AccountDesigner {
  constructor(config) {
    this.config = config
  }
  
  /**
   * 运行账号设计
   */
  async run(params) {
    const { userProfile, benchmarkAccounts } = params
    
    if (!userProfile || !benchmarkAccounts?.length) {
      return {
        success: false,
        message: '请先完成账号配置和对标账号搜索'
      }
    }
    
    // 1. 分析对标账号的特征
    const analysis = this.analyzeBenchmarkPatterns(benchmarkAccounts)
    
    // 2. 生成差异化策略
    const differentiation = this.generateDifferentiationStrategy(userProfile, analysis)
    
    // 3. 设计账号名称
    const name = this.designAccountName(userProfile, differentiation)
    
    // 4. 设计账号介绍
    const bio = this.designBio(userProfile, differentiation)
    
    // 5. 设计背景图建议
    const banner = this.designBanner(userProfile, differentiation)
    
    // 6. 设计头像建议
    const avatar = this.designAvatar(userProfile, differentiation)
    
    // 7. 设计人设
    const persona = this.designPersona(userProfile, differentiation)
    
    // 8. 生成内容风格
    const contentStyle = this.designContentStyle(userProfile, analysis)
    
    const result = {
      name,
      bio,
      banner,
      avatar,
      persona,
      contentStyle,
      differentiation,
      analysis
    }
    
    return {
      success: true,
      message: '账号设计方案生成完成',
      data: result
    }
  }
  
  /**
   * 分析对标账号的模式
   */
  analyzeBenchmarkPatterns(accounts) {
    // 统计对标账号的名称风格
    const namePatterns = accounts.map(a => a.name)
    
    // 统计内容类型
    const contentTypes = accounts.flatMap(a => a.contentTypes || [])
    const topContentTypes = [...new Set(contentTypes)].slice(0, 5)
    
    // 统计风格标签
    const styleTags = accounts.flatMap(a => a.styleTags || [])
    const topStyleTags = this.countFrequency(styleTags).slice(0, 5)
    
    // 平均粉丝数
    const avgFollowers = accounts.reduce((sum, a) => sum + (a.followers || 0), 0) / accounts.length
    
    // 更新频率分布
    const postingFreqs = accounts.map(a => a.postingFreq || '未知')
    
    return {
      namePatterns,
      topContentTypes,
      topStyleTags,
      avgFollowers,
      postingFreqs,
      totalAccounts: accounts.length,
      verifiedRatio: accounts.filter(a => a.verified).length / accounts.length
    }
  }
  
  /**
   * 生成差异化策略
   */
  generateDifferentiationStrategy(userProfile, analysis) {
    const { tone, position } = userProfile
    const { avgFollowers, topContentTypes } = analysis
    
    // 用户差异化定位
    const userDiff = tone.differentiation || ''
    
    // 找出对标账号的空隙
    const gaps = {
      // 如果对标大多是高粉丝，就做细分垂直
      gap1: avgFollowers > 500000 ? '细分垂直领域' : '专业化路线',
      // 如果对标多是日更，就做质量路线
      gap2: '深度内容',
      // 如果对标多是某一风格，就做差异化风格
      gap3: tone.style[0] || '真诚分享'
    }
    
    return {
      strategy: `${gaps.gap1} + ${gaps.gap2}`,
      keyPoints: [
        `突出${userDiff || position.category}核心优势`,
        `以${gaps.gap2}对抗高频更新`,
        `用${gaps.gap3}建立辨识度`
      ],
      recommendations: {
        nameStyle: this.suggestNameStyle(tone),
        bioStyle: this.suggestBioStyle(tone),
        visualStyle: this.suggestVisualStyle(tone)
      }
    }
  }
  
  /**
   * 设计账号名称
   */
  designAccountName(userProfile, differentiation) {
    const { position, tone, targetAudience } = userProfile
    const { recommendations } = differentiation
    
    // 名称候选池
    const prefixOptions = {
      '职场': ['职场', '职人', '职途', '职场派'],
      '美妆': ['美妆', '变美', '颜值', '妆'],
      '数码': ['数码', '科技', '评测', '搞机'],
      '美食': ['美食', '吃货', '厨房', '食谱']
    }
    const suffixOptions = ['研究所', '日记', '成长', '进化', '手册', '指南', '笔记']
    
    const prefix = prefixOptions[position.category]?.[0] || position.category
    const suffix = suffixOptions[Math.floor(Math.random() * suffixOptions.length)]
    
    // 生成3个候选名
    const candidates = [
      `${prefix}${suffix}`,
      `${tone.style[0] || '我的'}${position.category}日记`,
      `${targetAudience.occupation}${position.category}指南`
    ]
    
    return {
      recommended: candidates[0],
      candidates: candidates,
      reason: `基于您的${position.category}定位和${tone.style[0]}风格推荐`
    }
  }
  
  /**
   * 设计账号介绍
   */
  designBio(userProfile, differentiation) {
    const { tone, objectives, targetAudience } = userProfile
    
    // 生成介绍文案
    const lines = [
      // 第1行：身份定位
      `${targetAudience.occupation} · ${objectives.primary}`,
      // 第2行：核心价值
      tone.differentiation || `分享${targetAudience.interests[0]}实用干货`,
      // 第3行：行动号召
      '👉 点击关注，一起成长'
    ]
    
    return {
      text: lines.join('\n'),
      short: `${objectives.primary} | ${tone.differentiation?.slice(0, 20) || targetAudience.interests[0]}`,
      reason: '简洁有力的三行介绍，突出身份价值和行动号召'
    }
  }
  
  /**
   * 设计背景图建议
   */
  designBanner(userProfile, differentiation) {
    const { tone, position } = userProfile
    
    return {
      // 视觉描述
      description: `背景图设计建议：` +
        `\n- 风格：${tone.visual?.[0] || '简约'} + ${position.category}元素` +
        `\n- 配色：品牌色(#00E5A0) + 白色/浅灰背景` +
        `\n- 文字：账号名称 + 一句话简介` +
        `\n- 元素：${position.category}相关图标或场景`,
      // 视觉关键词
      keywords: [tone.visual?.[0] || '简约', position.category, '专业感'],
      // 提示词（用于AI绘图）
      prompt: `Xiaohongshu banner design, ${position.category} theme, ${tone.visual?.[0] || 'minimalist'} style, clean white background with green accent colors, professional, text: [your account name]`
    }
  }
  
  /**
   * 设计头像建议
   */
  designAvatar(userProfile, differentiation) {
    const { tone, position, targetAudience } = userProfile
    
    return {
      // 头像类型建议
      type: targetAudience.gender === '女性' ? '真人照片/插画' : '文字/logo',
      // 风格建议
      style: tone.style[0] === '专业' ? '简洁logo' : '真人形象',
      // 配色
      color: '#00E5A0 (品牌色)',
      // 文字头像选项
      textOptions: [
        position.category.slice(0, 1),
        '职',
        userProfile.account?.position?.name?.slice(0, 1) || 'O'
      ],
      // AI绘图提示词
      prompt: `Profile avatar for ${position.category} social media, ${tone.style?.[0] || 'professional'} style, green accent color, minimal design`
    }
  }
  
  /**
   * 设计人设
   */
  designPersona(userProfile, differentiation) {
    const { tone, targetAudience, objectives } = userProfile
    
    return {
      // 角色定位
      role: `${targetAudience.occupation}成长路上的伙伴`,
      // 性格特点
      personality: {
        core: tone.style.slice(0, 2),
        traits: ['真诚', '专业', '有温度']
      },
      // 语言风格
      language: {
        style: tone.language || ['口语化', '真诚'],
        examples: [
          '姐妹们！这个真的超有用！',
          '作为一个过来人，我想说...',
          '今天来聊聊大家关心的...'
        ]
      },
      // 专业背书
      background: tone.differentiation || `${targetAudience.occupation}从业${Math.floor(Math.random() * 5) + 3}年`,
      // 价值观
      values: objectives.primary === '变现' 
        ? '真诚分享，共同成长，拒绝割韭菜'
        : '用爱发电，持续输出',
      // 角色设定文档
      personaDoc: `
## 人设卡

**身份**: ${targetAudience.occupation}
**标签**: ${tone.style.join('/')}
**性格**: ${['真诚', '专业', '有温度'].join('、')}
**语言风格**: ${tone.language?.join('、') || '口语化'}
**差异化**: ${tone.differentiation || '无'}
      `.trim()
    }
  }
  
  /**
   * 设计内容风格
   */
  designContentStyle(userProfile, analysis) {
    const { tone, contentPlan } = userProfile
    
    return {
      // 内容调性
      tone: tone.style,
      // 语言风格
      language: tone.language,
      // 推荐格式
      recommendedFormats: contentPlan?.formats || ['图文笔记', '短视频'],
      // 更新频率建议
      postingFrequency: contentPlan?.postingFrequency || '每周3-5篇',
      // 系列内容
      series: contentPlan?.series || [],
      // 与对标的差异化
      differentiation: {
        vsBenchmark: `对标账号多以${analysis.topContentTypes[0]}为主，建议您注重${tone.style[0]} + 深度内容`,
        uniqueAngle: tone.differentiation || '真实经历分享'
      }
    }
  }
  
  /**
   * 辅助：统计频率
   */
  countFrequency(array) {
    const freq = {}
    array.forEach(item => { freq[item] = (freq[item] || 0) + 1 })
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, count: v }))
  }
  
  /**
   * 建议名称风格
   */
  suggestNameStyle(tone) {
    if (tone.style.includes('专业')) return '简洁功能性（如：XX研究所）'
    if (tone.style.includes('真诚')) return '人格化（如：XX的成长日记）'
    return '通用（如：XX指南）'
  }
  
  /**
   * 建议介绍风格
   */
  suggestBioStyle(tone) {
    if (tone.language?.includes('口语化')) return '轻松对话式，三行以内'
    return '简洁专业式，突出价值'
  }
  
  /**
   * 建议视觉风格
   */
  suggestVisualStyle(tone) {
    return tone.visual?.join(' + ') || '简约 + 品牌色'
  }
}

module.exports = AccountDesigner