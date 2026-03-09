/**
 * Agent 6: 笔记生成器 (Note Generator)
 * 生成完整的笔记内容：标题、正文、封面、标签
 * 支持图文笔记和视频笔记两种形式
 * 使用豆包模型生成封面和视频
 */

class NoteGenerator {
  constructor(config) {
    this.config = config
    this.doubaoApiKey = config.ai?.mediaApiKey
    this.imageModel = config.ai?.imageModel || 'doubao-seedream-5.0'
    this.videoModel = config.ai?.videoModel || 'doubao-seedance-2.0'
  }
  
  /**
   * 运行笔记生成
   */
  async run(params) {
    const { topic, userProfile, contentStyle, coverImage, format = '图文' } = params
    
    if (!topic) {
      return {
        success: false,
        message: '请提供制作主题'
      }
    }
    
    // 1. 生成标题（3个备选）
    const titles = this.generateTitles(topic, contentStyle)
    
    // 2. 生成正文内容
    const content = this.generateContent(topic, contentStyle, format)
    
    // 3. 生成封面建议
    const cover = this.generateCover(topic, coverImage)
    
    // 4. 生成标签
    const tags = this.generateTags(topic, userProfile)
    
    // 5. 生成发布时间建议
    const publishingTime = this.suggestPublishingTime(topic)
    
    // 6. 如果是视频，生成脚本
    const videoScript = format === '视频' ? this.generateVideoScript(topic, contentStyle) : null
    
    const result = {
      format,
      topic,
      titles,
      content,
      cover,
      tags,
      publishingTime,
      videoScript,
      metadata: {
        wordCount: content.text.split(/\n/).length,
        estimatedReadTime: Math.ceil(content.text.split(/\n/).length / 100),
        hasEmoji: true,
        hasHashtags: true
      }
    }
    
    return {
      success: true,
      message: `${format}笔记生成完成`,
      data: result
    }
  }
  
  /**
   * 生成标题（3个备选）
   */
  generateTitles(topic, contentStyle) {
    const titleStyles = [
      // 数字+痛点/效果
      {
        template: topic => `3个${topic}的方法，90%的人都不知道`,
        score: 9
      },
      // 悬念型
      {
        template: topic => `关于${topic}，我后悔没早知道这几点`,
        score: 8
      },
      // 反差型
      {
        template: topic => `${topic}的正确方式，大部分人都做错了`,
        score: 8
      },
      // 身份+场景
      {
        template: topic => `职场人必看的${topic}指南，建议收藏`,
        score: 7
      },
      // 成果型
      {
        template: topic => `我花了3个月总结的${topic}，一次性分享给你`,
        score: 7
      }
    ]
    
    // 打乱顺序
    const shuffled = titleStyles.sort(() => Math.random() - 0.5)
    
    // 选择前3个
    return shuffled.slice(0, 3).map((style, index) => ({
      text: `【备选${index + 1}】${style.template(topic.title || topic)}`,
      type: ['数字+效果', '悬念', '反差', '身份型', '成果型'][index % 5],
      score: style.score
    }))
  }
  
  /**
   * 生成正文内容
   */
  generateContent(topic, contentStyle, format) {
    const { language } = contentStyle || {}
    const isCasual = language?.includes('口语化')
    
    // 开头
    const opening = isCasual 
      ? `姐妹们！今天必须跟你们聊聊${topic.title || topic}...\n\n相信很多人都有这样的困惑：${topic.painPoint || ''}`
      : `${topic.title || topic}是职场/生活中的重要议题，本文将分享核心方法论。\n\n很多人面临的问题是：${topic.painPoint || ''}`
    
    // 中间（3个要点）
    const points = topic.points || [
      {
        title: '核心要点1',
        content: '这是第一个关键点，具体应该这样做...',
        example: '比如...'
      },
      {
        title: '核心要点2', 
        content: '第二个容易被忽略的点是...',
        example: '举一个例子：'
      },
      {
        title: '核心要点3',
        content: '最后一点，也是最重要的是...',
        example: '记住这个技巧：'
      }
    ]
    
    const middle = points.map(p => 
      `【${p.title}】\n${p.content}\n${p.example ? p.example : ''}`
    ).join('\n\n')
    
    // 结尾
    const closing = isCasual
      ? `以上就是我的分享，觉得有用就收藏吧！\n\n你们关于这个话题有什么想法？评论区聊聊～\n\n#${topic.title || '干货分享'} #成长`
      : `总结：本文从3个维度分析了${topic.title || topic}，希望对您有所帮助。\n\n如果觉得有价值，请点赞收藏支持！\n\n#${topic.title || '干货'} #${contentStyle?.category || '分享'}`
    
    const text = `${opening}\n\n${middle}\n\n${closing}`
    
    return {
      text,
      structure: {
        opening: opening.split('\n')[0],
        points: points.map(p => p.title),
        closing: closing.split('\n')[0]
      },
      style: isCasual ? '口语化' : '专业正式'
    }
  }
  
