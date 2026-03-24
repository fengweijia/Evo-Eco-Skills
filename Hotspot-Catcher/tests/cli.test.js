const { test, describe } = require('node:test');
const assert = require('node:assert');
const { detectEnvironment } = require('../src/cli/output.js');
const { parseArgs } = require('../src/cli/commands.js');

describe('cli', () => {
  test('detectEnvironment should return cli/ide/bot', () => {
    const env = detectEnvironment();
    assert.ok(['cli', 'ide', 'bot'].includes(env));
  });

  test('parseArgs should extract step parameter', () => {
    const args = parseArgs(['node', 'cli.js', '--step', 'hotspot']);
    assert.equal(args.step, 'hotspot');
  });

  test('parseArgs should support multiple steps', () => {
    const args = parseArgs(['node', 'cli.js', '--step', 'hotspot,analyze']);
    assert.ok(args.steps.includes('hotspot'));
    assert.ok(args.steps.includes('analyze'));
  });
});