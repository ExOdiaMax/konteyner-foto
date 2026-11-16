(function exposeContainerExtractor(root, createExtractor) {
  const extractContainerIds = createExtractor();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { extractContainerIds };
  } else {
    root.extractContainerIds = extractContainerIds;
  }
})(globalThis, function createExtractor() {
  const letterValues = {
    A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20,
    K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31,
    U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38
  };

  function calculateCheckDigit(prefix) {
    let sum = 0;
    for (let index = 0; index < prefix.length; index += 1) {
      const character = prefix[index];
      const value = /\d/.test(character) ? Number(character) : letterValues[character];
      if (value === undefined) return null;
      sum += value * (2 ** index);
    }
    const remainder = sum % 11;
    return String(remainder === 10 ? 0 : remainder);
  }

  return function extractContainerIds(text) {
    const compact = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const letterCorrections = { 0: 'O', 1: 'I', 2: 'Z', 5: 'S', 6: 'G', 8: 'B' };
    const digitCorrections = { O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', G: '6', B: '8' };
    const ids = new Set();

    for (let index = 0; index <= compact.length - 10; index += 1) {
      const prefix = compact
        .slice(index, index + 10)
        .split('')
        .map((character, position) => {
          const corrections = position < 4 ? letterCorrections : digitCorrections;
          return corrections[character] || character;
        })
        .join('');
      if (!/^[A-Z]{4}\d{6}$/.test(prefix)) continue;
      const checkDigit = calculateCheckDigit(prefix);
      if (checkDigit !== null) ids.add(prefix + checkDigit);
    }

    return [...ids];
  };
});
