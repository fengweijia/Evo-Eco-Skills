const { importReuseSource } = require('../utils/reuse.js');

function parseSourceArg(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--source') {
      return argv[i + 1] || '';
    }
  }
  return '';
}

async function main() {
  const source = parseSourceArg(process.argv.slice(2));
  if (!source) {
    console.error('缺少 --source 参数');
    process.exit(1);
  }
  const result = await importReuseSource(source);
  console.log('导入成功');
  console.log(`type: ${result.parsed.type}`);
  console.log(`target: ${result.target}`);
  console.log(`manifest: ${result.manifestPath}`);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
