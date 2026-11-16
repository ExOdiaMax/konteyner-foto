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
    const letterCorrections = { 0: 'O', 1: 'I', 2: 'Z', 5: 'S', 6: 'G', 8: 'B' };
    const digitCorrections = { O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', G: '6', B: '8' };
    const ids = new Set();

    for (let index = 0; index <= compact.length - 11; index += 1) {
      const candidate = compact
        .slice(index, index + 11)
        .split('')
        .map((character, position) => {
          const corrections = position < 4 ? letterCorrections : digitCorrections;
          return corrections[character] || character;
        })
        .join('');
      if (/^[A-Z]{4}\d{7}$/.test(candidate)) ids.add(candidate);
    }

    return [...ids];
  };
});
