const { test } = require('node:test');
const assert = require('node:assert');
const { ConfigManager } = require('../src/config/manager.js');

test('ConfigManager should load config from config.json', () => {
  const config = new ConfigManager();
  assert.ok(config.get('keywords'));
  assert.ok(config.get('platforms'));
});

test('ConfigManager should merge cli args with config', () => {
  const config = new ConfigManager();
  config.mergeArgs({ keyword: '柑橘', platforms: ['wechat'] });
  assert.equal(config.get('keywords')[0], '柑橘');
  assert.ok(config.get('platforms').includes('wechat'));
});