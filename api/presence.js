const SUPABASE_URL = 'https://doxzuuzzcxaozkyojybu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_U2DbudIt9o0D8UO1R0hWuw_yTsJBPFq';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end('Method Not Allowed');
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const sessionId = String(body.sessionId || '');
    const mode = ['tv', 'radio', 'site'].includes(body.mode) ? body.mode : 'site';

    if (sessionId.length < 16 || sessionId.length > 128) {
      res.statusCode = 400;
      return res.end('Invalid session');
    }

    // Vercel supplies coarse IP geolocation headers. We intentionally do not
    // read or store city, postal code, latitude, longitude, or the IP itself.
    const country = String(req.headers['x-vercel-ip-country'] || '').slice(0, 2).toUpperCase();
    const region = String(req.headers['x-vercel-ip-country-region'] || '').slice(0, 12).toUpperCase();

    const response = await fetch(SUPABASE_URL + '/rest/v1/rpc/record_viewer_presence', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_session_id: sessionId,
        p_mode: mode,
        p_country_code: country || null,
        p_region_code: region || null
      })
    });

    const text = await response.text();
    if (!response.ok) {
      res.statusCode = 502;
      return res.end('Presence service unavailable');
    }

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    return res.end(text);
  } catch (_) {
    res.statusCode = 500;
    return res.end('Presence service error');
  }
};
