function parseArgs(argv = process.argv) {
  const args = {
    steps: [],
    keyword: null,
    platforms: null,
    styles: null,
    config: null
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--step' && argv[i + 1]) {
      args.steps = argv[i + 1].split(',');
      args.step = args.steps[0];
    }
    if (arg === '--keyword' && argv[i + 1]) {
      args.keyword = argv[i + 1];
    }
    if (arg === '--platforms' && argv[i + 1]) {
      args.platforms = argv[i + 1].split(',');
    }
    if (arg === '--styles' && argv[i + 1]) {
      args.styles = argv[i + 1].split(',');
    }
    if (arg === '--config' && argv[i + 1]) {
      args.config = argv[i + 1];
    }
  }

  return args;
}

function getCommandHelp() {
  return `
Usage: node cli.js [options]

Options:
  --step <commands>   执行步骤: hotspot, analyze, draft, image, all
  --keyword <word>    关键词
  --platforms <list>  平台列表，用逗号分隔
  --styles <list>     风格列表，用逗号分隔
  --config <file>     配置文件

Examples:
  node cli.js --step hotspot --keyword 柑橘
  node cli.js --step hotspot,analyze,draft --platforms wechat,xiaohongshu
  node cli.js --step all --keyword 柑橘 --styles 写实摄影,清新手绘
`;
}

module.exports = { parseArgs, getCommandHelp };