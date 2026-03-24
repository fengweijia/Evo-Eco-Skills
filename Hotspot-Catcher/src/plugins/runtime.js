const path = require('path');

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
        return null;
      }
    } catch (e) {
      console.warn(`Failed to load external ${type}:`, e.message);
    }
    return null;
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