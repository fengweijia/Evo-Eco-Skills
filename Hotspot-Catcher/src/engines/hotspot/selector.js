function selectTopN(hotspots, n) {
  const sorted = [...hotspots].sort((a, b) => b.views - a.views);
  return sorted.slice(0, n).map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}

module.exports = { selectTopN };