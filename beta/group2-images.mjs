// 상세페이지가 아직 없는 Group 2 제품의 Library 카드 대표 사진.
// 조사·승인 기록: Work/기록/W-20260925-012-사진조사.md, 전체 48장 목록: docs/research/group2-images/manifest.json
// 제품의 상세페이지가 생기면 이 목록에서 빼고 group1-images.mjs의 cardImages로 옮긴다(상세가 있으면 preview 필드를 두지 않는다).
export const publicationStatus = '사용자 게시 승인 · 제조사 재사용 권리 미확인';

// 사이트용 사본은 흰 여백을 잘라내고 가장자리 4%만 남겼다(resolution은 사이트 사본 기준). 조사 원본은 docs/research/group2-images/에 그대로 있다.
// scope: 'series'는 제조사가 같은 계열 여러 모델에 함께 쓰는 사진이다.
export const group2Previews = [
  { brand: 'Powersoft', product: 'Mezzo 322 AD', scope: 'series', image: { role: 'Front', file: 'mezzo-322-ad-front.webp', alt: 'Powersoft Mezzo 계열 공용 전면 패널 이미지(Mezzo 322 AD 제품 페이지 대표 이미지)', provider: 'Powersoft', model: 'Mezzo 322 AD', sourceUrl: 'https://www.powersoft.com/api/media/file/Mezzo322A_gallery-cardL_front-2.png', officialSource: true, verificationStatus: 'FOUND', originalSize: '1024×500', resolution: '509×127', publicationStatus } },
  { brand: 'Roland', product: 'V-02HD MK II', image: { role: 'Perspective', file: 'v-02hd-mk-ii-perspective.webp', alt: 'Roland V-02HD MK II 좌측 45도 원근 이미지', provider: 'Roland', model: 'V-02HD MK II', sourceUrl: 'https://static.roland.com/assets/media/zip/v-02hdmkii_hr_img.zip', officialSource: true, verificationStatus: 'FOUND', originalSize: '4048×2705', resolution: '1800×1203', publicationStatus } },
  { brand: 'Roland', product: 'UVC-01', image: { role: 'Perspective', file: 'uvc-01-perspective.webp', alt: 'Roland UVC-01 우측 45도 원근 이미지', provider: 'Roland', model: 'UVC-01', sourceUrl: 'https://static.roland.com/assets/media/zip/uvc-01_hr_img.zip', officialSource: true, verificationStatus: 'FOUND', originalSize: '3840×2714', resolution: '1210×929', publicationStatus } },
  { brand: 'Epson', product: 'EB-L530U', image: { role: 'Main', file: 'eb-l530u-main.webp', alt: 'Epson EB-L530U 프로젝터 정면 렌즈 방향 대표 이미지', provider: 'Epson', model: 'EB-L530U (V11HA27040)', sourceUrl: 'https://www.epson.co.kr/%EB%B9%84%EC%A6%88%EB%8B%88%EC%8A%A4%EC%9A%A9-%EC%A0%9C%ED%92%88/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%84%B0/%EC%A4%91%ED%98%95-%EA%B0%95%EB%8B%B9-%EB%AF%B8%ED%8C%85%EB%A3%B8-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%84%B0/EB-L530U/p/V11HA27040', officialSource: true, verificationStatus: 'FOUND', originalSize: '690×460', resolution: '686×294', publicationStatus } },
  { brand: 'Audinate', product: 'AVIO USB C', image: { role: 'Main', file: 'avio-usb-c-main.webp', alt: 'Audinate Dante AVIO USB-C 어댑터 RJ45·USB-C 케이블 이미지', provider: 'Audinate', model: 'Dante AVIO USB-C (ADP-USBC-AU-2X2)', sourceUrl: 'https://www.getdante.com/wp-content/uploads/2024/01/AVIO-2CH-USB-C-showConnectors-trans-layers-long-cable.png', officialSource: true, verificationStatus: 'FOUND', originalSize: '2448×1665', resolution: '1561×1071', publicationStatus } },
  { brand: 'Shure', product: 'MXCW640', image: { role: 'Main', file: 'mxcw640-main.webp', alt: 'Shure MXCW640 회의 단말 정면 이미지', provider: 'Shure', model: 'MXCW640', sourceUrl: 'https://www.shure.com/en-US/products/wireless-systems/mxcw/mxcw640', officialSource: true, verificationStatus: 'FOUND', originalSize: '3000×3000', resolution: '1573×675', publicationStatus } },
  { brand: 'NETGEAR', product: 'GSM4248PX', image: { role: 'Rear', file: 'gsm4248px-rear.webp', alt: 'NETGEAR GSM4248PX 후면 포트면 원근 이미지', provider: 'NETGEAR', model: 'GSM4248PX', sourceUrl: 'https://assets.netgear.com/transform/099b30e6-a6c9-4fcb-b29b-388a51fc3688/B6_gsm4248px_32', officialSource: true, verificationStatus: 'FOUND', originalSize: '779×536', resolution: '730×236', publicationStatus } },
  { brand: 'Analog Way', product: 'Aquilon RS1', image: { role: 'Front', file: 'aquilon-rs1-front.webp', alt: 'Analog Way Aquilon RS1 전면 이미지', provider: 'Analog Way', model: 'Aquilon RS1', sourceUrl: 'https://dwn01.analogway.com/Site+Internet/Series/LivePremier/Products/Aquilon+RS1/High+Resolution+Pictures/aquilon-4u-rs1-fav-det.jpg', officialSource: true, verificationStatus: 'FOUND', originalSize: '3175×1772', resolution: '1800×768', publicationStatus } }
];

const identity = (brand, product) => `${brand.toLowerCase()}\0${product.toLowerCase()}`;
const byIdentity = new Map(group2Previews.map(entry => [identity(entry.brand, entry.product), entry]));

// 카탈로그 항목에 붙일 파생 필드. 해당 사진이 없으면 null.
export function previewCatalogFieldsFor(item) {
  const entry = byIdentity.get(identity(item.brand, item.product));
  if (!entry) return null;
  return { preview_image: entry.image.file, preview_image_alt: entry.image.alt, ...(entry.scope ? { preview_image_scope: entry.scope } : {}) };
}
