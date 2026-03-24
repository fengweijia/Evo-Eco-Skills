function adaptImageCount(platform) {
  switch (platform) {
    case 'wechat':
      return 2; // 封面 + 1张配图
    case 'xiaohongshu':
      return 3; // 封面 + 2张配图
    default:
      return 1;
  }
}

module.exports = { adaptImageCount };