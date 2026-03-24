const { test, describe } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');

describe('integration', () => {
  test('cli should execute hotspot step', async () => {
    const result = await runCli(['--step', 'hotspot', '--keyword', '测试']);
    assert.ok(result.includes('热点') || result.includes('完成'));
  });

  test('cli should show help without step', async () => {
    const result = await runCli([]);
    assert.ok(result.includes('Usage') || result.includes('node cli.js'));
  });
});

function runCli(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['src/cli/index.js', ...args], {
      cwd: process.cwd()
    });
    let output = '';
    proc.stdout.on('data', data => { output += data.toString(); });
    proc.stderr.on('data', data => { output += data.toString(); });
    proc.on('close', () => { resolve(output); });
    proc.on('error', reject);
  });
}