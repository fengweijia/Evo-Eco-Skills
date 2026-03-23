const fs = require('fs');
const path = require('path');

const DEFAULT_INSIGHT_PATH = path.join(__dirname, '..', 'input', 'manual-insights.json');

function loadManualInsights(filePath = DEFAULT_INSIGHT_PATH) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(item => item && item.insight);
}

function pickInsightForHotspot(insights, hotspot) {
  if (!Array.isArray(insights) || !hotspot) {
    return null;
  }
  return (
    insights.find(item => item.keyword && item.keyword === hotspot.keyword) ||
    insights.find(item => item.title && hotspot.title && hotspot.title.includes(item.title)) ||
    null
  );
}

function mergeInsightIntoPrompt(basePrompt, insightText) {
  if (!insightText) {
    return basePrompt;
  }
  return `${basePrompt}\n\n人工见解：${insightText}`;
}

module.exports = {
  loadManualInsights,
  pickInsightForHotspot,
  mergeInsightIntoPrompt
};
