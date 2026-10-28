export type LearningVideo = { type: 'embed' | 'file'; src: string; provider: string };
/** Only known providers become iframes. No arbitrary HTML or iframe markup is accepted. */
export function learningVideo(value: unknown): LearningVideo | null {
  if(typeof value !== 'string') return null;
  let u:URL;try{u=new URL(value);}catch{return null;}
  if(u.protocol !== 'https:' || u.username || u.password || u.port) return null;
  const host=u.hostname.toLowerCase(), parts=u.pathname.split('/').filter(Boolean);
  if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(host)){
    const id=host==='youtu.be'?parts[0]:u.pathname==='/watch'?u.searchParams.get('v'):['embed','shorts','live'].includes(parts[0])?parts[1]:null;
    if(!id || !/^[a-zA-Z0-9_-]{11}$/.test(id))return null;
    const embed=new URL('https://www.youtube-nocookie.com/embed/'+id);embed.searchParams.set('rel','0');embed.searchParams.set('playsinline','1');
    return {type:'embed',src:embed.href,provider:'YouTube'};
  }
  if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)){
    const id=parts[0]==='video'?parts[1]:parts[0];if(!/^\d+$/.test(id??''))return null;
    const embed=new URL('https://player.vimeo.com/video/'+id),hash=u.searchParams.get('h')??parts[1];
    if(hash && /^[a-zA-Z0-9]+$/.test(hash) && parts[0]!=='video')embed.searchParams.set('h',hash);
    else if(u.searchParams.has('h') && /^[a-zA-Z0-9]+$/.test(u.searchParams.get('h')!))embed.searchParams.set('h',u.searchParams.get('h')!);
    return {type:'embed',src:embed.href,provider:'Vimeo'};
  }
  if(/\.(mp4|webm|ogv)$/i.test(u.pathname))return {type:'file',src:u.href,provider:'Video'};
  return null;
}
