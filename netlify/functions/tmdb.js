exports.handler = async (event) => {
  const key = process.env.TMDB_API_KEY;
  if (!key) return json(500, { error: 'TMDB_API_KEY belum dikonfigurasi' });

  const prefix = '/.netlify/functions/tmdb/';
  const path = event.path.startsWith(prefix) ? event.path.slice(prefix.length) : '';
  if (!path) return json(400, { error: 'Endpoint TMDB tidak diberikan' });

  const params = new URLSearchParams(event.queryStringParameters || {});
  params.set('api_key', key);
  if (!params.get('language')) params.set('language', 'id-ID');

  try {
    const response = await fetch(`https://api.themoviedb.org/3/${path}?${params.toString()}`);
    const text = await response.text();
    return {
      statusCode: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: text
    };
  } catch (error) {
    console.error('TMDB Error:', error);
    return json(502, { error: 'Gagal mengambil data dari TMDB' });
  }
};

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
