const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

class PluginRuntime {
  constructor(config) {
    this.config = config;
    this.cache = new Map();
  }

  async loadEngine(type) {
    if (this.cache.has(type)) {
      return this.cache.get(type);
    }

    const pluginConfig = this.config.plugins?.[type] || { provider: 'builtin' };
    const { provider, external } = pluginConfig;

    let engine = null;

    if (provider === 'builtin') {
      engine = this.loadBuiltin(type);
    } else if (provider === 'external' && external) {
      engine = await this.loadExternal(external, type);
    }

    if (!engine) {
      engine = this.loadBuiltin(type);
    }

    this.cache.set(type, engine);
    return engine;
  }

  loadBuiltin(type) {
    try {
      return require(`../engines/${type}/index.js`);
    } catch (e) {
      return null;
    }
  }

  async loadExternal(external, type) {
    try {
      if (external.path) {
        return require(path.resolve(external.path));
      }
      if (external.url) {
        // 下载远程模块
        const moduleCode = await this.downloadUrl(external.url);
        if (moduleCode) {
          // 临时写入文件并加载
          const tempPath = path.join(process.cwd(), 'temp_plugin.js');
          fs.writeFileSync(tempPath, moduleCode, 'utf-8');
          const plugin = require(tempPath);
          fs.unlinkSync(tempPath); // 清理临时文件
          return plugin;
        }
      }
    } catch (e) {
      console.warn(`Failed to load external ${type}:`, e.message);
    }
    return null;
  }

  downloadUrl(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // 处理重定向
          this.downloadUrl(res.headers.location).then(resolve).catch(reject);
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  async callEngine(type, method, ...args) {
    const engine = await this.loadEngine(type);
    if (engine && engine[method]) {
      return engine[method](...args);
    }
    throw new Error(`Engine ${type} does not have method ${method}`);
  }
}

module.exports = { PluginRuntime };