  /**
   * 生成封面建议
   */
  generateCover(topic, existingImage) {
    // 如果已有AI生成的封面
    if (existingImage) {
      return {
        type: 'ai-generated',
        image: existingImage,
        prompt: existingImage.prompt || `Cover image for: ${topic.title || topic}`
      }
    }
    
    // 返回封面设计建议
    return {
      type: 'design-suggestion',
      // 视觉描述
      description: {
        layout: '单图/拼图均可，建议文字在画面占比30%以内',
        background: '浅色背景 + 品牌色(#00E5A0) 点缀',
        text: '大标题 + 关键词',
        elements:-topic.keyElements || ['数据', '人物', '场景']
      },
      // 用于AI绘图的提示词
      prompt: {
        // 图文笔记封面
        image: `Social media cover for Xiaohongshu, ${topic.title || '分享'} topic, minimalist design, light background with green accent, clean and professional, text overlay: ${topic.title || '分享'}, high quality, 4K`,
        // 视频笔记封面  
        video: `YouTube/TikTok thumbnail style, ${topic.title || '分享'} topic, eye-catching design, high contrast, expressive, people or concept imagery, professional lighting`
      },
      // 文字排版建议
      textOverlay: {
        position: '居中或右下角',
        font: '无衬线字体，加粗',
        size: '占画面15-20%',
        color: '#000000 或 #FFFFFF 根据背景调整'
      },
      // 标签建议
      tags: '文字标签需简洁，最好1-4字'
    }
  }
  
  /**
   * 生成标签
   */
  generateTags(topic, userProfile) {
    const category = userProfile?.position?.category || '职场'
    
    // 基础标签
    const baseTags = [
      `#${category}`,
      '#职场干货',
      '#成长'
    ]
    
    // 根据主题扩展
    const topicTags = topic.title 
      ? topic.title.split(/[,，、]/).slice(0, 2).map(t => `#${t.trim()}`)
      : []
    
    // 热点标签（可扩展）
    const trendingTags = [
      '#2024',
      '#自我提升',
      '#干货分享'
    ]
    
    // 推荐发布时间标签
    const timeTags = ['#周三能量站', '#周五复盘', '#周一开工']
    
    // 组合并限制数量（小红书建议3-8个）
    const allTags = [
      ...baseTags,
      ...topicTags,
      ...trendingTags.slice(0, 2)
    ].slice(0, 8)
    
    return {
      tags: allTags,
      count: allTags.length,
      recommended: allTags.slice(0, 5),
      placement: '正文末尾，每条笔记带3-8个标签'
    }
  }
  
  /**
   * 建议发布时间
   */
  suggestPublishingTime(topic) {
    // 通用建议
    const generalOptions = [
      { day: '周三', time: '20:00-21:00', reason: '工作日黄金时段' },
      { day: '周四', time: '12:00-13:00', reason: '午休刷手机高峰期' },
      { day: '周五', time: '18:00-20:00', reason: '周末前最后一波流量' },
      { day: '周六', time: '10:00-12:00', reason: '周末流量高峰' },
      { day: '周日', time: '20:00-21:00', reason: '为下周做准备的心态' }
    ]
    
    // 根据内容类型调整
    const isWeekend = topic?.isWeekend || false
    const isHighPriority = topic?.priority === 'high'
    
    return {
      recommended: isWeekend 
        ? generalOptions[3]
        : isHighPriority 
          ? generalOptions[0]
          : generalOptions[Math.floor(Math.random() * 3)],
      alternatives: generalOptions,
      tips: [
        '建议固定发布时间，培养粉丝期待',
        '新笔记可以适当提早1-2小时发布测试',
        '重要内容可以多时间段测试'
      ]
    }
  }
  
  /**
   * 生成视频脚本（如果是视频笔记）
   */
  generateVideoScript(topic, contentStyle) {
    const totalDuration = 60 // 假设60秒视频
    
    return {
      // 整体结构
      structure: {
        opening: {
          duration: '5-8秒',
          content: `黄金3秒法则：\n- 提问/痛点/悬念开场\n- 视觉：突出情绪或标题`,
          examples: [
            '你是不是也经常觉得...',
            '今天%讲一个很多人不敢说的...',
            '3个月从0到1万粉，我是这样做的'
          ]
        },
        main: {
          duration: '40-50秒',
          content: `核心内容：\n- 保持每10秒一个信息点\n- 适当放慢语速强调重点\n- 可以配合字幕和贴纸`,
          tips: [
            '每15秒设置一个视觉/听觉hook',
            '重要数据/观点放大显示',
            '适当停顿让观众消化'
          ]
        },
        ending: {
          duration: '5-10秒',
          content: `结尾引导：\n- 总结核心观点\n- 互动引导（点赞/收藏/关注）\n- 下期预告（可选）`,
          examples: [
            '觉得有用就点赞收藏吧！',
            '你们还想看什么？评论区告诉我',
            '下期讲...记得关注'
          ]
        }
      },
      // 详细时间线
      timeline: [
        { time: '0:00-0:03', action: '开场hook', content: topic.hook || '抛出问题或悬念' },
        { time: '0:03-0:15', action: '背景介绍', content: topic.background || '简短交代' },
        { time: '0:15-0:45', action: '核心内容', content: topic.points?.[0] || '第一个要点' },
        { time: '0:45-0:55', action: '要点总结', content: '快速回顾' },
        { time: '0:55-1:00', action: '结尾引导', content: '互动CTA' }
      ],
      // 技术参数
      technical: {
        aspectRatio: '9:16 (竖版)',
        resolution: '1080x1920',
        format: 'mp4',
        codec: 'h.264',
        bitrate: '建议8-15Mbps'
      },
      // 元素建议
      elements: {
        subtitles: '必须添加，重点内容放大',
        bgm: '轻快/舒缓，根据内容基调',
        stickers: '适当添加品牌tag',
        transitions: '节奏感强的切换'
      }
    }
  }
}

module.exports = NoteGenerator