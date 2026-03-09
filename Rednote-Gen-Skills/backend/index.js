/**
 * rednote002 - 多Agent协调器
 * 主入口：处理所有用户请求，按流程调用各个Agent
 */

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

// 导入配置
const config = require('../config/account.config')

// 导入各Agent
const AccountProfiler = require('../agents/accountProfiler')
const BenchmarkScanner = require('../agents/benchmarkScanner')
const AccountDesigner = require('../agents/accountDesigner')
const ContentAnalyzer = require('../agents/contentAnalyzer')
const TopicPlanner = require('../agents/topicPlanner')
const NoteGenerator = require('../agents/noteGenerator')
const DataMonitor = require('../agents/dataMonitor')

class RednoteOrchestrator {
  constructor(userConfig = {}) {
    this.config = { ...config, ...userConfig }
    this.state = {
      currentStep: 0,
      userProfile: null,
      benchmarkAccounts: [],
      accountDesign: null,
      contentAnalysis: null,
      topics: [],
      selectedTopic: null,
      generatedNote: null
    }
    
    // 初始化各Agent
    this.agents = {
      profiler: new AccountProfiler(this.config),
      scanner: new BenchmarkScanner(this.config),
      designer: new AccountDesigner(this.config),
      analyzer: new ContentAnalyzer(this.config),
      planner: new TopicPlanner(this.config),
      generator: new NoteGenerator(this.config),
      monitor: new DataMonitor(this.config)
    }
  }
  
  /**
   * 主入口：处理用户请求
   */
  async handleRequest(request) {
    const { action, params } = request
    
    try {
      switch (action) {
        // ====== 步骤1: 账号配置 ======
        case 'configure':
          return await this.configure(params)
        
        // ====== 步骤2: 对标账号搜集 ======
        case 'scanBenchmark':
          return await this.scanBenchmark(params)
        
        // ====== 步骤3: 账号设计 ======
        case 'designAccount':
          return await this.designAccount(params)
        
        // ====== 步骤4: 内容拆解 ======
        case 'analyzeContent':
          return await this.analyzeContent(params)
        
        // ====== 步骤5: 主题规划 ======
        case 'planTopics':
          return await this.planTopics(params)
        
        // ====== 步骤6: 生成笔记 ======
        case 'generateNote':
          return await this.generateNote(params)
        
        // ====== 步骤7: 数据监控 ======
        case 'monitorData':
          return await this.monitorData(params)
        
        // ====== 完整流程 ======
        case 'fullWorkflow':
          return await this.fullWorkflow(params)
        
        // ====== 健康检查 ======
        case 'health':
          return { success: true, data: { version: '2.0.0', status: 'ok' } }
        
        default:
          return { success: false, message: `未知操作: ${action}` }
      }
    } catch (error) {
      console.error('Error:', error)
      return { success: false, message: error.message }
    }
  }
  
  /**
   * 步骤1: 账号配置
   */
  async configure(params) {
    this.state.currentStep = 1
    const result = await this.agents.profiler.run(params)
    this.state.userProfile = result.data
    return result
  }
  
  /**
   * 步骤2: 对标账号搜集
   */
  async scanBenchmark(params) {
    this.state.currentStep = 2
    const result = await this.agents.scanner.run({
      ...params,
      category: this.state.userProfile?.position?.category
    })
    this.state.benchmarkAccounts = result.data.accounts
    return result
  }
  
  /**
   * 步骤3: 账号设计
   */
  async designAccount(params) {
    this.state.currentStep = 3
    const result = await this.agents.designer.run({
      userProfile: this.state.userProfile,
      benchmarkAccounts: this.state.benchmarkAccounts
    })
    this.state.accountDesign = result.data
    return result
  }
  
  /**
   * 步骤4: 内容拆解
   */
  async analyzeContent(params) {
    this.state.currentStep = 4
    const result = await this.agents.analyzer.run({
      benchmarkAccounts: this.state.benchmarkAccounts
    })
    this.state.contentAnalysis = result.data
    return result
  }
  
  /**
   * 步骤5: 主题规划
   */
  async planTopics(params) {
    this.state.currentStep = 5
    const result = await this.agents.planner.run({
      userProfile: this.state.userProfile,
      contentAnalysis: this.state.contentAnalysis,
      hotTopics: params.hotTopics || []
    })
    this.state.topics = result.data.topics
    return result
  }
  
