function detectEnvironment() {
  if (process.env.CLAUDE_CODE) return 'bot';
  if (process.env.VSCODE_INJECTION) return 'ide';
  return 'cli';
}

function formatForCLI(data, type) {
  if (type === 'candidates') {
    let output = `=== ${data.platform} 文案候选 ===\n`;
    data.items.forEach((item, i) => {
      output += `[${i + 1}] ${item.title}\n`;
      output += `    推荐原因: ${item.reason}\n\n`;
    });
    return output;
  }
  return JSON.stringify(data, null, 2);
}

function formatForIDE(data, type) {
  if (type === 'candidates') {
    let md = `## ${data.platform} 文案候选\n\n`;
    md += `| # | 标题 | 推荐原因 |\n`;
    md += `|---|------|----------|\n`;
    data.items.forEach((item, i) => {
      md += `| ${i + 1} | ${item.title} | ${item.reason} |\n`;
    });
    return md;
  }
  return JSON.stringify(data, null, 2);
}

function formatForBot(data, type) {
  if (type === 'candidates') {
    let output = `**${data.platform} 文案候选**\n\n`;
    data.items.forEach((item, i) => {
      output += `${i + 1}️⃣ **${item.title}**\n`;
      output += `   💡 ${item.reason}\n\n`;
    });
    return output;
  }
  return JSON.stringify(data, null, 2);
}

function formatOutput(data, type, env) {
  switch (env) {
    case 'ide': return formatForIDE(data, type);
    case 'bot': return formatForBot(data, type);
    default: return formatForCLI(data, type);
  }
}

module.exports = { detectEnvironment, formatOutput, formatForCLI, formatForIDE, formatForBot };