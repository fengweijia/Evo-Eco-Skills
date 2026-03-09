/**
 * Agent 1: 账号配置器 (Account Profiler)
 * 负责接收和处理用户的账号配置信息
 */

class AccountProfiler {
  constructor(config) {
    this.config = config
  }
  
  /**
   * 运行账号配置
   */
  async run(params) {
    const { account } = params
    
    // 如果没有传入，使用默认配置
    const userAccount = account || this.config.account
    
    // 补充默认数据避免报错
    const safeAccount = {
      ...userAccount,
      targetAudience: {
        ...userAccount.targetAudience,
        interests: userAccount.targetAudience?.interests || ['通用'],
        painPoints: userAccount.targetAudience?.painPoints || ['无']
      }
    }
    
    // 验证必填字段
    const validation = this.validate(userAccount)
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message
      }
    }
    
    // 扩展和完善账号画像
    const profile = this.enrichProfile(userAccount)
    
    return {
      success: true,
      message: '账号配置完成',
      data: profile
    }
  }
  
  /**
   * 验证必填字段
   */
  validate(account) {
    if (!account?.position?.category) {
      return { valid: false, message: '请填写内容方向（垂类）' }
    }
    
    if (!account?.targetAudience?.gender) {
      return { valid: false, message: '请填写目标受众性别' }
    }
    
    if (!account?.objectives?.primary) {
      return { valid: false, message: '请填写主要运营目标' }
    }
    
    return { valid: true }
  }
  
  /**
   * 丰富账号画像
   */
  enrichProfile(account) {
    return {
      ...account,
      // 生成的账号画像
      profile: {
        // 核心关键词
        keywords: this.generateKeywords(account),
        // 内容定位描述
        positioning: this.generatePositioning(account),
        // 目标受众画像
        audienceProfile: this.generateAudienceProfile(account),
        // 差异化标签
        differentiationTags: this.generateDifferentiation(account),
        // 推荐内容类型
        recommendedContentTypes: this.recommendContentTypes(account)
      },
      // 时间戳
      createdAt: new Date().toISOString()
    }
  }
  
  /**
   * 生成关键词
   */
  generateKeywords(account) {
    const { position, targetAudience, tone } = account || {}
    const keywords = [
      position?.category || '通用',
      position?.subCategory,
      ...(targetAudience?.interests || ['通用']),
      ...(tone?.style || ['真诚'])
    ]
    // 去重并返回
    return [...new Set(keywords)].slice(0, 10)
  }
  
  /**
   * 生成定位描述
   */
  generatePositioning(account) {
    const { position, tone, targetAudience } = account || {}
    const category = position?.category || '通用'
    const occupation = targetAudience?.occupation || '职场人'
    const style = tone?.style?.join('、') || '真诚'
    const diff = tone?.differentiation || '实用价值'
    return `专注于${category}领域，聚焦${occupation}群体，以${style}的风格，传递${diff}`
  }
  
  /**
   * 生成受众画像
   */
  generateAudienceProfile(account) {
    const { targetAudience } = account || {}
    return {
      demographic: {
        gender: targetAudience?.gender || '通用',
        ageRange: targetAudience?.ageRange || '不限',
        occupation: targetAudience?.occupation || '通用'
      },
      psychographic: {
        interests: targetAudience?.interests || ['成长'],
        painPoints: targetAudience?.painPoints || ['待提升'],
        motivations: this.inferMotivations(targetAudience?.painPoints)
      }
    }
  }
  
  /**
   * 从痛点推断动机
   */
  inferMotivations(painPoints) {
    const motivationMap = {
      '晋升慢': '职业发展',
      '工资低': '收入提升',
      '焦虑': '自我提升',
      '迷茫': '职业方向',
      '迷茫': '人生规划'
    }
    
    if (!painPoints || !Array.isArray(painPoints)) {
      return ['自我提升']
    }
    
    return painPoints
      .map(p => motivationMap[p] || '自我提升')
      .filter((v, i, a) => a.indexOf(v) === i)
  }
  
  /**
   * 生成差异化标签
   */
  generateDifferentiation(account) {
    const { tone, position } = account || {}
    const tags = [
      ...(tone?.style || ['真诚']),
      position?.category || '通用',
      account?.objectives?.primary
    ].filter(Boolean)
    return [...new Set(tags)].slice(0, 5)
  }
  
  /**
   * 推荐内容类型
   */
  recommendContentTypes(account) {
    const { contentPlan, objectives } = account
    return contentPlan?.contentTypes || ['干货教程', '经验分享']
  }
}

module.exports = AccountProfiler