  /**
   * 步骤6: 生成笔记
   */
  async generateNote(params) {
    this.state.currentStep = 6
    
    // 检查是否需要生成封面图
    let coverImage = null
    if (this.config.output.autoGenerateCover) {
      coverImage = await this.generateCoverImage(params.topic)
    }
    
    const result = await this.agents.generator.run({
      topic: params.topic,
      userProfile: this.state.userProfile,
      contentStyle: this.state.contentAnalysis?.style,
      coverImage
    })
    this.state.generatedNote = result.data
    
    // 保存结果
    if (this.config.output.saveToLocal) {
      this.saveOutput(result.data)
    }
    
    return result
  }
  
  /**
   * 步骤7: 数据监控
   */
  async monitorData(params) {
    this.state.currentStep = 7
    return await this.agents.monitor.run(params)
  }
  
  /**
   * 完整流程（自动化）
   */
  async fullWorkflow(params) {
    console.log('🚀 开始完整流程...')
    
    // 1. 配置
    if (!this.state.userProfile) {
      await this.configure(params.config || {})
    }
    
    // 2. 对标搜集
    const scanResult = await this.scanBenchmark({})
    console.log(`✅ 对标账号: ${scanResult.data.accounts.length}个`)
    
    // 3. 账号设计
    const designResult = await this.designAccount({})
    console.log('✅ 账号设计完成')
    
    // 4. 内容拆解
    const analyzeResult = await this.analyzeContent({})
    console.log('✅ 内容拆解完成')
    
    // 5. 主题规划
    const planResult = await this.planTopics({})
    console.log(`✅ 主题规划: ${planResult.data.topics.length}个`)
    
    // 6. 等待用户选择主题
    // （用户选择后调用generateNote）
    
    return {
      success: true,
      message: '完整流程初始化完成，请选择主题后生成笔记',
      data: {
        currentStep: 6,
        benchmarkCount: scanResult.data.accounts.length,
        topics: planResult.data.topics,
        accountDesign: designResult.data
      }
    }
  }
  
  /**
   * 生成封面图（调用豆包模型）
   */
  async generateCoverImage(topic) {
    const { mediaProvider, imageApiKey, imageModel, videoModel } = this.config.ai
    
    if (mediaProvider === 'doubao' && imageApiKey) {
      // 调用豆包Seedream-5.0生成封面
      return { 
        provider: 'doubao', 
        model: imageModel,
        prompt: topic.title || topic,
        status: '需要配置API Key后调用'
      }
    }
    
    return null
  }
  
  /**
   * 保存输出到本地
   */
  saveOutput(noteData) {
    const outputPath = path.join(__dirname, this.config.output.localPath)
    const timestamp = new Date().toISOString().replace(/[:]/g, '-')
    const filename = `note_${timestamp}.json`
    
    try {
      fs.mkdirSync(outputPath, { recursive: true })
      fs.writeFileSync(
        path.join(outputPath, filename),
        JSON.stringify(noteData, null, 2)
      )
      console.log(`💾 已保存到: ${outputPath}${filename}`)
    } catch (error) {
      console.error('保存失败:', error)
    }
  }
  
  /**
   * 获取当前状态
   */
  getState() {
    return {
      currentStep: this.state.currentStep,
      userProfile: this.state.userProfile ? '已配置' : '未配置',
      benchmarkCount: this.state.benchmarkAccounts?.length || 0,
      accountDesign: this.state.accountDesign ? '已生成' : '待生成',
      topicsCount: this.state.topics?.length || 0,
      generatedNote: this.state.generatedNote ? '已生成' : '待生成'
    }
  }
}

// 导出
module.exports = RednoteOrchestrator

// 本地测试
if (require.main === module) {
  const orchestrator = new RednoteOrchestrator()
  
  ;(async () => {
    // 测试健康检查
    console.log(await orchestrator.handleRequest({ action: 'health' }))
    
    // 测试配置
    console.log('\n=== 测试配置 ===')
    const configResult = await orchestrator.handleRequest({
      action: 'configure',
      params: {
        account: {
          position: { category: '职场' },
          targetAudience: { gender: '女性', ageRange: '22-35岁' }
        }
      }
    })
    console.log(configResult)
    
    // 测试状态
    console.log('\n=== 当前状态 ===')
    console.log(orchestrator.getState())
  })()
}