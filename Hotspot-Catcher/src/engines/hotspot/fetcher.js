async function fetchFromPlatform(platform, keyword) {
  // TODO: 实现真实平台抓取
  // 目前返回模拟数据
  return [
    { title: `${keyword} 热点1`, url: `https://${platform}/1`, views: 100000 },
    { title: `${keyword} 热点2`, url: `https://${platform}/2`, views: 80000 },
    { title: `${keyword} 热点3`, url: `https://${platform}/3`, views: 60000 },
    { title: `${keyword} 热点4`, url: `https://${platform}/4`, views: 40000 },
    { title: `${keyword} 热点5`, url: `https://${platform}/5`, views: 20000 },
  ];
}

module.exports = { fetchFromPlatform };