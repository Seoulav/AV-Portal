export const publicationStatus = '사용자 게시 승인 · 제조사 재사용 권리 미확인';
// Group 2에서 넘어온 사진은 조사 당시 확인된 권리 문구(공식 대리점 구매·계약 기반 사용)를 그대로 유지한다.
const group2PublicationStatus = '사용자 게시 승인 · 공식 대리점 구매·계약 기반 사용';

const imageWith = (rights) => (role, file, alt, provider, model, sourceUrl, originalSize, resolution, verificationStatus = 'FOUND') => ({
  role,
  file,
  alt,
  note: `${role} · 제조사 공식 이미지`,
  provider,
  model,
  sourceUrl,
  officialSource: true,
  verificationStatus,
  originalSize,
  resolution,
  publicationStatus: rights
});
const image = imageWith(publicationStatus);
// Group 2 카드 대표 사진 조사 기록(Work/기록/W-20260925-012-사진조사.md)에서 넘어온 8개 제품 전용.
const group2Image = imageWith(group2PublicationStatus);

export const group1Images = {
  'brc-am7': [
    image('Main', 'brc-am7-main.webp', 'Sony BRC-AM7 검정색 본체 메인 이미지', 'Sony', 'BRC-AM7', 'https://www.sony.com/image/826ea30c6742e760e0c500edc5787dff?fmt=jpeg&wid=1200&hei=720', '1200×720', '1200×720', 'VERIFIED'),
    image('Front', 'brc-am7-front.webp', 'Sony BRC-AM7 검정색 본체 전면 이미지', 'Sony', 'BRC-AM7', 'https://www.sony.com/image/90470eb5cd45473e16b04e7ff772fb9b?fmt=jpeg&wid=1200&hei=720', '1200×720', '1200×720', 'VERIFIED'),
    image('Rear', 'brc-am7-rear.webp', 'Sony BRC-AM7 검정색 본체 후면 단자 이미지', 'Sony', 'BRC-AM7', 'https://www.sony.com/image/ff7d8e54abe4d0be10dbd75baceaff7d?fmt=jpeg&wid=1200&hei=720', '1200×720', '1200×720', 'VERIFIED'),
    image('Perspective', 'brc-am7-perspective.webp', 'Sony BRC-AM7 검정색 본체 원근 이미지', 'Sony', 'BRC-AM7', 'https://www.sony.com/image/e7123a37278e1e6838d2a9d17326cbfc?fmt=jpeg&wid=1200&hei=720', '1200×720', '1200×720', 'VERIFIED')
  ],
  dm7: [
    image('Front', 'dm7-front.webp', 'Yamaha DM7 디지털 믹싱 콘솔 전면 이미지', 'Yamaha', 'DM7', 'https://kr.yamaha.com/ko/files/DM7-front-4000_tcm144-2158404.jpg', '4000×4000', '1800×1800'),
    image('Rear', 'dm7-rear.webp', 'Yamaha DM7 디지털 믹싱 콘솔 후면 단자 이미지', 'Yamaha', 'DM7', 'https://kr.yamaha.com/ko/files/DM7-rear_tcm144-2158567.jpg', '2000×2000', '1800×1800'),
    image('Perspective', 'dm7-perspective.webp', 'Yamaha DM7 디지털 믹싱 콘솔 원근 이미지', 'Yamaha', 'DM7', 'https://kr.yamaha.com/ko/files/DM7-angle-left_tcm144-2159042.jpg', '2000×2000', '1800×1800')
  ],
  'ki-pro-go2': [
    image('Main', 'ki-pro-go2-main.webp', 'AJA Ki Pro GO2 메인 제품 이미지', 'AJA', 'Ki Pro GO2', 'https://d26ddnfpy9hzf8.cloudfront.net/aja-web/public/assets/products/img/728/ki_pro_go_2_product_3600.png', '3600×944', '1800×472'),
    image('Rear', 'ki-pro-go2-rear.webp', 'AJA Ki Pro GO2 후면 연결 단자 이미지', 'AJA', 'Ki Pro GO2', 'https://d26ddnfpy9hzf8.cloudfront.net/aja-web/public/assets/images/products/728/6346-Ki_Pro_Go2_feature_rear.png', '1140×450', '1140×450')
  ],
  'pt-mz17k': [
    image('Front', 'pt-mz17k-front.webp', 'Panasonic PT-MZ17K 프로젝터 전면 이미지', 'Panasonic', 'PT-MZ17K', 'https://eu.connect.panasonic.com/sites/default/files/media/image/2024-04/mz17k_bk_front_low.jpg', '1250×755', '1250×755'),
    image('Perspective', 'pt-mz17k-perspective.webp', 'Panasonic PT-MZ17K 프로젝터 원근 이미지', 'Panasonic', 'PT-MZ17K', 'https://eu.connect.panasonic.com/sites/default/files/media/image/2024-04/mz17k_bk_slant_l_high.jpg', '2500×1536', '1800×1106')
  ],
  'rally-bar': [
    image('Front', 'rally-bar-front.webp', 'Logitech Rally Bar 그래파이트 전면 이미지', 'Logitech', 'Rally Bar', 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/logitech/en/products/video-conferencing/rally-bar/buy/gallery/rally-bar-graphite-01.png?v=1', '1384×1038', '1384×1038'),
    image('Perspective', 'rally-bar-perspective.webp', 'Logitech Rally Bar 그래파이트 원근 이미지', 'Logitech', 'Rally Bar', 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/logitech/en/products/video-conferencing/rally-bar/buy/gallery/rally-bar-graphite-02.png?v=1', '1384×1038', '1384×1038')
  ],
  'mezzo-322-ad': [
    group2Image('Front', 'mezzo-322-ad-front.webp', 'Powersoft Mezzo 계열 공용 전면 패널 이미지(Mezzo 322 AD 제품 페이지 대표 이미지)', 'Powersoft', 'Mezzo 322 AD', 'https://www.powersoft.com/api/media/file/Mezzo322A_gallery-cardL_front-2.png', '1024×500', '509×127')
  ],
  'v-02hd-mk-ii': [
    group2Image('Perspective', 'v-02hd-mk-ii-perspective.webp', 'Roland V-02HD MK II 좌측 45도 원근 이미지', 'Roland', 'V-02HD MK II', 'https://static.roland.com/assets/media/zip/v-02hdmkii_hr_img.zip', '4048×2705', '1800×1203')
  ],
  'uvc-01': [
    group2Image('Perspective', 'uvc-01-perspective.webp', 'Roland UVC-01 우측 45도 원근 이미지', 'Roland', 'UVC-01', 'https://static.roland.com/assets/media/zip/uvc-01_hr_img.zip', '3840×2714', '1210×929')
  ],
  'eb-l530u': [
    group2Image('Main', 'eb-l530u-main.webp', 'Epson EB-L530U 프로젝터 정면 렌즈 방향 대표 이미지', 'Epson', 'EB-L530U (V11HA27040)', 'https://www.epson.co.kr/%EB%B9%84%EC%A6%88%EB%8B%88%EC%8A%A4%EC%9A%A9-%EC%A0%9C%ED%92%88/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%84%B0/%EC%A4%91%ED%98%95-%EA%B0%95%EB%8B%B9-%EB%AF%B8%ED%8C%85%EB%A3%B8-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%84%B0/EB-L530U/p/V11HA27040', '690×460', '686×294')
  ],
  'avio-usb-c': [
    group2Image('Main', 'avio-usb-c-main.webp', 'Audinate Dante AVIO USB-C 어댑터 RJ45·USB-C 케이블 이미지', 'Audinate', 'Dante AVIO USB-C (ADP-USBC-AU-2X2)', 'https://www.getdante.com/wp-content/uploads/2024/01/AVIO-2CH-USB-C-showConnectors-trans-layers-long-cable.png', '2448×1665', '1561×1071')
  ],
  mxcw640: [
    group2Image('Main', 'mxcw640-main.webp', 'Shure MXCW640 회의 단말 정면 이미지', 'Shure', 'MXCW640', 'https://www.shure.com/en-US/products/wireless-systems/mxcw/mxcw640', '3000×3000', '1573×675')
  ],
  gsm4248px: [
    group2Image('Rear', 'gsm4248px-rear.webp', 'NETGEAR GSM4248PX 후면 포트면 원근 이미지', 'NETGEAR', 'GSM4248PX', 'https://assets.netgear.com/transform/099b30e6-a6c9-4fcb-b29b-388a51fc3688/B6_gsm4248px_32', '779×536', '730×236')
  ],
  'aquilon-rs1': [
    group2Image('Front', 'aquilon-rs1-front.webp', 'Analog Way Aquilon RS1 전면 이미지', 'Analog Way', 'Aquilon RS1', 'https://dwn01.analogway.com/Site+Internet/Series/LivePremier/Products/Aquilon+RS1/High+Resolution+Pictures/aquilon-4u-rs1-fav-det.jpg', '3175×1772', '1800×768')
  ]
};

export function applyPublishedImages(product, slug) {
  const images = group1Images[slug];
  if (!images) throw new Error(`Unknown Group 1 image set: ${slug}`);
  product.images = images;
  product.imageStatuses = product.imageStatuses.map(status => {
    const published = images.find(image => image.role === status.role);
    return published ? { ...status, status: published.verificationStatus, sourceUrl: published.sourceUrl } : status;
  });
  Object.assign(product.presentation, {
    visualVariant: 'official-product-images',
    galleryRightsBadge: '사용자 게시 승인 · 권리 확인 필요',
    galleryFootNote: '제조사 공식 제품 이미지',
    galleryRights: '사용자가 AV Portal 게시를 승인했습니다. 제조사 재사용 권리와 별도 재배포 권리는 미확인 상태입니다.'
  });
  return product;
}

// Library 카드에 쓰는 대표 이미지. group1Images의 파일명 중 하나여야 한다.
export const cardImages = {
  'brc-am7': 'brc-am7-main.webp',
  dm7: 'dm7-perspective.webp',
  'ki-pro-go2': 'ki-pro-go2-main.webp',
  'pt-mz17k': 'pt-mz17k-perspective.webp',
  'rally-bar': 'rally-bar-front.webp',
  'mezzo-322-ad': 'mezzo-322-ad-front.webp',
  'v-02hd-mk-ii': 'v-02hd-mk-ii-perspective.webp',
  'uvc-01': 'uvc-01-perspective.webp',
  'eb-l530u': 'eb-l530u-main.webp',
  'avio-usb-c': 'avio-usb-c-main.webp',
  mxcw640: 'mxcw640-main.webp',
  gsm4248px: 'gsm4248px-rear.webp',
  'aquilon-rs1': 'aquilon-rs1-front.webp'
};
