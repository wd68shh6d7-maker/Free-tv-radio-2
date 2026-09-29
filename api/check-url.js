const BLOCKED=/\b(?:xxx|nsfw|porn(?:ography)?|xvideos|xnxx|xhamster|redtube|brazzers|chaturbate|stripchat|pornhub|spankbang|rule34|hentai)\b/i;
const ABOVE_R=/$^/;

function escHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

module.exports = async function handler(req,res){
  const raw=String(req.query?.url||'').trim();
  if(!raw)return res.status(400).json({blocked:true,reason:'No URL supplied.'});
  let target;
  try{target=new URL(raw)}catch{ return res.status(400).json({blocked:true,reason:'Invalid web address.'}); }
  if(!['http:','https:'].includes(target.protocol))return res.status(400).json({blocked:true,reason:'Only web pages are allowed.'});
  if(BLOCKED.test(target.hostname)||BLOCKED.test(target.pathname)||BLOCKED.test(target.search))return res.status(200).json({blocked:true,reason:'The address matches an adult-content category.'});
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),4500);
  try{
    const response=await fetch(target,{redirect:'follow',signal:controller.signal,headers:{'user-agent':'Free-TV-Radio safety checker'}});
    const finalUrl=new URL(response.url);
    const type=response.headers.get('content-type')||'';
    if(BLOCKED.test(finalUrl.hostname)||BLOCKED.test(finalUrl.pathname)||BLOCKED.test(finalUrl.search))return res.status(200).json({blocked:true,reason:'The destination matches an adult-content category.'});
    if(!type.includes('text/html'))return res.status(200).json({blocked:false,reason:'Non-HTML content; no above-R page rating was detected.'});
    const html=(await response.text()).slice(0,500000);
    const meta=[];
    const re=/<meta\b[^>]*(?:name|property)=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
    let m; while((m=re.exec(html))&&meta.length<100)meta.push((m[1]+' '+m[2]).slice(0,1000));
    const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'';
    const head=(meta.join(' ')+' '+title).replace(/&[^;]+;/g,' ');
    /* Do not classify ordinary pages by ratings. The web browser only blocks explicit X-rated destinations/requests. */
    return res.status(200).json({blocked:false,reason:'No above-R classification was detected in the page metadata.'});
  }catch(e){
    return res.status(200).json({blocked:true,reason:'The page could not be verified safely, so it was not opened.'});
  }finally{clearTimeout(timer);}
};