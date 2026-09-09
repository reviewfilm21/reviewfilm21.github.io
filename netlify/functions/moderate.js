exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method tidak diizinkan' });
  try {
    const body = JSON.parse(event.body || '{}');
    return json(200, moderate(String(body.text || '')));
  } catch {
    return json(400, { error: 'Payload tidak valid' });
  }
};

function moderate(text) {
  const badWords = ['bangsat','bajingan','kontol','memek','ngentot','anjing','goblok','tolol','idiot','bego','brengsek','kampret','keparat','fuck','shit','asshole','bitch','damn'];
  const result = { approved: true, reasons: [], filteredText: text, warnings: [] };
  if (text.length < 2) { result.approved = false; result.reasons.push('Komentar terlalu pendek'); }
  if (text.length > 500) { result.approved = false; result.reasons.push('Komentar terlalu panjang'); }
  const found = badWords.filter(w => text.toLowerCase().includes(w));
  if (found.length) {
    result.approved = false;
    result.reasons.push(`Mengandung kata tidak pantas: ${found.join(', ')}`);
    result.filteredText = found.reduce((s,w) => s.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), '*'.repeat(w.length)), text);
  }
  if (/https?:\/\/\S+|\bwww\.\S+/i.test(text)) {
    result.approved = false;
    result.reasons.push('Link tidak diizinkan');
    result.warnings.push('Terdeteksi pola spam');
  }
  return result;
}
function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}
