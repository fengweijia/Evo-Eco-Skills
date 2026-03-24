const { textifyHotspot } = require('./textifier.js');
const { extractStructure } = require('./extractor.js');
const { saveToMarkdown } = require('./storage.js');

async function analyzeViral(hotspots, options = {}) {
  const contents = [];
  const errors = [];

  for (const hotspot of hotspots) {
    try {
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
    } catch (e) {
      errors.push({ hotspot_id: hotspot.id, error: e.message });
      console.warn(`Failed to analyze hotspot ${hotspot.id}: ${e.message}`);
    }
  }

  if (contents.length === 0) {
    throw new Error('No hotspots could be analyzed');
  }

  try {
    const storage_path = await saveToMarkdown(contents, options);
    return { contents, storage_path, errors: errors.length > 0 ? errors : undefined };
  } catch (e) {
    console.warn(`Failed to save markdown: ${e.message}`);
    return { contents, storage_path: null, errors: [...errors, { error: e.message }] };
  }
}

module.exports = { analyzeViral };