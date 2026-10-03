const crypto = require('crypto');

function b64url(value) {
  return Buffer.from(value).toString('base64')
    .replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_');
}

function signJwt(payload, secret) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const unsigned = header + '.' + body;
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64')
    .replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_');
  return unsigned + '.' + signature;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });

  const key = process.env.ZOOM_VIDEO_SDK_KEY;
  const secret = process.env.ZOOM_VIDEO_SDK_SECRET;
  if (!key || !secret) {
    return send(res, 503, {
      error: 'Zoom Rooms is not connected to the lounge yet. The room interface is installed, but the private Zoom Video SDK credentials still need to be connected.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const topic = String(body.topic || '').trim().slice(0, 150);
    const userName = String(body.userName || '').trim().slice(0, 200) || 'Lounge Guest';
    const role = body.role === 1 ? 1 : 0;
    if (!topic) return send(res, 400, { error: 'Room code is required.' });

    const now = Math.floor(Date.now() / 1000);
    const exp = now + (12 * 60 * 60);
    const payload = {
      app_key: key,
      role_type: role,
      tpc: topic,
      version: 1,
      iat: now - 30,
      exp,
      user_key: crypto.randomUUID()
    };

    const token = signJwt(payload, secret);
    return send(res, 200, { token, expiresAt: exp });
  } catch (error) {
    console.error('Zoom room token error:', error);
    return send(res, 500, { error: 'The lounge could not prepare the Zoom room.' });
  }
};
