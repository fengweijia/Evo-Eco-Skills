const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return {};
  }

  get(key) {
    return this.config[key];
  }

  mergeArgs(args) {
    if (args.keyword) {
      this.config.keywords = [args.keyword];
    }
    if (args.platforms) {
      this.config.platforms = args.platforms;
    }
  }
}

module.exports = { ConfigManager };