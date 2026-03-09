// ============================================================
// rednote002 - 账号配置文件
// 使用方式：在Skills中调用读取
// ============================================================

module.exports = {
  // 账号基本信息
  account: {
    // 账号定位
    position: {
      // 账号名称（如有明确名称可填）
      name: "",
      // 运营目标（可多选）
      goals: ["涨粉", "变现", "品牌建设"],
      // 内容方向（垂类）
      category: "职场",
      // 子分类（可选）
      subCategory: "职场成长/求职面试"
    },
    
    // 目标受众
    targetAudience: {
      gender: "女性",
      ageRange: "22-35岁",
      occupation: "职场新人/白领/管理层",
      interests: ["职场成长", "自我提升", "搞钱"],
      painPoints: ["晋升慢", "工资低", "焦虑", "迷茫"]
    },
    
    // 运营目标
    objectives: {
      primary: "涨粉变现",  // 主要目标
      secondary: ["品牌IP", "知识沉淀"],  // 次要目标
      kpi: {
        monthlyNewFollowers: 1000,
        monthlyPostCount: 20,
        engagementRate: 0.05
      }
    },
    
    // 调性风格
    tone: {
      // 整体风格
      style: ["专业", "真诚", "接地气"],
      // 语言风格
      language: ["口语化", "有温度", "不装"],
      // 视觉风格
      visual: ["简约", "清新", "专业感"],
      // 差异化定位
      differentiation: "5年大厂实战经验，分享真实可复用的职场方法论"
    },
    
    // 内容制作构想
    contentPlan: {
      // 内容类型偏好
      contentTypes: ["干货教程", "成长故事", "经验分享"],
      // 内容形式
      formats: ["图文笔记", "短视频"],
      // 更新频率
      postingFrequency: "每周3-5篇",
      // 特色内容系列
      series: ["职场避坑指南", "晋升通关秘籍", "工资翻倍实录"]
    }
  },
  
  // AI配置
  ai: {
    // 大模型API（用于内容生成）
    provider: "deepseek",  // deepseek / openai / claude
    apiKey: "sk-94d6f058520141d6ba7d12ad7ee9faff",  // DeepSeek API Key
    model: "deepseek-chat",
    
    // 绘图/视频API（用于封面图和视频生成）
    // 使用豆包模型：Seedream-5.0(图片) / Seedance-2.0(视频)
    mediaProvider: "doubao",  // doubao / tongyi / dalle
    mediaApiKey: "8abf0efc-99c3-44fa-a682-f798a30c08ec",  // 豆包API Key
    imageModel: "doubao-seedream-5-0-260128",    // 封面图生成
    videoModel: "doubao-seedance-2-0-260128"     // 视频生成
  },
  
  // 数据源配置（免费开源）
  dataSource: {
    // 使用Agent-Reach（免费多平台采集）
    useAgentReach: true,
    agentReachEndpoint: "http://localhost:3000",  // 本地部署地址
    
    // 备用：自建爬虫配置
    useCustomScraper: false,
    scraperEndpoint: "http://localhost:8000"
  },
  
  // 输出配置
  output: {
    // 是否保存到本地
    saveToLocal: true,
    localPath: "./output/",
    
    // 导出格式
    exportFormat: ["markdown", "json"],
    
    // 是否自动生成封面
    autoGenerateCover: true
  }
}