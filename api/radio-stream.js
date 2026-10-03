export default async function handler(req, res) {
  const station = String(req.query?.station || '').toLowerCase();
  const sources = {
    kvmr: 'http://live.kvmr.org:8000/aac96',
    kwmv: 'https://rdo.to/KWMV'
  };
  const source = sources[station];
  if (!source) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('Unknown radio station');
  }

  try {
    const upstream = await fetch(source, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'FreeTVRadio/2.0',
        'Accept': 'audio/aac,audio/mpeg,audio/*;q=0.9,*/*;q=0.8'
      }
    });

    if (!upstream.ok || !upstream.body) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end('Radio stream unavailable');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/aac');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const reader = upstream.body.getReader();
    req.on('close', () => { try { reader.cancel(); } catch (_) {} });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) {
        await new Promise(resolve => res.once('drain', resolve));
      }
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Unable to connect to radio stream');
    } else {
      res.end();
    }
  }
}