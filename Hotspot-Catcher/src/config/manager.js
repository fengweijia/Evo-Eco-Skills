const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch (e) {
        console.error(`Failed to parse config.json: ${e.message}`);
        return {};
      }
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
    if (args.styles) {
      this.config.styles = args.styles;
    }
  }
}

module.exports = { ConfigManager };