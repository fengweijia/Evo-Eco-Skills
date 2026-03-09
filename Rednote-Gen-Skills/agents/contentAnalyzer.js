/**
 * Agent 4: 内容拆解器 (Content Analyzer)
 * 对对标账号的内容进行拆解分析，学习爆款模式
 */

class ContentAnalyzer {
  constructor(config) {
    this.config = config
  }
  
  /**
   * 运行内容拆解分析
   */
  async run(params) {
    const { benchmarkAccounts } = params
    
    if (!benchmarkAccounts?.length) {
      return {
        success: false,
        message: '请先搜索对标账号'
      }
    }
    
    // 1. 分析内容类型分布
    const contentTypeAnalysis = this.analyzeContentTypes(benchmarkAccounts)
    
    // 2. 分析发布频率
    const postingAnalysis = this.analyzePostingFrequency(benchmarkAccounts)
    
    // 3. 分析互动特征
    const engagementAnalysis = this.analyzeEngagement(benchmarkAccounts)
    
    // 4. 提取爆款公式
    const viralFormulas = this.extractViralFormulas(benchmarkAccounts)
    
    // 5. 分析标题结构
    const titlePatterns = this.analyzeTitlePatterns()
    
    // 6. 生成可复用模板
    const templates = this.generateTemplates(contentTypeAnalysis, viralFormulas)
    
    const result = {
      contentTypeAnalysis,
      postingAnalysis,
      engagementAnalysis,
      viralFormulas,
      titlePatterns,
      templates,
      recommendations: this.generateRecommendations(contentTypeAnalysis, postingAnalysis, engagementAnalysis)
    }
    
    return {
      success: true,
      message: '内容拆解分析完成',
      data: result
    }
  }
  
