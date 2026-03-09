/**
 * rednote002 完整流程测试
 */

const baseUrl = 'http://localhost:3000'

async function call(action, params = {}) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, params })
  })
  return await res.json()
}

async function test() {
  console.log('🧪 rednote002 完整流程测试\n')
  console.log('='.repeat(50))
  
  // 1. 账号配置
  console.log('\n📝 【步骤1】账号配置')
  const configResult = await call('configure', {
    account: {
      position: { category: '职场', goals: ['涨粉', '变现'] },
      targetAudience: { gender: '女性', ageRange: '22-35岁' },
      objectives: { primary: '涨粉变现' },
      tone: { style: ['真诚'], differentiation: '5年大厂经验' },
      contentPlan: { formats: ['图文'] }
    }
  })
  console.log('✅ 账号配置:', configResult.success ? '成功' : configResult.message)
  
  // 2. 对标账号搜索
  console.log('\n🔍 【步骤2】对标账号搜索')
  const scanResult = await call('scanBenchmark', { category: '职场' })
  console.log('✅ 找到对标账号:', scanResult.data?.accounts?.length || 0, '个')
  if (scanResult.data?.accounts?.[0]) {
    console.log('   示例:', scanResult.data.accounts[0].name, '-', scanResult.data.accounts[0].followers, '粉丝')
  }
  
  // 3. 账号设计
  console.log('\n🎨 【步骤3】账号设计')
  const designResult = await call('designAccount', {})
  console.log('✅ 账号设计:', designResult.success ? '完成' : designResult.message)
  console.log('   推荐名称:', designResult.data?.name?.recommended)
  console.log('   人设:', designResult.data?.persona?.role)
  
  // 4. 内容拆解
  console.log('\n📊 【步骤4】内容拆解分析')
  const analyzeResult = await call('analyzeContent', {})
  console.log('✅ 内容拆解:', analyzeResult.success ? '完成' : analyzeResult.message)
  console.log('   爆款公式:', analyzeResult.data?.viralFormulas?.[0]?.formula)
  
  // 5. 主题规划
  console.log('\n📋 【步骤5】主题规划')
  const planResult = await call('planTopics', {})
  console.log('✅ 规划主题:', planResult.data?.topics?.length || 0, '个')
  planResult.data?.topics?.slice(0, 3).forEach((t, i) => {
    console.log(`   ${i+1}. ${t.title}`)
  })
  
  // 6. 生成笔记（假设选择第1个主题）
  console.log('\n✍️ 【步骤6】生成笔记')
  const topic = planResult.data?.topics?.[0] || { title: '职场生存指南' }
  const noteResult = await call('generateNote', { 
    topic: topic,
    format: '图文'
  })
  console.log('✅ 笔记生成:', noteResult.success ? '完成' : noteResult.message)
  if (noteResult.data?.titles?.[0]) {
    console.log('   标题:', noteResult.data.titles[0].text)
  }
  console.log('   格式:', noteResult.data?.format)
  console.log('   字数:', noteResult.data?.metadata?.wordCount)
  
  // 7. 配置检查
  console.log('\n⚙️ 【步骤7】配置验证')
  console.log('   DeepSeek API:', config.ai?.apiKey ? '✅ 已配置' : '❌ 未配置')
  console.log('   豆包 API:', config.ai?.mediaApiKey ? '✅ 已配置' : '❌ 未配置')
  
  console.log('\n' + '='.repeat(50))
  console.log('🎉 测试完成！')
  
  return { success: true }
}

const config = require('./config/account.config')
test().catch(console.error)