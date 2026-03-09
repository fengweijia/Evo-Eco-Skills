---
name: social-media-scraper
description: 短视频平台数据爬取工具 - 支持抖音/TikTok/快手/B站数据爬取和分析，可用于rednote002的对标账号分析功能
---

# Social Media Scraper (短视频数据爬取)

这个Skill封装了Douyin_TikTok_Download_API的功能，用于获取短视频平台的账号和内容数据。

## 触发条件

当需要以下功能时触发：
- 爬取抖音数据
- 获取TikTok内容
- 分析短视频账号
- 对标账号研究
- 视频数据采集

## 核心功能

### 1. 解析视频/帖子链接
```python
from douyin_tiktok_scraper import DouyinScraper

scraper = DouyinScraper()

# 解析单个视频
result = await scraper.parse_video("https://v.douyin.com/xxxxx")
# 返回：视频URL、作者信息、点赞数、评论数等

# 混合解析（支持抖音/TikTok）
result = await scraper.hybrid_parsing(url)
```

### 2. 获取用户信息
```python
# 通过用户ID获取用户主页数据
user_data = await scraper.get_user_posts(sec_user_id="xxx", limit=20)

# 获取用户基本信息
user_info = await scraper.get_user_info(sec_user_id="xxx")
```

### 3. 搜索功能
```python
# 搜索用户
search_results = await scraper.search_user(keyword="职场", limit=20)

# 搜索视频
video_results = await scraper.search_video(keyword="职场干货", limit=20)
```

### 4. 热点追踪
```python
# 获取热门视频
trending = await scraper.get_trending()
```

## 使用示例

### 在rednote002中的应用

```python
# rednote002 对标账号搜索
async def search_benchmark_accounts(category, keyword):
    from douyin_tiktok_scraper import DouyinScraper
    
    scraper = DouyinScraper()
    
    # 搜索相关账号
    results = await scraper.search_user(keyword=keyword, limit=20)
    
    # 过滤并排序
    accounts = []
    for user in results:
        # 获取详细数据
        user_detail = await scraper.get_user_info(user['sec_user_id'])
        
        accounts.append({
            'name': user_detail['nickname'],
            'followers': user_detail['follower_count'],
            'avg_likes': user_detail['total_likes'] / user_detail['total_posts'],
            'description': user_detail['signature']
        })
    
    # 按粉丝数排序
    accounts.sort(key=lambda x: x['followers'], reverse=True)
    
    return accounts[:10]
```

## 部署方式

### 方式A: 直接安装Python包（推荐）
```bash
pip install douyin-tiktok-scraper
```

### 方式B: Docker部署完整服务
```bash
# 克隆项目
git clone https://github.com/Evil0ctal/Douyin_TikTok_Download_API.git
cd Douyin_TikTok_Download_API

# 使用Docker运行
docker-compose up -d

# 访问Web界面: http://localhost:8000
# 访问API文档: http://localhost:8000/docs
```

### 方式C: 使用在线API服务
```python
# 通过API调用（需要Token）
import requests

def fetch_video_data(url, api_key):
    response = requests.post(
        "https://api.example.com/parse",
        json={"url": url, "api_key": api_key}
    )
    return response.json()
```

## 注意事项

1. **Cookie维护**: 需要定期更新抖音Cookie（风控原因）
2. **频率限制**: 建议添加延迟避免被封
3. **数据合规**: 仅用于学习和研究目的
4. **官方API**: 如需商业用途，考虑TikHub.io官方API

## 在OpenClaw中调用

### 方法1: 通过subagent调用Python脚本
```javascript
// 在OpenClaw中执行Python脚本
const result = await exec({
    command: "python3 scraper_script.py --keyword 职场",
    workdir: "/path/to/scripts"
})
```

### 方法2: 通过API调用部署的服务
```javascript
// 调用本地部署的API服务
const response = await fetch("http://localhost:8000/api/parse", {
    method: "POST",
    body: JSON.stringify({ url: videoUrl }),
    headers: { "Content-Type": "application/json" }
})
```

### 方法3: 直接使用Python包
```python
# 在Node.js环境中通过子进程调用
const { spawn } = require('child_process');
const python = spawn('python3', ['scraper.py', 'keyword']);
```

## 集成到rednote002

1. 在rednote002/skills/中创建scripts/目录
2. 放置封装好的爬虫脚本
3. 在backend/index.js中添加API调用
4. 通过exec或API方式调用Python脚本

---

## 相关链接

- GitHub: https://github.com/Evil0ctal/Douyin_TikTok_Download_API
- PyPi: https://pypi.org/project/douyin-tiktok-scraper/
- TikHub (付费API): https://tikhub.io/