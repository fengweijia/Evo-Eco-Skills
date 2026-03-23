const fs = require('fs');
const path = require('path');
const axios = require('axios');

const REUSE_DIR = path.join(__dirname, '..', 'assets', 'reuse');

function ensureReuseDir() {
  if (!fs.existsSync(REUSE_DIR)) {
    fs.mkdirSync(REUSE_DIR, { recursive: true });
  }
}

function parseReuseSource(input) {
  if (String(input).includes('raw.githubusercontent.com')) {
    return { type: 'github_raw', value: input };
  }
  if (String(input).includes('/skills/')) {
    return { type: 'local_skill', value: input };
  }
  return { type: 'unknown', value: input };
}

async function importReuseSource(input) {
  ensureReuseDir();
  const parsed = parseReuseSource(input);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(REUSE_DIR, `reuse-${timestamp}.txt`);

  if (parsed.type === 'github_raw') {
    const response = await axios.get(parsed.value, { timeout: 15000 });
    fs.writeFileSync(target, String(response.data));
  } else if (parsed.type === 'local_skill') {
    fs.copyFileSync(parsed.value, target);
  } else {
    fs.writeFileSync(target, String(parsed.value));
  }

  const manifestPath = path.join(REUSE_DIR, 'reuse-manifest.json');
  const current = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    : [];
  current.push({ source: parsed.value, type: parsed.type, target, created_at: new Date().toISOString() });
  fs.writeFileSync(manifestPath, JSON.stringify(current, null, 2));

  return { parsed, target, manifestPath };
}

module.exports = {
  parseReuseSource,
  importReuseSource
};
