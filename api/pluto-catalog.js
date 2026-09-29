const BOOT_URL='https://boot.pluto.tv/v4/start';
const CHANNELS_URL='https://api.pluto.tv/v2/channels';
const STITCHER_FALLBACK='https://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv';

function text(v){return String(v==null?'':v).trim()}
function uuid(){
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
    const r=Math.random()*16|0,v=c==='x'?r:(r&3)|8;
    return v.toString(16);
  });
}
function query(params){
  return Object.entries(params).filter(([,v])=>v!==undefined&&v!==null&&v!=='')
    .map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&');
}
function jwtPayload(token){
  try{
    const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    return JSON.parse(Buffer.from(part,'base64').toString('utf8'));
  }catch(_){return {}}
}
function stitchPath(path){
  let p=text(path).replace(/^https?:\/\/[^/]+/,'').split('?')[0];
  if(!p.startsWith('/'))p='/'+p;
  p=p.replace(/^\/v\d+(?=\/)/,'');
  return '/v2'+p;
}

export default async function handler(req,res){
  if((req.query?.provider||'').toLowerCase()!=='pluto'){
    return res.status(400).json({error:'Unsupported provider'});
  }
  try{
    const deviceId=uuid();
    const sid=uuid();
    const params={
      appName:'web',appVersion:'9.1.0',deviceType:'web',deviceModel:'web',
      deviceMake:'chrome',deviceVersion:'122',deviceId,clientID:deviceId,
      clientModelNumber:'1.0.0',sid,serverSideAds:'false',blockingMode:''
    };
    const ip=(req.headers['x-forwarded-for']||'').split(',')[0].trim();
    const bootHeaders={accept:'application/json'};
    if(ip)bootHeaders['x-forwarded-for']=ip;
    const boot=await fetch(BOOT_URL+'?'+query(params),{headers:bootHeaders});
    if(!boot.ok)throw new Error('Pluto boot '+boot.status);
    const bootJson=await boot.json();
    const token=text(bootJson.sessionToken);
    if(!token)throw new Error('Pluto did not return a session token');
    const stitcher=text(bootJson?.servers?.stitcher)||STITCHER_FALLBACK;
    let stitcherParams=text(bootJson.stitcherParams);
    if(stitcherParams.startsWith('?'))stitcherParams=stitcherParams.slice(1);
    if(!stitcherParams)stitcherParams=query(params);

    const now=new Date();
    const stop=new Date(now.getTime()+120*60000);
    const authHeaders={accept:'application/json',authorization:'Bearer '+token};
    const channelsRes=await fetch(CHANNELS_URL+'?'+query({start:now.toISOString(),stop:stop.toISOString()}),{headers:authHeaders});
    if(!channelsRes.ok)throw new Error('Pluto channels '+channelsRes.status);
    const raw=await channelsRes.json();
    const list=Array.isArray(raw)?raw:(raw?.data||[]);
    const channels=list.filter(ch=>String(ch?._id||ch?.id||'').trim() && ch?.visibility!=='hidden').map(ch=>{
      const id=String(ch._id||ch.id);
      let path=ch?.stitched?.path||'';
      if(!path)path='/stitch/hls/channel/'+encodeURIComponent(id)+'/master.m3u8';
      const stream=stitcher+stitchPath(path)+'?'+stitcherParams+'&jwt='+encodeURIComponent(token)+'&masterJWTPassthrough=true&includeExtendedEvents=true';
      return {
        id,
        name:text(ch.name),
        category:text(ch.category)||text(ch?.categories?.[0]?.name)||text(ch.genre)||'Live TV',
        number:ch.number??null,
        stream,
        url:'https://pluto.tv/us/watch/live-tv/'+encodeURIComponent(id),
      };
    }).filter(ch=>ch.name&&ch.stream);

    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
    return res.status(200).json({
      provider:'pluto',
      count:channels.length,
      countLabel:channels.length+' official live channels',
      live:'https://pluto.tv/us/watch/live-tv/',
      channels
    });
  }catch(err){
    return res.status(502).json({error:String(err?.message||err)});
  }
}