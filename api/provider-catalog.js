const SUMMARY_URL='https://cbd46b77.cdn.cms.movetv.com/cms/publish3/domain/summary/ums/1.json';

export default async function handler(req,res){
  if((req.query?.provider||'').toLowerCase()!=='sling'){
    return res.status(400).json({error:'Unsupported provider'});
  }
  try{
    const upstream=await fetch(SUMMARY_URL,{
      headers:{
        accept:'application/json, text/plain, */*',
        origin:'https://watch.sling.com',
        referer:'https://watch.sling.com/',
        'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
        'client-config':'rn-client-config',
        'client-version':'7.1.32',
        'device-model':'Chrome',
        'player-version':'9.1.0',
        'response-config':'ar_browser_1_1',
        dma:'535',
        'geo-zipcode':'43017',
        'time-zone-id':'America/New_York',
        timezone:'-0500',
        features:'enable_ad_tracking,web_browser'
      }
    });
    if(!upstream.ok) throw new Error('Sling catalog HTTP '+upstream.status);
    const payload=await upstream.json();
    const channels=(Array.isArray(payload.channels)?payload.channels:[])
      .filter(item=>{
        const meta=item?.metadata||{};
        const vis=item?.visibility||{};
        const callSign=String(meta.call_sign||'');
        const title=String(item?.title||'');
        const genre=Array.isArray(meta.genre)?meta.genre:[];
        return (item?.channel_guid||item?.external_id) &&
          (item?.qvt_url||item?.qvt) &&
          vis.visible!==false &&
          meta.is_linear_channel!==false &&
          meta.is_free===true &&
          !/^SLATEPO\\d|^HYBRID-SIGNALTEST-/i.test(callSign) &&
          !/^SLATEPO\\d|^HYBRID-SIGNALTEST-/i.test(title) &&
          !genre.some(g=>String(g).toLowerCase()==='test');
      })
      .map(item=>{
        const meta=item.metadata||{};
        const id=String(item.channel_guid||item.external_id);
        const name=String(meta.channel_name||item.network_affiliate_name||item.title||meta.call_sign||'').trim();
        return {
          id,
          name,
          category:Array.isArray(meta.genre)&&meta.genre.length?String(meta.genre[0]):'Live TV',
          channelNumber:item.channel_number??null,
          url:'https://watch.sling.com/1/channel/'+encodeURIComponent(id)+'/watch?embed=true&autoplay=true'
        };
      })
      .filter(x=>x.name)
      .sort((a,b)=>a.name.localeCompare(b.name));
    return res.status(200).setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=3600').json({
      provider:'sling',
      count:channels.length,
      countLabel:channels.length+' official channels',
      live:'https://watch.sling.com/',
      channels
    });
  }catch(err){
    return res.status(502).json({error:String(err?.message||err)});
  }
}