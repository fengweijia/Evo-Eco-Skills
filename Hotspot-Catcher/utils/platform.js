/**
 * 平台适配器
 * 各平台API调用封装
 */

const axios = require('axios');

// 模拟平台数据获取
async function fetchBilibili(keyword) {
  // TODO: 接入B站API（需要登录cookie）
  return [];
}

async function fetchXiaohongshu(keyword) {
  // TODO: 小红书API
  return [];
}

async function fetchWeibo(keyword) {
  // 微博开放API
  try {
    // 需要申请微博开放平台账号
    return [];
  } catch (e) {
    return [];
  }
}

async function fetchZhihu(keyword) {
  // 知乎API
  try {
    // 需要申请知乎API
    return [];
  } catch (e) {
    return [];
  }
}

module.exports = {
  fetchBilibili,
  fetchXiaohongshu,
  fetchWeibo,
  fetchZhihu
};
