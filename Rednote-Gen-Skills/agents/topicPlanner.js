/**
 * Agent 5: 主题规划器 (Topic Planner)
 * 结合账号定位、热点规划3-5个制作主题
 */

class TopicPlanner {
  constructor(config) {
    this.config = config
  }
  
  /**
   * 运行主题规划
   */
  async run(params) {
    const { userProfile, contentAnalysis, hotTopics = [] } = params
    
    if (!userProfile) {
      return {
        success: false,
        message: '请先完成账号配置'
      }
    }
    
    // 1. 获取内容类型偏好
    const contentTypes = userProfile.contentPlan?.contentTypes || ['干货教程']
    
    // 2. 结合热点生成主题
    const topics = this.generateTopics(userProfile, contentAnalysis, hotTopics)
    
    // 3. 对每个主题进行评估
    const evaluatedTopics = topics.map(topic => ({
      ...topic,
      evaluation: this.evaluateTopic(topic, userProfile, contentAnalysis)
    }))
    
    // 4. 排序（综合得分）
    evaluatedTopics.sort((a, b) => b.evaluation.totalScore - a.evaluation.totalScore)
    
    return {
      success: true,
      message: `生成了${topics.length}个推荐主题`,
      data: {
        topics: evaluatedTopics,
        selection: {
          recommended: evaluatedTopics[0],
          alternatives: evaluatedTopics.slice(1, 3)
        }
      },
      metadata: {
        total: evaluatedTopics.length,
        userCategory: userProfile.position?.category,
        category: '职场'
      }
    }
  }
  
  /**
   * 生成主题
   */
  generateTopics(userProfile, contentAnalysis, hotTopics) {
    const category = userProfile.position?.category || '职场'
    const topics = []
    
    // 基于内容类型生成主题
    const templates = {
      '干货教程': [
        { title: `${category}人必须知道的5个生存法则`, type: '系列', format: '图文' },
        { title: `${category}避坑指南，这些千万别做`, type: '警告', format: '图文' },
        { title: `从0到1入门${category}，新手必看`, type: '入门', format: '视频' },
        { title: `${category}进阶技巧，99%的人不知道`, type: '进阶', format: '图文' },
        { title: `${category}常见问题解答大全`, type: '百科', format: '图文' }
      ],
      '经验分享': [
        { title: `我是如何从职场新人变成核心员工的`, type: '故事', format: '视频' },
        { title: `3个月${category}成长记录`, type: 'Vlog', format: '视频' },
        { title: `关于${category}，我想说的真心话`, type: '观点', format: '图文' },
        { title: `转行${category}1年，我收获了什么`, type: '复盘', format: '图文' }
      ],
      '成长故事': [
        { title: `普通人的${category}逆袭之路`, type: '逆袭', format: '视频' },
        { title: `${category}的至暗时刻和光明未来`, type: '情感', format: '图文' },
        { title: `2024年${category}flag完成情况`, type: '复盘', format: '图文' }
      ]
    }
    
    // 收集所有模板
    const contentTypes = userProfile?.contentPlan?.contentTypes || ['干货教程']
    const allTemplates = contentTypes.flatMap(t => templates[t] || templates['干货教程'])
    
    // 选择前5个
    const selected = allTemplates.slice(0, 5).map((t, index) => ({
      id: `topic_${index + 1}`,
      ...t,
      // 添加更多属性
      category,
      targetAudience: userProfile.targetAudience?.occupation,
      expectedEngagement: ['系列', '故事'].includes(t.type) ? 'high' : 'medium',
      difficulty: t.type === '入门' ? 'easy' : t.type === '进阶' ? 'hard' : 'medium',
      suggestedPostingTime: this.suggestPostingTime(t.type)
    }))
    
    // 添加热点话题（如果有）
    if (hotTopics.length > 0) {
      selected.push(...hotTopics.slice(0, 2).map((topic, index) => ({
        id: `topic_hot_${index + 1}`,
        title: topic,
        type: '热点',
        format: Math.random() > 0.5 ? '图文' : '视频',
        category,
        isHot: true,
        expectedEngagement: 'high',
        difficulty: 'easy'
      })))
    }
    
    return selected
  }
  
  /**
   * 评估主题
   */
  evaluateTopic(topic, userProfile, contentAnalysis) {
    let score = 50 // 基础分
    
    // 内容类型匹配度
    const userContentTypes = userProfile.contentPlan?.contentTypes || []
    if (userContentTypes.some(t => topic.title?.includes(t))) {
      score += 15
    }
    
    // 差异化加分（如果有）
    if (topic.type === '系列') {
      score += 10 // 系列内容有助于粉丝留存
    }
    
    // 格式偏好匹配
    const userFormats = userProfile.contentPlan?.formats || ['图文']
    if (userFormats.includes(topic.format)) {
      score += 10
    }
    
    // 热点加成
    if (topic.isHot) {
      score += 20
    }
    
    // 难度评估
    const difficulty = {
      easy: 0,
      medium: -5,
      hard: -10
    }
    
    return {
      totalScore: Math.min(100, score),
      breakdown: {
        relevance: score > 60 ? '高相关' : '一般相关',
        series: topic.type === '系列' ? '适合做系列' : '单篇内容',
        format: topic.format,
        difficulty: topic.difficulty || 'medium'
      },
      recommendation: score > 70 ? '强烈推荐' : score > 50 ? '推荐' : '可选'
    }
  }
  
  /**
   * 建议发布时间
   */
  suggestPostingTime(type) {
    const schedule = {
      '入门': '周六/周日 10:00（新人友好时间）',
      '进阶': '周三/周四 20:00（求知欲强时间）',
      '系列': '周五 18:00（周末前预热）',
      '故事': '周六/周日 20:00（休闲时间）',
      '热点': '发现热点后24小时内',
      '警告': '周一 09:00（警醒时间）',
      '默认': '周三/周四 20:00'
    }
    return schedule[type] || schedule['默认']
  }
}

module.exports = TopicPlanner