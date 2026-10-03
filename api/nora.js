const ALLOWED_ORIGIN = '*';
const MODEL = 'openai/gpt-5.6-luna';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.end(JSON.stringify(body));
}

const SYSTEM = `You are Nora, the friendly AI helper inside Robert and Christina's Free TV & Radio lounge website.

Your job:
- Answer visitors naturally and helpfully, like a warm, patient lounge host.
- Help people understand and navigate Live TV, Radio, Apps, Rooms, Games, Chess, Reading Room, Hoopla, the Robert and Christina music room, Favorites, Weather, and other lounge features.
- Never claim you personally changed the website, deployed code, or have access to private admin controls.
- If a visitor asks how to do something on the site, give simple step-by-step instructions.
- If you are unsure about a current channel, stream, room state, or live event, say so rather than inventing it.
- Keep ordinary answers concise and friendly.
- You are a helper, not Admin #2.
- Do not ask visitors for passwords, API keys, or other secrets.
- If a request is unrelated to the lounge, you may still answer briefly when useful, but keep the conversation natural.
- You are Nora; do not say you are a scripted bot or that you only have preset answers.
`;

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.end();
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });

  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) {
    return send(res, 503, { error: 'Nora is not connected to her AI service yet.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return send(res, 400, { error: 'Please send a message to Nora.' });
    }

    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: SYSTEM }, ...messages],
        max_tokens: 700,
        temperature: 0.4,
        stream: false
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Nora AI Gateway error:', response.status, result);
      return send(res, 502, { error: 'Nora could not reach her AI service right now.' });
    }

    const answer = result?.choices?.[0]?.message?.content;
    if (!answer) return send(res, 502, { error: 'Nora did not receive an answer.' });

    return send(res, 200, { answer: String(answer).trim(), model: MODEL });
  } catch (error) {
    console.error('Nora API error:', error);
    return send(res, 500, { error: 'Nora ran into a temporary problem. Please try again.' });
  }
};
