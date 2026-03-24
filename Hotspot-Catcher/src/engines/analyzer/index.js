const { textifyHotspot } = require('./textifier.js');
const { extractStructure } = require('./extractor.js');
const { saveToMarkdown } = require('./storage.js');

async function analyzeViral(hotspots, options = {}) {
  const contents = [];

  for (const hotspot of hotspots) {
    const textified = textifyHotspot(hotspot);
    const structures = extractStructure(textified, hotspot);

    contents.push({
      hotspot_id: hotspot.id,
      platform: hotspot.platform,
      keyword: hotspot.keyword,
      title: hotspot.title,
      url: hotspot.url,
      textified,
      structures
    });
  }

  const storage_path = await saveToMarkdown(contents, options);

  return { contents, storage_path };
}

module.exports = { analyzeViral };