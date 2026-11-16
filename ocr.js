(function exposeContainerExtractor(root, createExtractor) {
  const extractContainerIds = createExtractor();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { extractContainerIds };
  } else {
    root.extractContainerIds = extractContainerIds;
  }
})(globalThis, function createExtractor() {
  return function extractContainerIds(text) {
    const compact = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return [...new Set(compact.match(/[A-Z]{4}\d{7}/g) || [])];
  };
});