  /**
   * 分析内容类型分布
   */
  analyzeContentTypes(accounts) {
    const allTypes = accounts.flatMap(a => a.contentTypes || [])
    const typeCount = {}
    
    allTypes.forEach(type => {
      typeCount[type] = (typeCount[type] || 0) + 1
    })
    
    const sorted = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count, ratio: count / accounts.length }))
    
    return {
      distribution: sorted,
      top3: sorted.slice(0, 3).map(t => t.type),
      insight: `对标账号主要聚焦于${sorted[0]?.type}，占${Math.round(sorted[0]?.ratio * 100)}%`
    }
  }
  
  /**
   * 分析发布频率
   */
  analyzePostingFrequency(accounts) {
    const freqMap = {
      '日更': { postsPerWeek: 7, label: '高频' },
      '隔日更': { postsPerWeek: 3.5, label: '中等' },
      '每周2-3篇': { postsPerWeek: 2.5, label: '稳定' },
      '周2更': { postsPerWeek: 2, label: '稳定' },
      '周3更': { postsPerWeek: 3, label: '中等' }
    }
    
    const frequencies = accounts.map(a => ({
      name: a.name,
      freq: a.postingFreq || '未知',
      ...(freqMap[a.postingFreq] || { postsPerWeek: 0, label: '未知' })
    }))
    
    const avgPosts = frequencies.reduce((sum, f) => sum + f.postsPerWeek, 0) / frequencies.length
    
    return {
      frequencies,
      averagePostsPerWeek: Math.round(avgPosts * 10) / 10,
      recommendation: avgPosts >= 5 ? '建议日更或隔日更' : '建议每周3-5篇',
      insight: `对标账号平均每周发布${Math.round(avgPosts)}篇`
    }
  }
  
  /**
   * 分析互动特征
   */
  analyzeEngagement(accounts) {
    const engagements = accounts.map(a => ({
      name: a.name,
      engagement: a.engagement || 0,
      followers: a.followers,
      estimatedLikes: Math.round((a.followers || 0) * (a.engagement || 0.05))
    }))
    
    const avgEngagement = engagements.reduce((sum, e) => sum + e.engagement, 0) / engagements.length
    
    // 分析互动结构
    const interactionStructure = {
      likeToComment: '20:1', // 约20个赞1个评论
      likeToCollect: '3:1', // 约3个赞1个收藏
      viewToLike: '0.05', // 约5%的观看用户点赞
    }
    
    return {
      engagements,
      averageEngagementRate: Math.round(avgEngagement * 1000) / 10,
      excellentThreshold: 0.08,
      goodThreshold: 0.05,
      insight: `平均互动率${Math.round(avgEngagement * 1000) / 10}%，${avgEngagement > 0.05 ? '属于较高水平' : '有提升空间'}`,
      engagementType: avgEngagement > 0.08 ? '高互动型' : '内容质量型'
    }
  }
  
  /**
   * 提取爆款公式
   */
  extractViralFormulas(accounts) {
    // 基于对标账号特征推断爆款公式
    return [
      {
        formula: '痛点+解决方案+真实案例',
        description: '开头戳中痛点，中间给出解决方案，最后用亲身案例佐证',
        example: '工资低的hr都收藏了！3个加薪谈判技巧...',
        applicableTo: ['干货', '职场', '成长']
      },
      {
        formula: '对比+悬念+结果',
        description: '通过对比制造悬念，最后展示惊人结果',
        example: '普通人vs职场高手的差距，只差这一点...',
        applicableTo: ['对比', '干货']
      },
      {
        formula: '故事+干货+互动',
        description: '用故事开头，干货中间，互动引导结尾',
        example: '我是如何从专员升到总监的...（附干货+评论区见）',
        applicableTo: ['成长', '故事']
      }
    ]
  }
  
  /**
   * 分析标题结构
   */
  analyzeTitlePatterns() {
    return {
      patterns: [
        { type: '数字+悬念', example: '3个方法让你...', popularity: 0.9 },
        { type: '痛点+方案', example: '工资低？因为你不懂...', popularity: 0.85 },
        { type: '身份+场景', example: '职场人必看的5个建议', popularity: 0.8 },
        { type: '反差+好奇', example: '原来XX才是正确的...', popularity: 0.75 },
        { type: '情绪+感叹', example: '太后悔没早知道...', popularity: 0.7 }
      ],
      bestPractice: '使用"数字+痛点/效果"的组合结构'
    }
  }
  
  /**
   * 生成可复用模板
   */
  generateTemplates(contentTypeAnalysis, viralFormulas) {
    const topType = contentTypeAnalysis.top3?.[0] || '干货'
    
    return {
      // 开头模板
      opening: {
        痛点型: [
          '你是不是也经常...',
          '90%的职场人都...',
          '别再傻傻地...了'
        ],
        成果型: [
          '我终于做到了！',
          '3个月涨粉1万，我是这样做的',
          '这个方法让我工资翻倍'
        ],
        悬念型: [
          '今天聊聊大多数人不敢说的...',
          '一个被低估的职场规则...',
          '为什么你努力了还是...'
        ]
      },
      // 中间模板
      middle: {
        干货: [
          '第一点：...（核心要点）\n\n具体做法是...',
          '关键在于...下面3个步骤一定要记住：\n1. ...\n2. ...\n3. ...',
          '其实很简单，只需要记住这个公式：...'
        ],
        故事: [
          '事情是这样的...（背景）\n\n后来我决定...（转折）\n\n结果是...（结果）',
          '记得刚入职的时候，我...（回忆）\n\n直到有一天...（觉醒）\n\n现在...（改变）'
        ]
      },
      // 结尾模板
      closing: {
        互动型: [
          '你们有遇到过类似的情况吗？评论区聊聊～',
          '觉得有用的点个赞收藏一下',
          '你们还想听什么？告诉我下次安排'
        ],
        价值型: [
          '总结一下：1. ... 2. ... 3. ...\n\n觉得有用就收藏吧！',
          '划重点：...（核心回顾）\n\n记住这几点，...'
        ]
      }
    }
  }
  
  /**
   * 生成推荐建议
   */
  generateRecommendations(contentType, posting, engagement) {
    return {
      contentFocus: `建议主要做${contentType.top3?.[0]}类型内容，配合${contentType.top3?.[1]}增加多样性`,
      postingSchedule: posting.recommendation,
      engagementTips: [
        '开头3句话必须抓住注意力',
        '增加互动引导（提问、投票）',
        '善用收藏价值（实用干货）',
        '评论回复要积极互动'
      ],
      optimization: {
        title: '多使用数字+痛点/效果的标题结构',
        cover: '简洁突出，文字要清晰可见',
        tags: '带2-3个相关话题标签'
      }
    }
  }
}

module.exports = ContentAnalyzer