const test = require('node:test');
const assert = require('node:assert/strict');

const { parseReuseSource } = require('../utils/reuse.js');

test('应识别github raw来源', () => {
  const parsed = parseReuseSource('https://raw.githubusercontent.com/a/b/main/template.md');
  assert.equal(parsed.type, 'github_raw');
});

test('应识别skills本地来源', () => {
  const parsed = parseReuseSource('/Users/apple/Documents/PythonP/Evo-Eco-Skills/Hotspot-Catcher/skills/citrus-hotspot-content/SKILL.md');
  assert.equal(parsed.type, 'local_skill');
});
