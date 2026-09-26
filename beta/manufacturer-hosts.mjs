// 상세 데이터 안의 공식 URL이 어느 제조사 호스트까지 허용되는지 정의한다.
// 카탈로그의 brand 값이 키다. 같은 제조사의 제품을 새로 올릴 때는 코드 수정이 필요 없다.
// 새 제조사를 추가할 때만 여기에 한 줄을 더한다. 확인한 호스트만 적는다.
export const manufacturerHosts = {
  AJA: ['aja.com', 'd26ddnfpy9hzf8.cloudfront.net'],
  AMX: ['techdata-ps.com', 'amx.com', 'harmanpro.com'],
  'Analog Way': ['analogway.com', 'website-files.com'],
  Audinate: ['getdante.com', 'audinate.com'],
  AVer: ['aver.com', 'averusa.com'],
  'Blackmagic Design': ['blackmagicdesign.com'],
  'BSS Audio': ['techdata-ps.com', 'bssaudio.com', 'harmanpro.com'],
  Colorlight: ['colorlightinside.com'],
  Crown: ['techdata-ps.com'],
  Epson: ['epson.co.kr', 'goepson.com'],
  JBL: ['techdata-ps.com'],
  Lightware: ['lightware.com'],
  Logitech: ['logitech.com'],
  Lumantek: ['lumantek.com', 'lumantek.co.kr'],
  Magnimage: ['magnimage.com'],
  NETGEAR: ['netgear.com'],
  NovaStar: ['novastar.tech', 'en-website001.oss-us-east-1.aliyuncs.com'],
  Panasonic: ['panasonic.com'],
  Powersoft: ['powersoft.com'],
  Roland: ['roland.com'],
  'Ross Video': ['rossvideo.com'],
  Samsung: ['samsung.com', 'samsungsvc.co.kr'],
  Shure: ['shure.com', 'shureweb.eu'],
  Sony: ['pro.sony', 'sony.net', 'sony.co.kr', 'sony.com'],
  SurgeX: ['ametekesp.com'],
  Televic: ['televic-conference.com', 'televic.digital', 'televic.com'],
  Yamaha: ['yamaha.com'],
  Yealink: ['yealink.com']
};

export function allowedHostsFor(brand) {
  const hosts = manufacturerHosts[brand];
  if (!hosts) throw new Error(`제조사 허용 호스트가 정의되지 않았습니다: ${brand}`);
  return hosts;
}

export function isAllowedHost(hostname, hosts) {
  return hosts.some(host => hostname === host || hostname.endsWith(`.${host}`));
}
