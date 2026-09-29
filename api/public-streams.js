const SOURCES=[
  'https://iptv-org.github.io/iptv/streams/us.m3u',
  'https://raw.githubusercontent.com/iptvjs/m3u/main/tubi_playlist.m3u'
];

function normalize(s){
  return String(s||'').toLowerCase()
    .replace(/\[[^\]]+\]/g,' ')
    .replace(/\([^)]*(?:\\d{3,4}p|sd|hd|fhd|uhd|\\d{3,4}i)[^)]*\)/gi,' ')
    .replace(/\\b(?:eng|spa|fra|deu|ita|por|ara|fas|urd|hin|jpn|kor|zho|rus|tur|pol|ukr|tha|vie)\\b/gi,' ')
    .replace(/[^a-z0-9]+/g,' ').trim();
}

async function parseM3U(body,map){
  const lines=String(body||'').split(/\\r?\\n/);
  for(let i=0;i<lines.length;i++){
    const line=lines[i]||'';
    if(!line.startsWith('#EXTINF'))continue;
    const comma=line.indexOf(',');
    if(comma<0)continue;
    const name=line.slice(comma+1).trim();
    const url=(lines[i+1]||'').trim();
    if(!/^https:\\/\\//i.test(url))continue;
    const key=normalize(name);
    if(!key||/\\b(xxx|adult|explicit|nsfw)\\b/i.test(key))continue;
    if(!map[key])map[key]=[];
    if(!map[key].some(v=>v.url===url))map[key].push({url,name});
  }
}

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'GET only'});
  const map={};let successful=0;
  try{
    const results=await Promise.allSettled(SOURCES.map(url=>fetch(url,{headers:{accept:'text/plain,*/*','user-agent':'FreeTVRadio/2.0'}})));
    for(const result of results){
      if(result.status!=='fulfilled'||!result.value.ok)continue;
      successful++;
      await parseM3U(await result.value.text(),map);
    }
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
    return res.status(successful?200:502).json({sources:SOURCES.length,successful,map});
  }catch(err){
    return res.status(502).json({error:String(err?.message||err)});
  }
}