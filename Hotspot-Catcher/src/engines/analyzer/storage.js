const fs = require('fs');
const path = require('path');

async function saveToMarkdown(contents, options = {}) {
  const outputDir = options.outputDir || path.join(process.cwd(), 'output', 'analysis');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const filepath = path.join(outputDir, `analysis-${timestamp}.md`);

  let markdown = '# 热点分析报告\n\n';

  for (const content of contents) {
    markdown += `## ${content.platform} - ${content.title}\n\n`;
    markdown += `**原始文本**\n${content.textified}\n\n`;
    markdown += `**爆款结构**\n`;
    markdown += `- 钩子: ${content.structures.hook}\n`;
    markdown += `- 冲突: ${content.structures.conflict}\n`;
    markdown += `- 证据: ${content.structures.evidence.join(', ')}\n`;
    markdown += `- 行动点: ${content.structures.actions.join(', ')}\n`;
    markdown += `- CTA: ${content.structures.cta}\n\n`;
    markdown += `---\n\n`;
  }

  fs.writeFileSync(filepath, markdown, 'utf-8');

  return filepath;
}

module.exports = { saveToMarkdown };