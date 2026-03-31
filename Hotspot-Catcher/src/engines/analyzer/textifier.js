function textifyHotspot(hotspot) {
  const raw = hotspot.raw || {};
  return raw.content || raw.text || raw.transcript || hotspot.title || '';
}

module.exports = { textifyHotspot };