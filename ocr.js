(function exposeContainerExtractor(root, createExtractor) {
  const api = createExtractor();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.extractContainerIds = api.extractContainerIds;
    root.extractContainerCandidates = api.extractContainerCandidates;
  }
})(globalThis, function createExtractor() {
  // ISO 6346 harf değerleri (11'in katları atlanır)
  const letterValues = {
    A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20,
    K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31,
    U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38
  };
  // OCR'ın sık karıştırdığı karakterler
  const letterCorrections = { 0: 'O', 1: 'I', 2: 'Z', 5: 'S', 6: 'G', 8: 'B' };
  const digitCorrections = { O: '0', Q: '0', D: '0', U: '0', I: '1', L: '1', T: '1', Z: '2', S: '5', G: '6', B: '8' };
  // 4. harf ekipman kategorisi: U (yük konteyneri), J (ekipman), Z (şasi/treyler)
  const categoryCorrections = { 0: 'U', O: 'U', V: 'U', W: 'U', '2': 'Z' };

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

  function fix(character, table, valid) {
    if (valid.test(character)) return { character, corrected: false };
    const fixed = table[character];
    return fixed ? { character: fixed, corrected: true } : null;
  }

  // Metindeki olası konteyner numaralarını puanlarıyla döndürür.
  // Puan: fotoğraftaki kontrol rakamı tutuyorsa yüksek, kontrol rakamı okunamadıysa düşük,
  // tutmuyorsa çok düşük; her karakter düzeltmesi için küçük ceza.
  function extractContainerCandidates(text) {
    const compact = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const best = new Map();

    for (let index = 0; index <= compact.length - 10; index += 1) {
      const chars = [];
      let corrections = 0;
      let ok = true;
      for (let position = 0; position < 10 && ok; position += 1) {
        const raw = compact[index + position];
        let result;
        if (position < 3) result = fix(raw, letterCorrections, /[A-Z]/);
        else if (position === 3) result = fix(raw, categoryCorrections, /[UJZ]/);
        else result = fix(raw, digitCorrections, /\d/);
        if (!result) { ok = false; break; }
        if (result.corrected) corrections += 1;
        chars.push(result.character);
      }
      if (!ok || corrections > 2) continue;

      const prefix = chars.join('');
      const checkDigit = calculateCheckDigit(prefix);
      if (checkDigit === null) continue;

      let score;
      const rawCheck = compact[index + 10];
      const readCheck = rawCheck === undefined ? null : (/\d/.test(rawCheck) ? rawCheck : digitCorrections[rawCheck] || null);
      if (readCheck === checkDigit) {
        score = 10;                       // kontrol rakamı doğrulandı
      } else if (readCheck === null) {
        score = 2;                        // kontrol rakamı görünmüyor (ayrı kutuda/satırda olabilir)
      } else {
        score = 1;                        // sonraki karakter tutmuyor: başka bir yazı ya da yanlış okuma
      }
      score -= corrections * 0.5;
      if (score <= 0) continue;

      const id = prefix + checkDigit;
      best.set(id, Math.max(best.get(id) || 0, score));
    }

    return [...best.entries()]
      .map(([id, score]) => ({ id, score }))
      .sort((first, second) => second.score - first.score);
  }

  function extractContainerIds(text) {
    return extractContainerCandidates(text).map((candidate) => candidate.id);
  }

  return { extractContainerIds, extractContainerCandidates, calculateCheckDigit };
});
