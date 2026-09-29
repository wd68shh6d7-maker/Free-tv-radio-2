const STATIC_MAP={
  'abc news live':[{url:'https://aegis-cloudfront-1.tubi.video/d6cbb0de-68e4-4f3b-82f9-bf5d526e0bde/index.m3u8',name:'ABC News Live'}],
  'cbs news 24 7':[{url:'https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8',name:'CBS News 24/7'}],
  'nbc news now':[{url:'https://d1bl6tskrpq9ze.cloudfront.net/hls/master.m3u8?ads.xumo_channelId=99984003',name:'NBC News NOW'}],
  'fox weather':[{url:'https://247wlive.foxweather.com/stream/index.m3u8',name:'FOX Weather'}],
  'livenow from fox':[{url:'https://fox-foxnewsnow-vizio.amagi.tv/playlist.m3u8',name:'LiveNOW from FOX'}]
};

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'GET only'});
  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
  return res.status(200).json({sources:0,successful:0,map:STATIC_MAP});
}
